"use client";

import { useEffect, useState } from 'react';

export default function useSoopEmoticons(channelId) {
  const [emoticons, setEmoticons] = useState([]);

  useEffect(() => {
    if (channelId == null) {
      return;
    }
    void (async () => {
      await fetch(
        `https://live.sooplive.co.kr/api/signature_emoticon_api.php?szCallBack=hello&work=list&szBjId=${channelId}&_=${new Date().getTime()}`,
      )
        .then((response) => response.text())
        .then((data) => {
          // The data comes as a string like "hello({"result":1,"data":[]})"
          const jsonData = JSON.parse(data.slice(6, data.length - 2));
          if (jsonData.result === 1) {
            setEmoticons(jsonData.data);
          }
        })
        .catch((error) => console.error("Error fetching AfreecaTV emoticons:", error));
    })();
  }, [channelId]);

  return { emoticons };
}
