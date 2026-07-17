// 채널 맵 키 유틸리티
//
// 채널 맵(localStorage "channels", channelsAtom)의 키는 "플랫폼:채널ID" 복합 키를 사용한다.
// 플랫폼이 다르면 같은 채널ID(예: 숲/트위치의 동일 로그인명)가 존재할 수 있어
// 채널ID 단독으로는 키가 될 수 없기 때문. 채널 객체의 id는 순수 채널ID로 유지하고
// (임베드 URL·API 호출용), 맵 키와 dnd/React 키에는 복합 키(channel.key)를 쓴다.
// 구형(채널ID 키) 데이터는 value의 platform으로 무손실 변환이 가능하다.

export const CHANNEL_PLATFORMS = ["chzzk", "soop", "youtube", "twitch"];

export const makeChannelKey = (platform, channelId) => `${platform}:${channelId}`;

// "플랫폼:채널ID" 형식이면 { platform, channelId }로 분해, 아니면(구형 키) null
export const parseChannelKey = (key) => {
  if (typeof key !== "string") return null;
  const sep = key.indexOf(":");
  if (sep === -1) return null;
  const platform = key.slice(0, sep);
  const channelId = key.slice(sep + 1);
  if (!CHANNEL_PLATFORMS.includes(platform) || !channelId) return null;
  return { platform, channelId };
};

// 구형(채널ID 키) 채널 맵을 신형(플랫폼:채널ID 키)으로 정규화.
// 플랫폼은 키에 있으므로 value의 중복 platform 필드는 제거한다.
// platform을 알 수 없는 비정상 항목은 그대로 두어 유효성 검사에서 걸러지게 한다.
export const normalizeChannelsShape = (channelsObj) => {
  let changed = false;
  const normalized = {};
  for (const [key, data] of Object.entries(channelsObj || {})) {
    if (parseChannelKey(key)) {
      if (data && typeof data === "object" && "platform" in data) {
        const { platform, ...rest } = data;
        normalized[key] = rest;
        changed = true;
      } else {
        normalized[key] = data;
      }
    } else if (data?.platform && CHANNEL_PLATFORMS.includes(data.platform)) {
      const { platform, ...rest } = data;
      normalized[makeChannelKey(platform, key)] = rest;
      changed = true;
    } else {
      normalized[key] = data;
    }
  }
  return { changed, channels: normalized };
};
