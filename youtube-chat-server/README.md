# YouTube Chat WebSocket Server

YouTube 라이브 채팅을 WebSocket으로 스트리밍하는 독립 서버입니다.

## 무료 배포 옵션 비교

| 플랫폼 | 비용 | Sleep 모드 | Wake-up 시간 | 설정 난이도 | 추천도 |
|--------|------|-----------|-------------|-----------|--------|
| **Render** | 무료 (750h/월) | 15분 비활성 시 | 10-30초 | 쉬움 | ⭐⭐⭐⭐ |
| **Fly.io** | 무료 (3 VMs) | 비활성 시 | 즉시 | 중간 | ⭐⭐⭐⭐⭐ |
| **Glitch** | 완전 무료 | 5분 비활성 시 | 5-10초 | 쉬움 | ⭐⭐⭐ |
| **Railway** | $5/월 | 없음 | - | 쉬움 | ⭐⭐⭐⭐ |

**최종 권장:** 
- **Render + UptimeRobot** (가장 간단, 무료)
- **Fly.io** (빠른 wake-up, 무료)

**💡 Tip:** 무료 플랜 사용 시 [UptimeRobot](https://uptimerobot.com/)으로 5분마다 ping 보내면 항상 활성 상태 유지

## 배포 방법

### 1. Render (무료 플랜 가능) ⭐ 추천

1. [Render](https://render.com/) 가입 및 로그인
2. "New Web Service" 클릭
3. GitHub 리포지토리 연결
4. 설정:
   - **Root Directory:** `youtube-chat-server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. 배포 완료 후 URL 확인

**비용:** 무료 (750시간/월, 약 31일)
**제약:** 15분 비활성 시 sleep 모드 (첫 요청 시 10-30초 소요)

### 2. Fly.io (무료 플랜) ⭐ 최고 추천

1. [Fly.io](https://fly.io/) 가입
2. Fly CLI 설치:
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```
3. 로그인 및 배포:
   ```bash
   cd youtube-chat-server
   fly auth login
   fly launch --copy-config --yes
   fly deploy
   ```
4. 배포 완료 후 URL 확인:
   ```bash
   fly status
   ```

**비용:** 무료 (3개 shared-cpu VMs, 총 3GB RAM)
**장점:** 빠른 wake-up (거의 즉시), 무료 플랜 제한 적음
**참고:** 비활성 시 자동 sleep, 첫 요청 시 즉시 wake-up

### 3. Railway

1. [Railway](https://railway.app/) 가입 및 로그인
2. "New Project" → "Deploy from GitHub repo" 선택
3. 이 리포지토리 연결
4. Root Directory: `youtube-chat-server` 설정
5. 자동으로 배포됨
6. 배포 완료 후 도메인 확인 (예: `xxx.up.railway.app`)

**비용:** $5/월 후 무료 크레딧 $5/월 제공 (신규 사용자)
**장점:** Sleep 모드 없음, 안정적

### 4. Glitch (완전 무료)

1. [Glitch](https://glitch.com/) 가입
2. "New Project" → "Import from GitHub"
3. 리포지토리 URL 입력
4. `glitch.json` 파일 추가 필요 (아래 참조)

**비용:** 완전 무료
**제약:** 5분 비활성 시 sleep

### 3. 로컬 개발

```bash
cd youtube-chat-server
npm install
npm start
```

서버가 `http://localhost:8080`에서 실행됩니다.

## 프론트엔드 설정

배포 완료 후 Vercel 프로젝트에 환경변수 추가:

1. Vercel 프로젝트 설정 → Environment Variables
2. 추가:
   ```
   NEXT_PUBLIC_YOUTUBE_CHAT_WS_URL=wss://your-server-url.com
   ```
   - Railway: `wss://xxx.up.railway.app`
   - Render: `wss://xxx.onrender.com`
   - 로컬 개발: `ws://localhost:8080`

3. Vercel 재배포

## Health Check

서버가 정상 작동하는지 확인:

```bash
curl https://your-server-url.com/health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T13:30:00.000Z"
}
```

## WebSocket 프로토콜

### 클라이언트 → 서버

**채팅 시작:**
```json
{
  "type": "start",
  "liveId": "YouTube_Video_ID"
}
```

**채팅 중지:**
```json
{
  "type": "stop"
}
```

### 서버 → 클라이언트

**채팅 시작 확인:**
```json
{
  "type": "start",
  "id": "chatId"
}
```

**채팅 메시지:**
```json
{
  "type": "chat",
  "data": { /* YouTube chat object */ }
}
```

**에러:**
```json
{
  "type": "error",
  "error": "Error message"
}
```

**채팅 종료:**
```json
{
  "type": "end",
  "reason": "Stream ended"
}
```

## 트러블슈팅

### Sleep 모드 해결 (무료 플랜)

Render/Glitch 무료 플랜은 비활성 시 sleep 모드로 전환됩니다. 해결 방법:

**1. UptimeRobot (추천, 무료)**
1. [UptimeRobot](https://uptimerobot.com/) 가입
2. "Add New Monitor" 클릭
3. 설정:
   - Monitor Type: HTTP(s)
   - URL: `https://your-server-url.com/health`
   - Monitoring Interval: 5분
4. 5분마다 ping을 보내 서버를 깨움

**2. Cron-job.org (무료)**
1. [Cron-job.org](https://cron-job.org/) 가입
2. Job 생성:
   - URL: `https://your-server-url.com/health`
   - Interval: 5분
3. 자동으로 서버를 깨움

**3. GitHub Actions (무료)**

`.github/workflows/keep-alive.yml` 파일 생성:
```yaml
name: Keep-Alive
on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다 실행
jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping server
        run: curl https://your-server-url.com/health
```

### WebSocket 연결 실패

- 환경변수 `NEXT_PUBLIC_YOUTUBE_CHAT_WS_URL` 확인
- 서버 Health Check 확인
- HTTPS 사이트는 `wss://` 사용 필수

### 채팅이 오지 않음

- 콘솔에서 에러 메시지 확인
- YouTube 라이브 스트림이 실제로 진행 중인지 확인
- 채팅이 활성화되어 있는지 확인

### 무료 플랜 Sleep 모드

- Render Free: 15분 비활성 시 sleep
- Glitch: 5분 비활성 시 sleep
- 첫 연결 시 10-30초 wake-up 시간 소요
- UptimeRobot으로 주기적 ping 권장 (위 참조)
