"use client";

import { useRef, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { isRecordingAtom, isSavingRecordingAtom, snackbarAtom } from "@/atoms/ui";
import { recordQualityAtom, recordFrameRateAtom, recordCodecAtom, recordSoundEnabledAtom, recordSoundTypeAtom, recordSoundVolumeAtom, recordSaveDirHandleAtom, channelsAtom, recordStopConditionAtom, recordSplitOnZone1ChangeAtom } from "@/atoms/setting";
import { playNotificationSound } from "@/utils/audio";
import { getRecordDirectory } from "@/utils/recordDirectoryStorage";
import {
  getRecordFileExtension,
  getRecordMimeType,
  isRecordPipelineSupported,
} from "@/utils/recordFormat";
import dayjs from "dayjs";

const bitrateMap = {
  high: 8000000,
  medium: 5000000,
  low: 2500000,
};

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
  const workerRef = useRef(null);
  const streamRef = useRef(null);
  // 워커가 알려주는, 아직 닫히지 않은 세그먼트 파일 수 — 종료 경고의 기준
  const openFilesRef = useRef(0);
  const contentRef = useRef(null);
  const latestIsRecordingRef = useRef(isRecording);
  // 화면 공유 권한 요청부터 파이프라인 기동까지의 비동기 구간 표시 —
  // 이 사이에 설정이 바뀌어 effect가 다시 돌아도 녹화가 두 번 시작되지 않게 한다
  const startingRef = useRef(false);

  // 저장 중인 파일이 있는 동안 브라우저 종료 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (openFilesRef.current > 0) {
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
  // 새 파일을 먼저 준비한 뒤 워커에 예약하므로, 실패해도 기존 녹화는 계속된다
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
  // 방송 정보는 갱신 주기(channelRefreshInterval, 기본 60초) 폴링으로 갱신되므로
  // 실제 변경 후 그 주기만큼 감지가 지연될 수 있다
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
      const worker = workerRef.current;
      workerRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      // terminate하지 않는다 — 인덱스를 쓰고 파일을 닫는 건 워커 몫이라 여기서
      // 끊으면 마무리 전에 잘린 파일이 남는다. stop 처리가 끝나면 스스로 정리된다
      worker?.postMessage({ type: "stop" });
    };
  }, []);

  useEffect(() => {
    const startRecording = async () => {
      startingRef.current = true;
      let stream = null;
      let initialFileHandle = null;
      let worker = null;
      try {
        // 캡처 프레임을 직접 인코딩하므로 WebCodecs가 없으면 시작할 수 없다
        if (!isRecordPipelineSupported()) {
          setSnackbar({
            open: true,
            message:
              "이 브라우저는 녹화를 지원하지 않습니다. 크롬·엣지 등 크로미움 계열 브라우저를 사용해 주세요.",
            severity: "error",
          });
          setIsRecording(false);
          return;
        }

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
        // 새 파일명에 변경된 방제/카테고리가 반영된다.
        // 확장자는 코덱이 결정한다 (H.264 → .mp4, VP9/VP8 → .webm)
        const extension = getRecordFileExtension(codec);
        const mimeType = getRecordMimeType(codec);
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
          return `${dayjs().format("YYMMDD HHmmss")}${suffix}.${extension}`;
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
        stream = await navigator.mediaDevices.getDisplayMedia({
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

        // 지정 폴더에 세그먼트 파일 생성 (첫 세그먼트와 분할 회전에서 공용).
        // 여는 건 핸들까지만 — writable은 구조화 복제가 안 돼 워커로 넘길 수 없다.
        // 실제 쓰기 스트림은 핸들을 받은 워커가 연다
        const openFileInDir = async (fileName) => {
          if (!(dirHandle && dirPermissionGranted)) return null;
          try {
            return await dirHandle.getFileHandle(fileName, { create: true });
          } catch (e) {
            console.warn("지정 폴더 파일 생성 실패:", e);
            return null;
          }
        };

        // 화면 공유 허용 후 파일 생성
        initialFileHandle = await openFileInDir(initialFileName);

        if (!initialFileHandle) {
          if (typeof window !== "undefined" && window.showSaveFilePicker) {
            try {
              initialFileHandle = await window.showSaveFilePicker({
                suggestedName: initialFileName,
                types: [
                  {
                    description: extension === "mp4" ? "MP4 Video" : "WebM Video",
                    accept: { [mimeType]: [`.${extension}`] },
                  },
                ],
              });
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
        const diskBacked = initialFileHandle !== null;

        // 사용자가 선택한 스트림의 비디오 트랙을 가져옴
        const [videoTrack] = stream.getVideoTracks();

        // 영역 자르기 (Region Capture) 적용
        if (cropTarget && videoTrack.cropTo) {
          await videoTrack.cropTo(cropTarget);
        }

        // 메모리 폴백 세그먼트 다운로드 — 워커에는 DOM이 없어 여기서 처리한다
        const downloadBuffer = (fileName, buffer) => {
          if (!buffer || buffer.byteLength === 0) return;

          const url = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
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

        // 인코딩·먹싱·파일 쓰기는 전부 워커에서 한다. 메인 스레드에서 캡처를 읽으면
        // 플레이어 4개의 렌더링에 밀려 영상·오디오 프레임이 동시에 유실된다 —
        // 인코더는 놀고 있는데 공급이 끊겨 끊김과 싱크 어긋남으로 나타났다
        worker = new Worker(
          // 번들러가 워커로 인식하려면 상대경로 new URL이어야 한다 (@/ 별칭 불가)
          new URL("../utils/recordWorker.js", import.meta.url),
          { type: "module" }
        );

        let onStarted = null;
        let onStartFailed = null;
        const started = new Promise((resolve, reject) => {
          onStarted = resolve;
          onStartFailed = reject;
        });

        worker.onmessage = (event) => {
          const message = event.data;
          switch (message.type) {
            case "state":
              // 종료 경고와 "저장 중" 배너의 근거는 워커가 들고 있는 파일 상태다
              openFilesRef.current = message.openFiles;
              setIsSavingRecording(message.savingFiles > 0);
              document.title =
                message.savingFiles > 0
                  ? "⚠️ 녹화 저장 중... 브라우저를 닫지 마세요"
                  : originalTitleRef.current;
              break;
            case "download":
              downloadBuffer(message.fileName, message.buffer);
              break;
            case "started":
              onStarted(message.info);
              break;
            case "start-failed":
              onStartFailed(new Error(message.message));
              break;
            case "rotate-failed":
              console.warn("⚠️ [Record] 녹화 분할 실패:", message.message);
              break;
            case "error":
              setSnackbar({
                open: true,
                message: `녹화 중 인코딩 오류가 발생했습니다: ${message.message}`,
                severity: "error",
              });
              setIsRecording(false);
              break;
            case "stopped":
              // 파일 마무리까지 끝난 뒤에만 워커를 접는다
              worker.terminate();
              break;
            default:
              break;
          }
        };

        // 워커 스크립트 자체가 못 뜨는 경우 — 여기서 끊지 않으면 아래 await가
        // 영원히 매달려 녹화를 다시 시작할 수도 없게 된다
        worker.onerror = (e) => {
          onStartFailed(new Error(e?.message || "녹화 워커를 시작할 수 없습니다."));
        };

        // 트랙이 아니라 readable을 넘긴다 — 트랙을 옮기면 메인 스레드에서
        // track.stop()·onended·readyState를 쓸 수 없게 된다
        const [audioTrack] = stream.getAudioTracks();
        const videoReadable = new MediaStreamTrackProcessor({
          track: videoTrack,
        }).readable;
        const audioReadable = audioTrack
          ? new MediaStreamTrackProcessor({ track: audioTrack }).readable
          : null;

        worker.postMessage(
          {
            type: "start",
            videoReadable,
            audioReadable,
            options: {
              codec,
              videoBitsPerSecond: bitrateMap[quality] || bitrateMap.high,
              audioBitsPerSecond: 192000,
              frameRate,
            },
            segment: {
              fileHandle: initialFileHandle,
              fileName: initialFileName,
            },
          },
          [videoReadable, ...(audioReadable ? [audioReadable] : [])]
        );

        await started;

        // 시작 도중 사용자가 녹화를 껐으면 바로 접는다 (effect의 종료 분기는
        // workerRef가 아직 비어 있어 이 워커를 보지 못했다)
        if (!latestIsRecordingRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          worker.postMessage({ type: "stop" });
          return;
        }

        workerRef.current = worker;

        // 분할(세그먼트 교체): 새 파일을 먼저 열어 워커에 예약한다. 실제 교체는
        // 워커가 다음 키프레임에서 하므로 프레임 공백이 없고, 어떤 단계가 실패해도
        // 기존 녹화는 그대로 계속된다 — 분할 시도가 녹화 전체를 죽이지 않게 하는
        // 것이 이 순서의 핵심
        let rotating = false;
        rotateSegmentRef.current = async () => {
          if (rotating) return;
          rotating = true;
          try {
            if (workerRef.current !== worker || !latestIsRecordingRef.current) {
              return;
            }

            const nextFileName = buildFileName();
            let nextFileHandle = null;
            if (diskBacked) {
              nextFileHandle = await openFileInDir(nextFileName);
              if (!nextFileHandle) {
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

            // 파일 여는 사이 상태가 바뀌었으면 취소 — 만들어둔 빈 파일은 지운다
            if (
              workerRef.current !== worker ||
              !latestIsRecordingRef.current ||
              videoTrack.readyState !== "live"
            ) {
              if (nextFileHandle) {
                await dirHandle?.removeEntry(nextFileName).catch(() => {});
              }
              return;
            }

            worker.postMessage({
              type: "rotate",
              segment: { fileHandle: nextFileHandle, fileName: nextFileName },
            });
          } finally {
            rotating = false;
          }
        };

        // 브라우저 UI에서 '공유 중지' 누를 경우 처리 — 상태만 내리면
        // 아래 종료 분기가 워커 정리를 맡는다
        videoTrack.onended = () => {
          setIsRecording(false);
        };
      } catch (err) {
        console.error("Recording failed or cancelled:", err);
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        // 워커는 start 실패 시 스스로 파일을 정리하므로 여기서는 접기만 한다
        worker?.terminate();
        // 사용자가 화면 공유 대화상자를 취소한 경우는 알릴 것이 없다
        if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
          setSnackbar({
            open: true,
            message: `녹화를 시작하지 못했습니다: ${err?.message || err}`,
            severity: "error",
          });
        }
        setIsRecording(false);
      } finally {
        startingRef.current = false;
      }
    };

    if (isRecording) {
      if (!workerRef.current && !startingRef.current) {
        startRecording();
      }
      return;
    }

    const worker = workerRef.current;
    if (worker) {
      workerRef.current = null;
      rotateSegmentRef.current = null;

      // 파일을 마무리하기 전에 트랙부터 끊는다 — 공유 중 표시가 남지 않고,
      // 캡처 읽기 루프도 여기서 자연히 끝난다
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      // 녹화 중지 알림음 재생 (분할 회전에서는 울리지 않는다 — 무인 녹화 배려)
      if (recordSoundEnabled) {
        playNotificationSound(recordSoundType, recordSoundVolume);
      }

      // 워커가 남은 프레임 flush → 인덱스 기록 → 파일 닫기를 이어서 한다.
      // 저장 진행 표시는 워커의 state 메시지가 담당하므로 여기서는 기다리지 않는다
      worker.postMessage({ type: "stop" });
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      rotateSegmentRef.current = null;
    }
  }, [isRecording, setIsRecording, setIsSavingRecording, setSnackbar, quality, frameRate, codec, recordSoundEnabled, recordSoundType, recordSoundVolume, recordSaveDirHandle, setRecordSaveDirHandle]);

  return contentRef;
};
