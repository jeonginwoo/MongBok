import { NextResponse } from "next/server";
import { getYoutubeInstance } from "@/utils/youtube";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword is required" },
        { status: 400 }
      );
    }

    // 캐시된 Innertube 인스턴스 사용
    const youtube = await getYoutubeInstance();

    const searchResults = await youtube.search(keyword, {
      type: "channel",
    }).catch((err) => {
      console.error("YouTube search error:", err);
      return { channels: [] };
    });

    const channels = (searchResults.channels || []).slice(0, 5).map((channel) => ({
      id: channel.id,
      name: channel.author?.name || "Unknown",
      url: `https://www.youtube.com/channel/${channel.id}`,
      iconURL: channel.author?.best_thumbnail?.url || "",
      subscribers: channel.subscribers?.text || "0",
      verified: channel.author?.is_verified || false,
    }));

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("❌ [YouTube API] 검색 실패:", error.message || error);
    // 에러 발생 시에도 빈 배열 반환 (500 에러 대신)
    return NextResponse.json({ channels: [] }, { status: 200 });
  }
}
