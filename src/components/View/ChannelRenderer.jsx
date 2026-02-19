import React from "react";
import DraggableView from "@/components/View/Draggable/DraggableView";
import DraggableChat from "@/components/View/Draggable/DraggableChat";

export default function ChannelRenderer({
  channel,
  layout,
  pointerEventsEnabled,
  dynamicOverrides = {},
}) {
  const applyOverride = (zone) => {
    if (!zone) return zone;
    const override = dynamicOverrides[`${zone.type}-${zone.id}`];
    return override ? { ...zone, style: { ...zone.style, ...override } } : zone;
  };

  return (
    <React.Fragment key={channel.id}>
      {layout["view"]?.[channel.zoneId] && (
        <DraggableView
          channel={channel}
          zone={applyOverride(layout["view"][channel.zoneId])}
          pointerEventsEnabled={pointerEventsEnabled}
        />
      )}

      {layout["chat"]?.[channel.zoneId] && (
        <DraggableChat
          channel={channel}
          zone={applyOverride(layout["chat"][channel.zoneId])}
        />
      )}
    </React.Fragment>
  );
}
