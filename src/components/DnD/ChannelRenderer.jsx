import React, { useState, useEffect } from "react";
import DraggableView from "@/components/DnD/Draggable/DraggableView";
import DraggableChat from "@/components/DnD/Draggable/DraggableChat";
import { getChzzkLiveStatus } from "@/api/chzzkApi";

export default function ChannelRenderer({ channel, layout, pointerEventsEnabled }) {
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const data = await getChzzkLiveStatus(channel.id);
        setLiveStatus(data);
      } catch (error) {
        console.error("❌ 채널 상태 불러오기 실패:", error);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000);
    return () => clearInterval(interval);
  }, [channel.id, channel.view.zoneId, channel.chat.znoeId]);

  return (
    <React.Fragment key={channel.id}>
      {channel.view && (
        <DraggableView
          object={channel.view}
          zone={layout[channel.view.type][channel.view.zoneId]}
          liveStatus={liveStatus}
          pointerEventsEnabled={pointerEventsEnabled}
        />
      )}
      {channel.chat && (
        <DraggableChat
          object={channel.chat}
          zone={layout[channel.chat.type][channel.chat.zoneId]}
          liveStatus={liveStatus}
        />
      )}
    </React.Fragment>
  );
}
