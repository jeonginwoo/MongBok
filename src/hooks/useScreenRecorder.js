"use client";

import { useRef, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { isRecordingAtom, isSavingRecordingAtom, snackbarAtom } from "@/atoms/ui";
import { recordQualityAtom, recordFrameRateAtom, recordCodecAtom, recordSoundEnabledAtom, recordSoundTypeAtom, recordSoundVolumeAtom, recordSaveDirHandleAtom, channelsAtom, recordStopConditionAtom, recordSplitOnZone1ChangeAtom } from "@/atoms/setting";
import { playNotificationSound } from "@/utils/audio";
import { getRecordDirectory } from "@/utils/recordDirectoryStorage";
import dayjs from "dayjs";

export const useScreenRecorder = () => {
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const channels = useAtomValue(channelsAtom);
  const recordStopCondition = useAtomValue(recordStopConditionAtom);
  const recordSplitOnZone1Change = useAtomValue(recordSplitOnZone1ChangeAtom);
  const quality = useAtomValue(recordQualityAtom);
  const frameRate = useAtomValue(recordFrameRateAtom);
  const codec = useAtomValue(recordCodecAtom);
  const recordSoundEnabled = useAtomValue(recordSoundEnabledAtom);
  const recordSoundType = useAtomValue(recordSoundTypeAtom);
  const recordSoundVolume = useAtomValue(recordSoundVolumeAtom);
  const [recordSaveDirHandle, setRecordSaveDirHandle] = useAtom(recordSaveDirHandleAtom);
  const setIsSavingRecording = useSetAtom(isSavingRecordingAtom);
  const setSnackbar = useSetAtom(snackbarAtom);
  const originalTitleRef = useRef(document.title);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const writableStreamRef = useRef(null); // File System Access API: 디스크 직접 스트리밍용
  const contentRef = useRef(null);
  const latestIsRecordingRef = useRef(isRecording);

  // .crswap 파일이 존재하는 동안 브라우저 종료 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (writableStreamRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    latestIsRecordingRef.current = isRecording;
  }, [isRecording]);

  // 분할(회전) 세그먼트의 파일명에 최신 방제를 반영하기 위한 채널 미러
  const channelsRef = useRef(channels);
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  // 진행 중인 녹화의 분할(세그먼트 교체) 함수 — 녹화 중일 때만 설정된다.
  // 새 파일·새 recorder를 먼저 준비한 뒤 교체하므로, 실패해도 기존 녹화는 계속된다
  const rotateSegmentRef = useRef(null);

  // 이번 녹화 세션 중 종료 기준 대상이 라이브였던 적이 있는지.
  // 방송 시작 전에 미리 녹화를 켠 경우, 라이브 전에는 자동 종료하지 않기 위한 플래그
  const hasBeenLiveRef = useRef(false);

  // 녹화 종료 기준에 따라 녹화 종료 (라이브 → 오프라인 전환 시에만 동작)
  // - "all": 화면에 배치된 채널 중 라이브 중인 채널이 하나도 없어지면 종료
  // - "zone1": 1번 채널이 오프라인이 되면 종료
  // - "manual": 자동 종료하지 않음 (사용자가 직접 종료)
  useEffect(() => {
    if (!isRecording) {
      hasBeenLiveRef.current = false;
      return;
    }
    if (recordStopCondition === "manual") return;

    const visibleChannels = Object.values(channels).filter((c) => c.isVisible);
    const anyLoading = visibleChannels.some((c) => c._loading);
    // 로딩이 끝나기 전에는 판단 보류 (초기 플레이스홀더 상태에서 오판 방지)
    if (anyLoading) return;

    // 배치된 채널이 하나도 없으면 녹화 대상이 없으므로 종료
    if (visibleChannels.length === 0) {
      setIsRecording(false);
      return;
    }

    const isTargetLive =
      recordStopCondition === "zone1"
        ? Object.values(channels).find((c) => c.zoneId === 1)?.isLive === true
        : visibleChannels.some((c) => c.isLive);

    if (isTargetLive) {
      hasBeenLiveRef.current = true;
    } else if (hasBeenLiveRef.current) {
      // 라이브였다가 오프라인으로 전환된 경우에만 자동 종료
      setIsRecording(false);
    }
  }, [channels, isRecording, setIsRecording, recordStopCondition]);

  // 이번 세그먼트의 분할 판단 기준 (1번 채널의 키·방제·카테고리). null이면 기준 미설정
  const zone1BaselineRef = useRef(null);

  // 1번 채널의 방제/카테고리 변경 감지 → 녹화 분할 요청.
  // 방송 정보는 60초 폴링으로 갱신되므로 실제 변경 후 최대 1분 지연될 수 있다
  useEffect(() => {
    if (!isRecording) {
      zone1BaselineRef.current = null;
      return;
    }

    const zone1Entry = Object.entries(channels).find(
      ([, c]) => c.zoneId === 1
    );
    // 로드 미완료·오프라인 상태는 판단 보류 — 플레이스홀더(빈 방제)나 프리셋 전환
    // 직후의 재로드를 "변경"으로 오판해 녹화 시작 직후 분할되는 것을 막는다
    if (!zone1Entry || zone1Entry[1]._loading || !zone1Entry[1].isLive) return;

    const [key, zone1] = zone1Entry;
    const baseline = zone1BaselineRef.current;
    const next = {
      key,
      liveTitle: zone1.liveTitle,
      liveCategory: zone1.liveCategory,
    };

    // 기준 미설정(녹화 시작 직후)이면 기준만 잡고 분할하지 않는다
    if (!baseline) {
      zone1BaselineRef.current = next;
      return;
    }

    // 1번 채널 교체(위치 스와프 포함)도 방제/카테고리 변경과 같이 분할 대상 —
    // 파일명이 1번 채널 기준이므로 채널이 바뀌면 파일도 나뉘는 것이 맞다
    if (
      baseline.key !== key ||
      baseline.liveTitle !== next.liveTitle ||
      baseline.liveCategory !== next.liveCategory
    ) {
      // 토글이 꺼져 있어도 기준은 갱신 — 꺼진 동안의 변경이 켜는 순간 분할을
      // 일으키지 않게 한다
      zone1BaselineRef.current = next;
      if (recordSplitOnZone1Change) {
        rotateSegmentRef.current?.();
      }
    }
  }, [channels, isRecording, recordSplitOnZone1Change]);

  // 컴포넌트 언마운트 시 녹화 정리 (ViewArea가 사라질 때)
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (writableStreamRef.current) {
        writableStreamRef.current.close().catch(() => {}).finally(() => {
          writableStreamRef.current = null;
        });
      }
    };
  }, []);

  useEffect(() => {
    const startRecording = async () => {
      try {
        // Region Capture를 위한 CropTarget 생성
        let cropTarget;
        if (window.CropTarget && contentRef.current) {
          try {
            cropTarget = await window.CropTarget.fromElement(contentRef.current);
          } catch (e) {
            console.warn("Region Capture not supported or failed:", e);
          }
        }

        // 파일명: 세그먼트 시작 시간 + 1번 채널명(-방송 타이틀-카테고리, 있는 것만).
        // 분할(회전) 시에도 다시 호출되므로 최신 채널 상태(channelsRef)를 읽는다 —
        // 새 파일명에 변경된 방제/카테고리가 반영된다
        const sanitizeForFileName = (str) =>
          str.replace(/[\\/:*?"<>|]/g, "").trim();
        const buildFileName = () => {
          const zone1Channel = Object.values(channelsRef.current).find(
            (c) => c.zoneId === 1
          );
          let suffix = "";
          if (zone1Channel?.name) {
            const combined = [
              sanitizeForFileName(zone1Channel.name),
              zone1Channel.liveTitle
                ? sanitizeForFileName(zone1Channel.liveTitle)
                : "",
              zone1Channel.liveCategory
                ? sanitizeForFileName(String(zone1Channel.liveCategory))
                : "",
            ]
              .filter(Boolean)
              .join("-");
            if (combined) suffix = ` ${combined.slice(0, 100)}`;
          }
          return `${dayjs().format("YYMMDD HHmmss")}${suffix}.webm`;
        };
        const initialFileName = buildFileName();

        // 1순위: 설정에서 지정된 디렉터리 핸들 사용
        // 2순위: File System Access API showSaveFilePicker
        // 3순위: 메모리 → 브라우저 다운로드 (폴백)
        let dirHandle = recordSaveDirHandle;

        // 아직 atom에 로드 안 된 경우 IndexedDB에서 직접 시도
        if (!dirHandle) {
          dirHandle = await getRecordDirectory();
          if (dirHandle) {
            setRecordSaveDirHandle(dirHandle);
          }
        }

        // dirHandle이 있으면 권한만 미리 확인 (파일 생성은 아직 하지 않음)
        let dirPermissionGranted = false;
        if (dirHandle) {
          try {
            const permission = await dirHandle.requestPermission({ mode: "readwrite" });
            if (permission === "granted") {
              dirPermissionGranted = true;
            } else {
              dirHandle = null;
            }
          } catch (e) {
            console.warn("폴더 권한 확인 실패:", e);
            dirHandle = null;
          }
        }

        // 팝업 알림음 재생
        if (recordSoundEnabled) {
          playNotificationSound(recordSoundType, recordSoundVolume);
        }

        // 화면 공유 권한 요청 (허용 후에 파일 생성)
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
            cursor: "never",
            frameRate: { ideal: frameRate },
            // GPU 가속을 위한 힌트
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 48000,
          },
          preferCurrentTab: true, // '이 탭' 선택 유도
          selfBrowserSurface: "include", // 현재 탭 공유 허용
        });

        // 사용자가 취소했거나 상태가 변경된 경우 즉시 종료
        if (!latestIsRecordingRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        // 지정 폴더에 세그먼트 파일 생성 (첫 세그먼트와 분할 회전에서 공용)
        const openFileInDir = async (fileName) => {
          if (!(dirHandle && dirPermissionGranted)) return null;
          try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            return await fileHandle.createWritable();
          } catch (e) {
            console.warn("지정 폴더 파일 생성 실패:", e);
            return null;
          }
        };

        // 화면 공유 허용 후 파일 생성
        let initialWritable = await openFileInDir(initialFileName);

        if (!initialWritable) {
          if (typeof window !== "undefined" && window.showSaveFilePicker) {
            try {
              const fileHandle = await window.showSaveFilePicker({
                suggestedName: initialFileName,
                types: [{ description: "WebM Video", accept: { "video/webm": [".webm"] } }],
              });
              initialWritable = await fileHandle.createWritable();
            } catch (e) {
              if (e.name === "AbortError") {
                // 사용자가 저장 대화상자를 취소함
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                setIsRecording(false);
                return;
              }
              // 기타 오류 → 메모리 방식으로 폴백
              console.warn("File System Access API 사용 불가, 메모리 녹화로 전환합니다:", e);
            }
          }
        }

        // 이 녹화가 디스크 파일 기반인지 (첫 세그먼트 기준) — 분할 회전 시
        // 새 세그먼트도 디스크 파일이 필수인지 판단하는 데 쓴다
        const diskBacked = initialWritable !== null;

        // 사용자가 선택한 스트림의 비디오 트랙을 가져옴
        const [videoTrack] = stream.getVideoTracks();

        // 영역 자르기 (Region Capture) 적용
        if (cropTarget && videoTrack.cropTo) {
          await videoTrack.cropTo(cropTarget);
        }

        // 사용자가 선택한 코덱 사용, 지원하지 않으면 폴백
        let mimeType = "video/webm";
        const codecMapping = {
          h264: "video/webm; codecs=h264",
          vp9: "video/webm; codecs=vp9",
          vp8: "video/webm; codecs=vp8",
        };
        
        const preferredCodec = codecMapping[codec];
        if (preferredCodec && MediaRecorder.isTypeSupported(preferredCodec)) {
          mimeType = preferredCodec;
        } else {
          // 폴백: H.264 -> VP9 -> VP8 순으로 시도
          if (MediaRecorder.isTypeSupported("video/webm; codecs=h264")) {
            mimeType = "video/webm; codecs=h264";
          } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
            mimeType = "video/webm; codecs=vp9";
          } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp8")) {
            mimeType = "video/webm; codecs=vp8";
          }
        }

        const bitrateMap = {
          high: 8000000,
          medium: 5000000,
          low: 2500000,
        };
        const videoBitsPerSecond = bitrateMap[quality] || 8000000;

        const recorderOptions = {
          mimeType,
          audioBitsPerSecond: 192000,
          videoBitsPerSecond,
        };

        // 브라우저가 지원하면 하드웨어 가속 힌트 추가 (실험적 기능)
        if ('hardwareAcceleration' in MediaRecorder.prototype) {
          recorderOptions.hardwareAcceleration = 'prefer-hardware';
        }

        // 세그먼트 파일 마무리: 쓰기 스트림을 닫거나(디스크 직접 스트리밍),
        // 메모리 폴백이면 Blob을 다운로드한다. writable/chunks/fileName은 세그먼트별
        // 클로저에 바인딩 — 회전으로 여러 세그먼트가 잠깐 겹쳐도 서로 섞이지 않는다
        const finalizeSegment = async (writable, chunks, fileName) => {
          if (writable) {
            // File System Access API: 스트림 닫으면 파일이 완성됨 (.crswap → .webm)
            setIsSavingRecording(true);
            originalTitleRef.current = document.title;
            document.title = "⚠️ 녹화 저장 중... 브라우저를 닫지 마세요";
            try {
              await writable.close();
            } catch (e) {
              console.error("파일 스트림 닫기 오류:", e);
            }
            // 활성 세그먼트의 스트림이었을 때만 ref 해제 (회전으로 이미 새
            // 세그먼트가 활성화됐다면 그대로 둔다)
            if (writableStreamRef.current === writable) {
              writableStreamRef.current = null;
            }
            setIsSavingRecording(false);
            document.title = originalTitleRef.current;
            return;
          }

          // 폴백: 메모리 Blob → 다운로드 (빈 녹화는 저장하지 않음)
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) return;

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");

          a.style.display = "none";
          a.href = url;
          a.download = fileName;

          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);
        };

        // 녹화 전체 종료 (마지막 세그먼트의 onstop에서만 호출)
        const teardown = () => {
          rotateSegmentRef.current = null;
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsRecording(false);
          mediaRecorderRef.current = null;

          // 녹화 중지 알림음 재생 (분할 회전에서는 울리지 않는다 — 무인 녹화 배려)
          if (recordSoundEnabled) {
            playNotificationSound(recordSoundType, recordSoundVolume);
          }
        };

        // 세그먼트용 recorder 생성·시작 (첫 세그먼트와 분할 회전에서 공용)
        const startSegment = (writable, fileName) => {
          const chunks = [];
          const recorder = new MediaRecorder(stream, recorderOptions);
          mediaRecorderRef.current = recorder;
          // beforeunload 경고·언마운트 정리는 활성 세그먼트의 스트림을 대상으로 한다
          writableStreamRef.current = writable;

          recorder.ondataavailable = async (e) => {
            if (e.data.size === 0) return;
            if (writable) {
              // 디스크 직접 스트리밍 (메모리 누적 없음)
              try {
                await writable.write(e.data);
              } catch (writeErr) {
                console.error("디스크 쓰기 오류:", writeErr);
              }
            } else {
              // 폴백: 메모리에 누적
              chunks.push(e.data);
            }
          };

          recorder.onstop = async () => {
            // 회전으로 교체된 경우 ref는 이미 새 recorder를 가리킨다 —
            // 그때는 이 세그먼트의 파일만 닫고, 전체 종료는 하지 않는다
            const isFullStop = mediaRecorderRef.current === recorder;
            // 파일 저장이 끝나기 전에 녹화 상태부터 내린다 — 저장 중을 "녹화 중"으로
            // 오판해 경고(프리셋 변경 확인 등)가 뜨지 않게. 저장 진행 표시는
            // isSavingRecordingAtom이 따로 담당한다
            if (isFullStop) teardown();
            await finalizeSegment(writable, chunks, fileName);
          };

          recorder.start(1000);
        };

        // 분할(세그먼트 교체): 새 파일과 새 recorder를 "먼저" 준비해 교체한 뒤
        // 이전 recorder를 멈춘다. 잠깐 두 recorder가 겹치므로 프레임 공백이 없고,
        // 어떤 단계가 실패해도 기존 녹화는 그대로 계속된다 — 분할 시도가 녹화
        // 전체를 죽이는 일이 없도록 하는 것이 이 순서의 핵심
        let rotating = false;
        const rotateSegment = async () => {
          if (rotating) return;
          rotating = true;
          try {
            const oldRecorder = mediaRecorderRef.current;
            if (
              !oldRecorder ||
              oldRecorder.state !== "recording" ||
              !latestIsRecordingRef.current
            ) {
              return;
            }

            const nextFileName = buildFileName();
            let nextWritable = null;
            if (diskBacked) {
              nextWritable = await openFileInDir(nextFileName);
              if (!nextWritable) {
                // 저장 대화상자로 시작한 녹화(폴더 미지정)나 폴더 쓰기 실패 —
                // 무인 상태에서도 인지할 수 있게 알리고, 분할만 건너뛴다
                setSnackbar({
                  open: true,
                  message:
                    "녹화 분할을 할 수 없어 기존 파일로 계속 녹화합니다. 분할하려면 설정에서 녹화 저장 폴더를 지정하세요.",
                  severity: "warning",
                });
                return;
              }
            }

            // 파일 여는 사이 상태가 바뀌었으면 취소 (빈 파일만 정리)
            if (
              mediaRecorderRef.current !== oldRecorder ||
              oldRecorder.state !== "recording" ||
              !latestIsRecordingRef.current ||
              stream.getVideoTracks()[0]?.readyState !== "live"
            ) {
              nextWritable?.close().catch(() => {});
              return;
            }

            const prevWritable = writableStreamRef.current;
            try {
              startSegment(nextWritable, nextFileName);
            } catch (e) {
              // 새 recorder 시작 실패 — 교체를 원복하고 기존 녹화를 계속한다
              console.error("분할 세그먼트 시작 실패, 기존 파일로 계속 녹화합니다:", e);
              mediaRecorderRef.current = oldRecorder;
              writableStreamRef.current = prevWritable;
              nextWritable?.close().catch(() => {});
              return;
            }
            // 새 세그먼트가 시작된 뒤에 이전 것을 멈춘다 — onstop은 ref 비교로
            // 회전임을 알고 자기 세그먼트 파일만 마무리한다
            oldRecorder.stop();
          } finally {
            rotating = false;
          }
        };
        rotateSegmentRef.current = rotateSegment;

        // 브라우저 UI에서 '공유 중지' 누를 경우 처리
        stream.getVideoTracks()[0].onended = () => {
          const recorder = mediaRecorderRef.current;
          if (recorder && recorder.state === "recording") {
            recorder.stop();
          } else {
            // 이미 stop된 경우 상태만 동기화
            rotateSegmentRef.current = null;
            setIsRecording(false);
            mediaRecorderRef.current = null;
            streamRef.current = null;
          }
        };

        startSegment(initialWritable, initialFileName);
      } catch (err) {
        console.error("Recording failed or cancelled:", err);
        setIsRecording(false);
      }
    };

    if (isRecording) {
      if (!mediaRecorderRef.current) {
        startRecording();
      }
    } else {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      } else if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        rotateSegmentRef.current = null;
      }
    }
  }, [isRecording, setIsRecording, quality, frameRate, codec, recordSoundEnabled, recordSoundType, recordSoundVolume]);

  return contentRef;
};
