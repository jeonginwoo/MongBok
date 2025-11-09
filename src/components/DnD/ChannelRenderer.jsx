import React from "react";
import DraggableView from "@/components/DnD/Draggable/DraggableView";
import DraggableChat from "@/components/DnD/Draggable/DraggableChat";

export default function ChannelRenderer({ channel, layout, pointerEventsEnabled }) {

  return (
    <React.Fragment key={channel.id}>
      <DraggableView
        channel={channel}
        zone={layout["view"][channel.zoneId]}
        pointerEventsEnabled={pointerEventsEnabled}
      />
      <DraggableChat
        channel={channel}
        zone={layout["chat"][channel.zoneId]}
      />
    </React.Fragment>
  );
}
