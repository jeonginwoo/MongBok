// Innertube 인스턴스 캐싱 (재사용)
let cachedYoutube = null;
let youtubeInitPromise = null;

/**
 * 캐시된 Innertube 인스턴스를 반환합니다.
 * 처음 호출 시에만 초기화하고, 이후에는 재사용합니다.
 */
export async function getYoutubeInstance() {
  if (cachedYoutube) {
    return cachedYoutube;
  }

  // 초기화 중이면 기다림 (동시 요청 시 중복 초기화 방지)
  if (youtubeInitPromise) {
    return youtubeInitPromise;
  }

  youtubeInitPromise = (async () => {
    try {
      const { Innertube } = await import("youtubei.js");
      cachedYoutube = await Innertube.create();
      console.log("✅ [YouTube] Innertube 인스턴스 초기화 완료");
      return cachedYoutube;
    } catch (error) {
      console.error("❌ [YouTube] Innertube 초기화 실패:", error);
      youtubeInitPromise = null; // 실패 시 재시도 가능하도록
      throw error;
    }
  })();

  return youtubeInitPromise;
}

/**
 * 캐시 초기화 (필요한 경우 사용)
 */
export function resetYoutubeCache() {
  cachedYoutube = null;
  youtubeInitPromise = null;
}
