import express from 'express';
import { WebSocketServer } from 'ws';
import { LiveChat } from 'youtube-chat';
import cors from 'cors';
import axios from 'axios';
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import readline from 'readline';
import 'dotenv/config';

// 예상치 못한 크래시도 로그로 남기고 바로 꺼지지 않도록 처리
function fatalExit(label, err) {
  const msg = `\n[${label}] ${err?.stack || err}\n`;
  process.stderr.write(msg);
  try { writeFileSync('./crash.log', new Date().toISOString() + msg, { flag: 'a' }); } catch (_) {}
  console.log('10초 후 자동으로 종료됩니다...');
  setTimeout(() => process.exit(1), 10000);
}

process.on('uncaughtException', (err) => fatalExit('uncaughtException', err));
process.on('unhandledRejection', (reason) => fatalExit('unhandledRejection', reason));

// __SERVER_VERSION__: 빌드 시 bundle.mjs의 esbuild define으로 주입
// dev 모드(node server.js)에서는 package.json에서 직접 읽음
let SERVER_VERSION;
try {
  SERVER_VERSION = __SERVER_VERSION__; // eslint-disable-line no-undef
} catch {
  SERVER_VERSION = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8')
  ).version;
}

// Innertube 인스턴스 캐싱
let cachedYoutube = null;
let youtubeInitPromise = null;

async function getYoutubeInstance() {
  if (cachedYoutube) return cachedYoutube;
  if (youtubeInitPromise) return youtubeInitPromise;
  youtubeInitPromise = (async () => {
    try {
      const { Innertube, Log } = await import('youtubei.js');
      Log.setLevel(Log.Level.ERROR);
      cachedYoutube = await Innertube.create();
      console.log('✅ [YouTube] Innertube 초기화 완료');
      return cachedYoutube;
    } catch (e) {
      youtubeInitPromise = null;
      throw e;
    }
  })();
  return youtubeInitPromise;
}

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
const APP_URL = process.env.APP_URL || "https://mongbok.vercel.app";

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
  res.json({ status: 'ok', version: SERVER_VERSION, timestamp: new Date().toISOString() });
});

// YouTube 채널 정보 조회 (Vercel 대신 로컬 IP로 YouTube 호출)
app.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const youtube = await getYoutubeInstance();

    const channel = await youtube.getChannel(channelId).catch((err) => {
      console.error('youtube channel fetch error:', err);
      return null;
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channelName =
      channel.header?.author?.name ||
      channel.metadata?.title ||
      channel.header?.page_header_view_model?.title?.dynamic_text_view_model?.text?.content ||
      'Unknown';

    let liveVideo = null;
    let isLive = false;
    let viewerCount = 0;
    let liveTitle = '';
    let startTime = null;
    let lastLiveInfo = null;

    const extractViewerCount = (video) => {
      if (typeof video.view_count === 'number') return { isLive: true, count: video.view_count };
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
        if (lower.includes('views')) return { isLive: false, count: 0 };
      }
      if (video.is_live) return { isLive: true, count: 0 };
      return { isLive: false, count: 0 };
    };

    const livePage = await raceTimeout(channel.getLiveStreams().catch(() => null), 10000);

    if (livePage) {
      let bestLive = null;
      let bestCount = -1;

      // youtubei.js 16.0.1+ 구조 대응
      const contents = livePage.current_tab?.content?.contents || livePage.current_tab?.content?.videos || livePage.videos || [];

      for (const item of contents) {
        let video = null;

        if (item.type === 'RichItem' && item.content) {
          const c = item.content;
          if (c.type === 'LockupView') {
            const liveText =
              c.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text?.text ||
              c.metadata?.metadata?.[0]?.metadata_rows?.[0]?.metadata_items?.[0]?.text?.text;
            video = {
              id: c.content_id,
              title: { text: c.metadata?.title?.text },
              is_live: c.content_image?.overlays?.some((o) =>
                o.badges?.some((b) => b.text === 'LIVE' || b.badge_style?.includes('LIVE'))
              ),
              view_count: liveText,
            };
          }
 else {
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
        liveTitle = bestLive.title?.text || '';
        const videoId = bestLive.id || bestLive.videoId;

        const infoForStart = await raceTimeout(
          youtube.getInfo(videoId).catch(() => null),
          5000
        );
        startTime = infoForStart ? parseTimestamp(infoForStart.basic_info?.start_timestamp) : null;

        liveVideo = { title: liveTitle, id: videoId, views: viewerCount, startTime };
      }

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

    res.json({
      channel: {
        id: channelId,
        name: channelName,
        url: `https://www.youtube.com/channel/${channelId}`,
        iconURL: channel.header?.author?.best_thumbnail?.url || channel.metadata?.avatar?.[0]?.url || '',
        subscribers: channel.header?.subscribers?.text || '0',
        verified: channel.header?.author?.is_verified || false,
      },
      liveVideo,
      isLive,
      viewerCount,
      lastLiveInfo,
    });
  } catch (error) {
    console.error('❌ [YouTube] 채널 정보 가져오기 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// HTTP 서버 시작
const server = app.listen(PORT, () => {
  console.log(`✅ YouTube Chat Server v${SERVER_VERSION} running on port ${PORT}`);

  // 앱 배포 서버에서 필요 버전 확인
  axios.get(`${APP_URL}/api/youtube/server-version`)
    .then(({ data }) => {
      const required = data?.requiredVersion;
      if (required && required !== SERVER_VERSION) {
        console.warn(`⚠️  버전 불일치! 현재: v${SERVER_VERSION} / 필요: v${required}`);
        console.warn(`⚠️  최신 버전을 다운로드해주세요: ${APP_URL}`);
      } else {
        console.log('✅ 서버 버전이 최신입니다.');
      }
    })
    .catch(() => {
      console.log('ℹ️  버전 확인 실패 (네트워크 없음 또는 야하 중)');
    });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ 포트 ${PORT}이 이미 사용 중입니다.`);
    console.error(`❌ 실행 중인 다른 채팅 서버를 먼저 종료한 뒤 다시 실행해주세요.\n`);
  } else {
    console.error('❌ 서버 오류:', err.message);
  }

  if (process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Press Enter to exit...', () => {
      rl.close();
      process.exit(1);
    });
  } else {
    console.log('10초 후 자동으로 종료됩니다...');
    setTimeout(() => process.exit(1), 10000);
  }
});

// WebSocket 서버 생성
const wss = new WebSocketServer({ server });

// ws 라이브러리가 HTTP 서버 error를 wss로 재전달하므로 핸들러 등록 필수
// (없으면 EADDRINUSE 시 uncaught exception으로 즉시 크래시)
wss.on('error', () => { /* server.on('error') 에서 이미 처리 */ });

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
        let channelName = liveId;
        try {
          const youtube = await getYoutubeInstance();
          const videoInfo = await youtube.getInfo(liveId).catch(() => null);
          channelName =
            videoInfo?.basic_info?.author ||
            videoInfo?.video_details?.author ||
            videoInfo?.basic_info?.owner?.name ||
            liveId;
        } catch (_) {
          channelName = liveId;
        }

        console.log(`🚀 채팅 스트림 시작 요청: ${channelName}`);
        
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
            console.log(`✅ 채팅 시작: ${channelName}`);
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
