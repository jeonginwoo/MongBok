import React, { useState } from "react";
import DraggableView from "@/components/DnD/Draggable/DraggableView";
import DraggableChat from "@/components/DnD/Draggable/DraggableChat";

export default function ChannelRenderer({ channel, layout, pointerEventsEnabled }) {
  return (
    <React.Fragment key={channel.id}>
      {layout["view"]?.[channel.zoneId] && (
        <DraggableView
          channel={channel}
          zone={layout["view"][channel.zoneId]}
          pointerEventsEnabled={pointerEventsEnabled}
        />
      )}

      {layout["chat"]?.[channel.zoneId] && (
        <DraggableChat
          channel={channel}
          zone={layout["chat"][channel.zoneId]}
        />
      )}
    </React.Fragment>
  );
}
