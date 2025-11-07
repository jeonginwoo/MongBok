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
  }, [channel.id, channel.zoneId]);

  return (
    <React.Fragment key={channel.id}>
      <DraggableView
        channel={channel}
        zone={layout["view"][channel.zoneId]}
        liveStatus={liveStatus}
        pointerEventsEnabled={pointerEventsEnabled}
      />
      <DraggableChat
        channel={channel}
        zone={layout["chat"][channel.zoneId]}
        liveStatus={liveStatus}
      />
    </React.Fragment>
  );
}
