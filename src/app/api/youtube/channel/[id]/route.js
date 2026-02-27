import { NextResponse } from "next/server";
import { getYoutubeInstance } from "@/utils/youtube";

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

    // 채널 정보 가져오기
    const channel = await youtube.getChannel(channelId).catch((err) => {
      console.error("youtube channel fetch error:", err);
      return null;
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
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
      // view_count가 숫자인 경우
      if (typeof video.view_count === 'number') {
        return { isLive: true, count: video.view_count };
      }

      // 텍스트 소스 후보 목록
      const textSources = [
        typeof video.view_count === 'string' ? video.view_count : video.view_count?.text,
        video.viewers?.text,
        video.short_view_count_text?.text,
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
          // 전체 조회수 = 라이브 아님
          return { isLive: false, count: 0 };
        }
      }
      return { isLive: false, count: 0 };
    };

    try {
      const livePage = await channel.getLiveStreams();

      if (livePage.videos && livePage.videos.length > 0) {
        // 전체 라이브 목록에서 현재 라이브 중인 영상 중 시청자 수가 가장 많은 것 선택
        let bestLive = null;
        let bestCount = -1;

        for (const video of livePage.videos) {
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

          // getInfo()로 정확한 시작 시간 가져오기
          try {
            const info = await youtube.getInfo(bestLive.id);
            if (info.basic_info?.start_timestamp) {
              const timestamp = info.basic_info.start_timestamp;
              if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) startTime = date.toISOString();
              } else if (typeof timestamp === 'number') {
                const MAX_TIMESTAMP = 4102444800; // 2100-01-01
                if (timestamp >= 0 && timestamp <= MAX_TIMESTAMP) {
                  startTime = new Date(timestamp * 1000).toISOString();
                }
              } else if (timestamp instanceof Date) {
                startTime = timestamp.toISOString();
              }
            }
          } catch (infoErr) {
          }

          liveVideo = {
            title: liveTitle,
            id: bestLive.id,
            views: viewerCount,
            startTime: startTime,
          };
        }
      }
      // 라이브 중이 아닐 때 마지막 완료된 라이브 정보 조회
      if (!isLive && livePage?.videos?.length > 0) {
        // getLiveStreams() 결과에서 시청자수 텍스트가 없는(완료된) 라이브 VOD 탐색
        const completedCandidates = livePage.videos.filter((v) => {
          const textSources = [
            typeof v.view_count === 'string' ? v.view_count : v.view_count?.text,
            v.viewers?.text,
            v.short_view_count_text?.text,
          ];
          return textSources.some((t) => t && t.toLowerCase().includes('views'));
        });

        const candidate = completedCandidates[0] ?? livePage.videos[0];
        if (candidate?.id) {
          try {
            const info = await youtube.getInfo(candidate.id);
            const ts = info.basic_info?.start_timestamp;
            const dur = info.basic_info?.duration; // seconds

            let lastStart = null;
            if (typeof ts === 'string') {
              const d = new Date(ts);
              if (!isNaN(d.getTime())) lastStart = d.toISOString();
            } else if (typeof ts === 'number' && ts > 0 && ts <= 4102444800) {
              lastStart = new Date(ts * 1000).toISOString();
            } else if (ts instanceof Date) {
              lastStart = ts.toISOString();
            }

            if (lastStart) {
              const lastEnd =
                typeof dur === 'number' && dur > 0
                  ? new Date(new Date(lastStart).getTime() + dur * 1000).toISOString()
                  : null;
              lastLiveInfo = { startTime: lastStart, closeDate: lastEnd };
            }
          } catch (_) {
            // 무시
          }
        }
      }
    } catch (e) {
      // No live stream found
    }

    return NextResponse.json({
      channel: {
        id: channelId,
        name: channelName,
        url: `https://www.youtube.com/channel/${channelId}`,
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
    return NextResponse.json(
      { error: "Failed to fetch channel", message: error.message },
      { status: 500 }
    );
  }
}
