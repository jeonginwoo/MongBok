import express from 'express';
import { WebSocketServer } from 'ws';
import { LiveChat } from 'youtube-chat';
import cors from 'cors';
import axios from 'axios';

// axios 기본 User-Agent 설정 (YouTube 차단 방지)
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 설정
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// HTTP 서버 시작
const server = app.listen(PORT, () => {
  console.log(`✅ YouTube Chat Server running on port ${PORT}`);
});

// WebSocket 서버 생성
const wss = new WebSocketServer({ server });

// 활성 채팅 세션 관리
const activeSessions = new Map();

wss.on('connection', (ws) => {
  console.log('🔌 클라이언트 연결됨');
  
  let currentLiveChatInstance = null;
  let currentLiveId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'start' && data.liveId) {
        const liveId = data.liveId;
        console.log(`🚀 채팅 스트림 시작 요청: ${liveId}`);
        
        // 기존 세션 정리
        if (currentLiveChatInstance) {
          currentLiveChatInstance.stop();
          currentLiveChatInstance = null;
        }
        
        currentLiveId = liveId;
        
        try {
          const liveChat = new LiveChat({ liveId });
          currentLiveChatInstance = liveChat;
          
          liveChat.on('start', (id) => {
            console.log(`✅ 채팅 시작: ${id}`);
            ws.send(JSON.stringify({ type: 'start', id }));
          });
          
          liveChat.on('chat', (chatItem) => {
            ws.send(JSON.stringify({ type: 'chat', data: chatItem }));
          });
          
          liveChat.on('end', (reason) => {
            console.log(`⏹️ 채팅 종료: ${reason}`);
            ws.send(JSON.stringify({ type: 'end', reason }));
          });
          
          liveChat.on('error', (error) => {
            console.error('❌ 채팅 에러:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: error.message || String(error) 
            }));
          });
          
          const started = await liveChat.start();
          
          if (!started) {
            console.error('❌ 채팅 시작 실패');
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Failed to start chat - Live stream not found or chat disabled' 
            }));
          }
        } catch (error) {
          console.error('❌ LiveChat 초기화 실패:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            error: error.message 
          }));
        }
      } else if (data.type === 'stop') {
        console.log('⏹️ 채팅 스트림 중지 요청');
        if (currentLiveChatInstance) {
          currentLiveChatInstance.stop();
          currentLiveChatInstance = null;
          currentLiveId = null;
        }
      }
    } catch (error) {
      console.error('❌ 메시지 처리 실패:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Invalid message format' 
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 클라이언트 연결 종료');
    if (currentLiveChatInstance) {
      currentLiveChatInstance.stop();
      currentLiveChatInstance = null;
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket 에러:', error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM 신호 수신, 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버 종료 완료');
    process.exit(0);
  });
});
