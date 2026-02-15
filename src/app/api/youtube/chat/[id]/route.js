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
          // youtube-chat는 서버에서도 작동
          const { LiveChat } = await import("youtube-chat");
          
          const liveChat = new LiveChat({ liveId });

          liveChat.on("start", (id) => {
            const data = `data: ${JSON.stringify({ type: "start", id })}\n\n`;
            safeEnqueue(data);
          });

          liveChat.on("chat", (chatItem) => {
            const data = `data: ${JSON.stringify({ type: "chat", data: chatItem })}\n\n`;
            safeEnqueue(data);
          });

          liveChat.on("end", (reason) => {
            const data = `data: ${JSON.stringify({ type: "end", reason })}\n\n`;
            safeEnqueue(data);
            safeClose();
          });

          liveChat.on("error", (error) => {
            console.error("❌ [YouTube Chat API] 에러:", error);
            const data = `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`;
            safeEnqueue(data);
          });

          const started = await liveChat.start();
          if (!started) {
            safeClose();
          }

          // 연결 종료 처리
          request.signal.addEventListener("abort", () => {
            liveChat.stop();
            safeClose();
          });
        } catch (error) {
          console.error("❌ [YouTube Chat API] 초기화 실패:", error);
          const data = `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`;
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
