import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ratioAtom,
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
  const viewCount = useAtomValue(viewCountAtom);
  const setChannels = useSetAtom(channelsAtom);

  const selectRatio = (newRatioKey) => {
    if (newRatioKey === ratio) {
      return;
    }

    const newRatioConfig = getRatioConfig(newRatioKey);
    if (!newRatioConfig) return;

    setRatio(newRatioKey);

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
          Object.entries(newChannels).map(([key, channel]) => [
            key,
            { zoneId: channel.zoneId },
          ])
        );

        // 유효성 검사 후 저장 (성공 시 { success, channels } 객체 반환)
        validateChannels(channelsToSave).then((result) => {
          if (result && typeof result === "object" && result.success) {
            updatePreferences({ channels: result.channels });
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
