"use client";

import { useEffect, useState } from 'react';
import { getSoopEmoticons } from "@/api/live";

export default function useSoopEmoticons(channelId) {
  const [emoticons, setEmoticons] = useState([]);

  useEffect(() => {
    if (channelId == null) {
      return;
    }
    void (async () => {
      // 조회 실패 시 빈 배열이 반환되므로 초기 상태와 동일 — 별도 에러 처리 불필요
      const data = await getSoopEmoticons(channelId);
      setEmoticons(data);
    })();
  }, [channelId]);

  return { emoticons };
}
