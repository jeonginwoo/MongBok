import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ratioAtom,
  layoutTypeAtom,
  viewCountAtom,
  channelsAtom,
} from "@/atoms/setting";
import { canvas } from "@/data/canvas";
import { updatePreferences, validateChannels } from "@/utils/preferences";

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
      return;
    }

    // Case 2: Only same viewCount exists
    if (newRatioConfig.layouts?.[viewCount]) {
      setRatio(newRatioKey);
      setLayoutType("layout1");
      return;
    }

    // Case 3: viewCount doesn't exist (e.g. current viewCount > new maxViewCount)
    setRatio(newRatioKey);
    setLayoutType("layout1");

    const maxViewCount = newRatioConfig.maxViewCount ?? 1;

    if (viewCount > maxViewCount) {
      setChannels((prevChannels) => {
        const newChannels = structuredClone(prevChannels);

        Object.values(newChannels).forEach((channel) => {
          if (channel.isVisible && channel.zoneId > maxViewCount) {
            channel.isVisible = false;
            channel.zoneId = null;
          }
        });

        const channelsToSave = Object.fromEntries(
          Object.entries(newChannels).map(([id, channel]) => [
            id,
            { platform: channel.platform, zoneId: channel.zoneId },
          ])
        );

        // 유효성 검사 후 저장
        validateChannels(channelsToSave).then((result) => {
          if (result === true) {
            updatePreferences({ channels: channelsToSave });
          } else {
            console.error("채널 데이터 유효성 검사 실패:", result);
          }
        });
        
        return newChannels;
      });
    }
  };

  return { selectRatio };
};
