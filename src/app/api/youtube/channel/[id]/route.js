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

    try {
      const livePage = await channel.getLiveStreams();
      
      if (livePage.videos && livePage.videos.length > 0) {
        const live = livePage.videos[0];
        liveTitle = live.title?.text || "";
        
        // 라이브 여부 확인을 위한 플래그 (기본값 false)
        let isCurrentlyLive = false;
        
        // 라이브 페이지에서 시청자 수 추출 (여러 경로 시도)
        // view_count가 Text 객체인 경우 처리
        let viewCountText = null;
        if (live.view_count) {
          if (typeof live.view_count === 'number') {
            viewerCount = live.view_count;
            isCurrentlyLive = true; // 숫자 형태면 라이브 중
          } else if (typeof live.view_count === 'string') {
            viewCountText = live.view_count;
          } else if (live.view_count.text) {
            // Text 객체인 경우
            viewCountText = live.view_count.text;
          }
        }
        
        // 텍스트에서 시청자 수 추출 (watching만 인식, views는 무시)
        if (viewCountText) {
          // "watching"이 포함되어 있으면 라이브 중
          if (viewCountText.toLowerCase().includes('watching')) {
            isCurrentlyLive = true;
            // "4,954 watching" 형식에서 숫자 추출
            const match = viewCountText.match(/([\d,.]+)([KMB])?/);
            if (match) {
              let num = parseFloat(match[1].replace(/,/g, ''));
              const multiplier = match[2];
              if (multiplier === 'K') num *= 1000;
              else if (multiplier === 'M') num *= 1000000;
              else if (multiplier === 'B') num *= 1000000000;
              viewerCount = Math.floor(num);
            }
          } else if (viewCountText.toLowerCase().includes('views')) {
            // "30,000 views"는 전체 조회수이므로 라이브 아님
            isCurrentlyLive = false;
            viewerCount = 0;
          }
        } else if (live.viewers?.text) {
          isCurrentlyLive = true;
          const match = live.viewers.text.match(/[\d,]+/);
          viewerCount = match ? parseInt(match[0].replace(/,/g, '')) : 0;
        } else if (live.short_view_count_text?.text) {
          const text = live.short_view_count_text.text;
          if (text.toLowerCase().includes('watching')) {
            isCurrentlyLive = true;
            const match = text.match(/([\d,.]+)([KMB])?/);
            if (match) {
              let num = parseFloat(match[1].replace(/,/g, ''));
              const multiplier = match[2];
              if (multiplier === 'K') num *= 1000;
              else if (multiplier === 'M') num *= 1000000;
              else if (multiplier === 'B') num *= 1000000000;
              viewerCount = Math.floor(num);
            }
          }
        }
        
        // 라이브 중일 때만 정보 설정
        if (isCurrentlyLive) {
          isLive = true;
          
          // getInfo()로 정확한 시작 시간 가져오기 (파서 경고 무시)
          try {
            const info = await youtube.getInfo(live.id);
            
            if (info.basic_info?.start_timestamp) {
              const timestamp = info.basic_info.start_timestamp;
              if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                  startTime = date.toISOString();
                }
              } else if (typeof timestamp === 'number') {
                const MIN_TIMESTAMP = 0;
                const MAX_TIMESTAMP = 4102444800; // 2100-01-01
                if (timestamp >= MIN_TIMESTAMP && timestamp <= MAX_TIMESTAMP) {
                  startTime = new Date(timestamp * 1000).toISOString();
                }
              } else if (timestamp instanceof Date) {
                startTime = timestamp.toISOString();
              }
            }
          } catch (infoErr) {
            // getInfo() 실패 시 아래에서 현재 시간 사용
          }
          
          // 시작 시간을 못 가져온 경우 현재 시간 사용
          if (!startTime) {
            startTime = new Date().toISOString();
          }
          
          liveVideo = {
            title: liveTitle,
            id: live.id,
            views: viewerCount,
            startTime: startTime,
          };
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
    });
  } catch (error) {
    console.error("❌ [YouTube API] 채널 정보 가져오기 실패:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel", message: error.message },
      { status: 500 }
    );
  }
}
