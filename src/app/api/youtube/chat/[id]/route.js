import { NextResponse } from "next/server";

// 채팅 스트림을 SSE로 전송
export async function GET(request, context) {
  try {
    const params = await context.params;
    const liveId = params.id;

    if (!liveId) {
      return NextResponse.json(
        { error: "Live ID is required" },
        { status: 400 }
      );
    }

    // Server-Sent Events 설정
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        
        const safeEnqueue = (data) => {
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              isClosed = true;
            }
          }
        };
        
        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        };
        
        try {
          console.log(`🔄 [YouTube Chat API] 채팅 스트림 시작: ${liveId}`);
          
          // youtube-chat는 서버에서도 작동
          const { LiveChat } = await import("youtube-chat");
          
          const liveChat = new LiveChat({ liveId });

          liveChat.on("start", (id) => {
            console.log(`✅ [YouTube Chat API] 채팅 시작: ${id}`);
            const data = `data: ${JSON.stringify({ type: "start", id })}\n\n`;
            safeEnqueue(data);
          });

          liveChat.on("chat", (chatItem) => {
            const data = `data: ${JSON.stringify({ type: "chat", data: chatItem })}\n\n`;
            safeEnqueue(data);
          });

          liveChat.on("end", (reason) => {
            console.log(`⏹️ [YouTube Chat API] 채팅 종료: ${reason}`);
            const data = `data: ${JSON.stringify({ type: "end", reason })}\n\n`;
            safeEnqueue(data);
            safeClose();
          });

          liveChat.on("error", (error) => {
            console.error("❌ [YouTube Chat API] 에러:", error);
            const data = `data: ${JSON.stringify({ type: "error", error: error.message || String(error) })}\n\n`;
            safeEnqueue(data);
          });

          const started = await liveChat.start();
          console.log(`🎬 [YouTube Chat API] start() 결과: ${started}`);
          
          if (!started) {
            console.error("❌ [YouTube Chat API] 채팅 시작 실패");
            const data = `data: ${JSON.stringify({ type: "error", error: "Failed to start chat" })}\n\n`;
            safeEnqueue(data);
            safeClose();
          }

          // 연결 종료 처리
          request.signal.addEventListener("abort", () => {
            console.log("🔌 [YouTube Chat API] 클라이언트 연결 종료");
            liveChat.stop();
            safeClose();
          });
        } catch (error) {
          console.error("❌ [YouTube Chat API] 초기화 실패:", error);
          console.error("❌ [YouTube Chat API] 에러 상세:", error.stack);
          const data = `data: ${JSON.stringify({ type: "error", error: error.message || String(error) })}\n\n`;
          safeEnqueue(data);
          safeClose();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("❌ [YouTube Chat API] 채팅 스트림 실패:", error);
    return NextResponse.json(
      { error: "Failed to start chat stream", message: error.message },
      { status: 500 }
    );
  }
}
