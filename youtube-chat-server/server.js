import express from 'express';
import { WebSocketServer } from 'ws';
import { LiveChat } from 'youtube-chat';
import cors from 'cors';
import axios from 'axios';

// axios 기본 User-Agent 설정 (YouTube 차단 방지)
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ARGB 정수 → #RRGGBB 변환
function argbToHex(colorNum) {
  if (!colorNum || typeof colorNum !== 'number') return null;
  const hex = colorNum.toString(16).padStart(8, '0').slice(2).toUpperCase();
  return /^[0-9A-F]{6}$/.test(hex) ? `#${hex}` : null;
}

// YouTube get_live_chat API 응답에서 슈퍼챗 원본 데이터를 가로채 보관
// 라이브러리가 superchat 필드를 누락하거나 색상을 잘못 파싱하는 경우를 보완
const superchatRawCache = new Map();

axios.interceptors.response.use((response) => {
  try {
    if (!response.config.url?.includes('get_live_chat')) return response;
    const actions = response.data?.continuationContents?.liveChatContinuation?.actions;
    if (!Array.isArray(actions)) return response;
    actions.forEach((action) => {
      const r = action?.addChatItemAction?.item?.liveChatPaidMessageRenderer;
      if (!r?.id) return;
      const amount = r.purchaseAmountText?.simpleText;
      if (!amount) return;
      // headerBackgroundColor를 우선 사용 (vibrant color), 없으면 body 사용
      const color =
        argbToHex(r.headerBackgroundColor) ||
        argbToHex(r.bodyBackgroundColor) ||
        '#1565C0';
      superchatRawCache.set(r.id, { amount, color });
      // 캐시 크기 제한
      if (superchatRawCache.size > 200) {
        superchatRawCache.delete(superchatRawCache.keys().next().value);
      }
    });
  } catch (_) {}
  return response;
});

const app = express();
const PORT = process.env.PORT || 47200;

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

  // WebSocket keepalive ping
  const keepaliveInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30000);

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
            // 캐시에서 슈퍼챗 원본 데이터 조회 (라이브러리 파싱 실패 보완)
            const raw = superchatRawCache.get(chatItem.id);
            if (raw) {
              if (!chatItem.superchat) {
                // 라이브러리가 superchat 필드 설정 안 한 경우
                chatItem.superchat = raw;
              } else {
                // 라이브러리가 설정했지만 색상이 잘못된 경우 headerColor로 교체
                if (!chatItem.superchat.color || !/^#[0-9A-Fa-f]{6}$/i.test(chatItem.superchat.color)) {
                  chatItem.superchat.color = raw.color;
                }
              }
              superchatRawCache.delete(chatItem.id);
            }
            // 최종 방어: superchat이 있는데 색상이 여전히 이상한 경우
            if (chatItem.superchat && !/^#[0-9A-Fa-f]{6}$/i.test(chatItem.superchat.color || '')) {
              chatItem.superchat.color = '#1565C0';
            }
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
    clearInterval(keepaliveInterval);
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
