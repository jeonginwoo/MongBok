import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ratioAtom,
  layoutTypeAtom,
  viewCountAtom,
  channelsAtom,
} from "@/atoms/setting";
import { canvas } from "@/data/layouts";

export const getRatioConfig = (ratioKey) => {
  if (!ratioKey) return null;
  const [group, orientation] = ratioKey.split("-");
  if (!group || !orientation) return null;
  return canvas[group]?.[orientation] || null;
};

export const useLayoutManager = () => {
  const [ratio, setRatio] = useAtom(ratioAtom);
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const setChannels = useSetAtom(channelsAtom);

  const selectRatio = (newRatioKey) => {
    if (newRatioKey === ratio) {
      return;
    }

    const newRatioConfig = getRatioConfig(newRatioKey);
    if (!newRatioConfig) return;

    // Case 1: Same viewCount and layoutType exist
    if (newRatioConfig.layouts?.[viewCount]?.[layoutType]) {
      setRatio(newRatioKey);
      window.localStorage.setItem("ratio", newRatioKey);
      return;
    }

    // Case 2: Only same viewCount exists
    if (newRatioConfig.layouts?.[viewCount]) {
      setRatio(newRatioKey);
      window.localStorage.setItem("ratio", newRatioKey);
      setLayoutType("layout1");
      window.localStorage.setItem("layout", "layout1");
      return;
    }

    // Case 3: viewCount doesn't exist
    setRatio(newRatioKey);
    window.localStorage.setItem("ratio", newRatioKey);
    setLayoutType("layout1");
    window.localStorage.setItem("layout", "layout1");

    if (viewCount > 0) {
      setChannels((prevChannels) => {
        const newChannels = structuredClone(prevChannels);
        const channelToKeep =
          Object.values(newChannels).find(
            (c) => c.zoneId === 1 && c.isVisible
          ) || Object.values(newChannels).find((c) => c.isVisible);

        let isFirstVisibleFound = false;
        if (channelToKeep) {
          Object.values(newChannels).forEach((channel) => {
            if (channel.id === channelToKeep.id) {
              channel.isVisible = true;
              channel.zoneId = 1;
              isFirstVisibleFound = true;
            } else {
              channel.isVisible = false;
              channel.zoneId = null;
            }
          });
        }

        if (!isFirstVisibleFound && Object.keys(newChannels).length > 0) {
          const firstChannelId = Object.keys(newChannels)[0];
          newChannels[firstChannelId].isVisible = true;
          newChannels[firstChannelId].zoneId = 1;
        }

        const channelsToSave = Object.fromEntries(
          Object.entries(newChannels).map(([id, channel]) => [
            id,
            { platform: channel.platform, zoneId: channel.zoneId },
          ])
        );

        window.localStorage.setItem(
          "channels",
          JSON.stringify(channelsToSave)
        );
        return newChannels;
      });
    }
  };

  return { selectRatio };
};
