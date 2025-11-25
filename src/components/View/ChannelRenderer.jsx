import React from "react";
import DraggableView from "@/components/View/Draggable/DraggableView";
import DraggableChat from "@/components/View/Draggable/DraggableChat";

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
