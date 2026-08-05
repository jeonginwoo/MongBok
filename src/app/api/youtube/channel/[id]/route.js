import { NextResponse } from "next/server";
import { getYoutubeInstance } from "@/utils/youtube";

const raceTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const parseTimestamp = (ts) => {
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  } else if (typeof ts === 'number' && ts >= 0 && ts <= 4102444800) {
    return new Date(ts * 1000).toISOString();
  } else if (ts instanceof Date) {
    return ts.toISOString();
  }
  return null;
};

export async function GET(request, context) {
  try {
    const params = await context.params;
    const channelId = params.id;

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID is required" },
        { status: 400 }
      );
    }

    // 캐시된 Innertube 인스턴스 사용
    const youtube = await getYoutubeInstance();

    let targetId = channelId;

    // 핸들(@handle)인 경우 채널 ID로 변환 시도
    if (channelId.startsWith('@')) {
      try {
        const resolved = await youtube.resolveURL(`https://www.youtube.com/${channelId}`);
        if (resolved.payload?.browseId) {
          targetId = resolved.payload.browseId;
        }
      } catch (err) {
        console.error("youtube handle resolution error:", err);
        // 실패 시 원래 ID로 진행 (getChannel에서 에러 처리됨)
      }
    }

    // 채널 정보 가져오기
    const channel = await youtube.getChannel(targetId).catch((err) => {
      console.error("youtube channel fetch error:", err);
      return null;
    });

    if (!channel) {
      // fail-soft: 소비측(live.js)이 channel 부재를 판단하므로 404 대신 빈 데이터 200
      return NextResponse.json({
        channel: null,
        liveVideo: null,
        isLive: false,
        viewerCount: 0,
        lastLiveInfo: null,
      });
    }

    // 채널 이름 추출 (여러 경로 시도)
    const channelName = 
      channel.header?.author?.name || 
      channel.metadata?.title || 
      channel.header?.page_header_view_model?.title?.dynamic_text_view_model?.text?.content ||
      channel.header?.c4TabbedHeader?.title ||
      "Unknown";

    // 라이브 스트림 확인
    let liveVideo = null;
    let isLive = false;
    let viewerCount = 0;
    let liveTitle = "";
    let startTime = null;
    let lastLiveInfo = null;

    // 라이브 영상의 시청자 수 텍스트에서 숫자 추출 헬퍼
    const extractViewerCount = (video) => {
      if (typeof video.view_count === 'number') {
        return { isLive: true, count: video.view_count };
      }

      const textSources = [
        typeof video.view_count === 'string' ? video.view_count : video.view_count?.text,
        video.viewers?.text,
        video.short_view_count_text?.text,
        video.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text,
        video.metadata?.metadata?.[0]?.metadata_rows?.[0]?.metadata_items?.[0]?.text?.text,
      ];

      for (const text of textSources) {
        if (!text) continue;
        const lower = text.toLowerCase();
        if (lower.includes('watching')) {
          const match = text.match(/([\d,.]+)([KMB])?/);
          if (match) {
            let num = parseFloat(match[1].replace(/,/g, ''));
            if (match[2] === 'K') num *= 1000;
            else if (match[2] === 'M') num *= 1000000;
            else if (match[2] === 'B') num *= 1000000000;
            return { isLive: true, count: Math.floor(num) };
          }
          return { isLive: true, count: 0 };
        }
        if (lower.includes('views')) {
          return { isLive: false, count: 0 };
        }
      }

      if (video.is_live) {
        return { isLive: true, count: 0 };
      }

      return { isLive: false, count: 0 };
    };

    const livePage = await raceTimeout(channel.getLiveStreams().catch(() => null), 10000);

    if (livePage) {
      // 전체 라이브 목록에서 현재 라이브 중인 영상 중 시청자 수가 가장 많은 것 선택
      let bestLive = null;
      let bestCount = -1;

      // youtubei.js 16.0.1+ 구조 대응 (current_tab.content.contents)
      const contents = livePage.current_tab?.content?.contents || livePage.current_tab?.content?.videos || livePage.videos || [];

      for (const item of contents) {
        let video = null;
        let isLiveBadge = false;

        // RichItem(LockupView) 또는 Video 객체 추출
        if (item.type === 'RichItem' && item.content) {
          const c = item.content;
          if (c.type === 'LockupView') {
            const liveText =
              c.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text ||
              c.metadata?.metadata?.[0]?.metadata_rows?.[0]?.metadata_items?.[0]?.text?.text;
            video = {
              id: c.content_id,
              title: { text: c.metadata?.title?.text },
              thumbnails: c.content_image?.image?.thumbnails || [],
              is_live: c.content_image?.overlays?.some((o) =>
                o.badges?.some((b) => b.text === 'LIVE' || b.badge_style?.includes('LIVE'))
              ),
              view_count: liveText,
            };
            } else {
            video = c;
            }
            } else {
            video = item;
            }

            if (!video || (!video.id && !video.videoId)) continue;

            const { isLive: currentlyLive, count } = extractViewerCount(video);
            if (currentlyLive && count > bestCount) {
            bestCount = count;
            bestLive = video;
            }
            }

            if (bestLive) {
            isLive = true;
            viewerCount = bestCount;
            liveTitle = bestLive.title?.text || "";
            const videoId = bestLive.id || bestLive.videoId;

            // getInfo()로 정확한 시작 시간 가져오기 (5초 타임아웃, 실패해도 liveVideo는 유지)
            const infoForStart = await raceTimeout(
              youtube.getInfo(videoId).catch(() => null),
              5000
            );
            startTime = infoForStart ? parseTimestamp(infoForStart.basic_info?.start_timestamp) : null;

            liveVideo = {
              title: liveTitle,
              id: videoId,
              views: viewerCount,
              startTime,
              thumbnails: bestLive.thumbnails && bestLive.thumbnails.length > 0
                ? bestLive.thumbnails.map(t => ({ url: t.url, width: t.width, height: t.height }))
                : (bestLive.best_thumbnail 
                    ? [{ url: bestLive.best_thumbnail.url, width: bestLive.best_thumbnail.width, height: bestLive.best_thumbnail.height }]
                    : [{ url: `https://i.ytimg.com/vi/${videoId}/hqdefault_live.jpg` }]
                  ),
            };
            }

      // 라이브 중이 아닐 때 마지막 완료된 라이브 정보 조회
      if (!isLive && contents.length > 0) {
        const completedCandidates = contents.map(item => {
          if (item.type === 'RichItem' && item.content) return item.content;
          return item;
        }).filter((v) => {
          if (!v) return false;
          const textSources = [
            typeof v.view_count === 'string' ? v.view_count : v.view_count?.text,
            v.viewers?.text,
            v.short_view_count_text?.text,
          ];
          return textSources.some((t) => t && t.toLowerCase().includes('views'));
        });

        const firstItem = contents[0]?.type === 'RichItem' ? contents[0].content : contents[0];
        const candidate = completedCandidates[0] ?? firstItem;
        const candidateId = candidate?.id || candidate?.content_id || candidate?.videoId;
        
        if (candidateId) {
          const infoForLast = await raceTimeout(
            youtube.getInfo(candidateId).catch(() => null),
            5000
          );
          if (infoForLast) {
            const lastStart = parseTimestamp(infoForLast.basic_info?.start_timestamp);
            if (lastStart) {
              const dur = infoForLast.basic_info?.duration;
              const lastEnd =
                typeof dur === 'number' && dur > 0
                  ? new Date(new Date(lastStart).getTime() + dur * 1000).toISOString()
                  : null;
              lastLiveInfo = { startTime: lastStart, closeDate: lastEnd };
            }
          }
        }
      }
    }

    return NextResponse.json({
      channel: {
        id: targetId,
        name: channelName,
        url: `https://www.youtube.com/channel/${targetId}`,
        iconURL: channel.header?.author?.best_thumbnail?.url || 
                 channel.metadata?.avatar?.[0]?.url || "",
        subscribers: channel.header?.subscribers?.text || "0",
        verified: channel.header?.author?.is_verified || false,
      },
      liveVideo,
      isLive,
      viewerCount,
      lastLiveInfo,
    });
  } catch (error) {
    console.error("❌ [YouTube API] 채널 정보 가져오기 실패:", error);
    // fail-soft: 플랫폼 하나의 장애가 전체 화면을 깨지 않도록 500 대신 빈 데이터 200
    return NextResponse.json({
      channel: null,
      liveVideo: null,
      isLive: false,
      viewerCount: 0,
      lastLiveInfo: null,
    });
  }
}
