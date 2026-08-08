"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ToggleButton,
} from "@mui/material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  channelsAtom,
  pointColorAtom,
  activeSettingPresetAtom,
  applySettingsSnapshotAtom,
} from "@/atoms/setting";
import { isRecordingAtom } from "@/atoms/ui";
import { StyledToggleButtonGroup } from "@/components/Settings/LayoutToggleGroup";
import {
  PRESET_IDS,
  captureSnapshot,
  applySnapshot,
  readPresets,
  writePresets,
} from "@/utils/settingPresets";

export default function PresetSelector({ dialogContainerRef }) {
  const [activePreset, setActivePreset] = useAtom(activeSettingPresetAtom);
  const channels = useAtomValue(channelsAtom);
  const pointColor = useAtomValue(pointColorAtom);
  const applySettingsSnapshot = useSetAtom(applySettingsSnapshotAtom);
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  // 녹화 중 전환 시도 시 확인 대기 중인 프리셋 번호 (null이면 다이얼로그 닫힘)
  const [pendingPreset, setPendingPreset] = useState(null);

  const switchPreset = (newPreset) => {
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

  const handleChange = (_, newPreset) => {
    if (newPreset === null || newPreset === activePreset) return;

    // 녹화 중 프리셋 전환은 녹화를 잃는 되돌릴 수 없는 동작이므로 먼저 확인받는다
    if (isRecording) {
      setPendingPreset(newPreset);
      return;
    }
    switchPreset(newPreset);
  };

  const handleConfirm = () => {
    // 종료 기준이 "manual"이면 채널 교체만으로는 녹화가 끊기지 않아 바뀐 프리셋
    // 화면을 계속 녹화하게 되므로, 기준과 무관하게 여기서 명시적으로 종료한다
    setIsRecording(false);
    switchPreset(pendingPreset);
    setPendingPreset(null);
  };

  return (
    <>
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

      <Dialog
        open={pendingPreset !== null}
        onClose={() => setPendingPreset(null)}
        // 설정 패널(Paper) 안에 가둬서 띄운다 — 화면 중앙에 띄우면 녹화 영역과
        // 겹쳐 녹화본에 다이얼로그가 찍히고, 리모컨(팝업 창) 분리 시에는 기본
        // portal 대상(메인 문서 body)에 팝업용 emotion 스타일이 없어 UI가 깨진다
        container={() => dialogContainerRef?.current ?? null}
        // Modal 기본 fixed(창 전체) 배치를 패널 기준 절대배치로 전환
        sx={{ position: "absolute" }}
        slotProps={{ backdrop: { sx: { position: "absolute" } } }}
        // 스크롤 잠금이 패널 스타일을 건드리지 않게 (패널은 이미 overflow: hidden)
        disableScrollLock
      >
        <DialogTitle sx={{ fontSize: "1.6rem" }}>
          녹화 중 프리셋 변경
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "1.4rem" }}>
            현재 녹화가 진행 중입니다. 프리셋을 변경하면 녹화가 종료되고
            지금까지의 녹화 파일이 저장됩니다. 계속할까요?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPendingPreset(null)}
            sx={{ fontSize: "1.2rem" }}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            color="error"
            sx={{ fontSize: "1.2rem" }}
          >
            녹화 종료 후 변경
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
