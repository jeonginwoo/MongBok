"use client";

import { ToggleButton } from "@mui/material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  channelsAtom,
  pointColorAtom,
  activeSettingPresetAtom,
  applySettingsSnapshotAtom,
} from "@/atoms/setting";
import { StyledToggleButtonGroup } from "@/components/Settings/LayoutToggleGroup";
import {
  PRESET_IDS,
  captureSnapshot,
  applySnapshot,
  readPresets,
  writePresets,
} from "@/utils/settingPresets";

export default function PresetSelector() {
  const [activePreset, setActivePreset] = useAtom(activeSettingPresetAtom);
  const channels = useAtomValue(channelsAtom);
  const pointColor = useAtomValue(pointColorAtom);
  const applySettingsSnapshot = useSetAtom(applySettingsSnapshotAtom);

  const handleChange = (_, newPreset) => {
    if (newPreset === null || newPreset === activePreset) return;

    // 현재 설정을 사용 중이던 프리셋에 저장한 뒤 전환
    const presets = readPresets();
    presets[activePreset] = captureSnapshot(channels);
    writePresets(presets);

    setActivePreset(newPreset);

    // 저장된 적 없는 프리셋이면 기본 설정에서 시작한다
    const target = presets[newPreset] || { settings: {}, viewPresets: {} };
    applySnapshot(target); // localStorage 반영
    applySettingsSnapshot(target); // 메모리 상태 즉시 반영 (새로고침 없음)
  };

  return (
    <StyledToggleButtonGroup
      value={activePreset}
      exclusive
      onChange={handleChange}
      aria-label="setting preset selection"
      pointcolor={pointColor}
    >
      {PRESET_IDS.map((id) => (
        <ToggleButton
          key={id}
          value={id}
          aria-label={`preset ${id}`}
          sx={{ fontSize: "1.2rem" }}
        >
          {id}
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
}
