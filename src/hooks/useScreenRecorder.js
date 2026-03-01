import { useRef, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { isRecordingAtom } from "@/atoms/ui";
import { recordQualityAtom, recordFrameRateAtom, recordCodecAtom, recordSoundEnabledAtom, recordSoundTypeAtom, recordSoundVolumeAtom, recordSaveDirHandleAtom } from "@/atoms/setting";
import { playNotificationSound } from "@/utils/audio";
import { getRecordDirectory } from "@/utils/recordDirectoryStorage";
import dayjs from "dayjs";

export const useScreenRecorder = () => {
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const quality = useAtomValue(recordQualityAtom);
  const frameRate = useAtomValue(recordFrameRateAtom);
  const codec = useAtomValue(recordCodecAtom);
  const recordSoundEnabled = useAtomValue(recordSoundEnabledAtom);
  const recordSoundType = useAtomValue(recordSoundTypeAtom);
  const recordSoundVolume = useAtomValue(recordSoundVolumeAtom);
  const [recordSaveDirHandle, setRecordSaveDirHandle] = useAtom(recordSaveDirHandleAtom);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const writableStreamRef = useRef(null); // File System Access API: 디스크 직접 스트리밍용
  const contentRef = useRef(null);
  const latestIsRecordingRef = useRef(isRecording);

  useEffect(() => {
    latestIsRecordingRef.current = isRecording;
  }, [isRecording]);

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
        writableStreamRef.current.close().catch(() => {});
        writableStreamRef.current = null;
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

        // 파일명 미리 결정
        const fileName = `${dayjs().format("YYMMDD_HHmm")}.webm`;

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

        // 화면 공유 허용 후 파일 생성
        if (dirHandle && dirPermissionGranted) {
          try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            writableStreamRef.current = await fileHandle.createWritable();
          } catch (e) {
            console.warn("지정 폴더 파일 생성 실패, 수동 선택으로 전환합니다:", e);
          }
        }

        if (!writableStreamRef.current) {
          if (typeof window !== "undefined" && window.showSaveFilePicker) {
            try {
              const fileHandle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: "WebM Video", accept: { "video/webm": [".webm"] } }],
              });
              writableStreamRef.current = await fileHandle.createWritable();
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

        const recorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            if (writableStreamRef.current) {
              // 디스크 직접 스트리밍 (메모리 누적 없음)
              try {
                await writableStreamRef.current.write(e.data);
              } catch (writeErr) {
                console.error("디스크 쓰기 오류:", writeErr);
              }
            } else {
              // 폴백: 메모리에 누적
              chunksRef.current.push(e.data);
            }
          }
        };

        const stopRecording = async () => {
          if (writableStreamRef.current) {
            // File System Access API: 스트림 닫으면 파일이 완성됨
            try {
              await writableStreamRef.current.close();
            } catch (e) {
              console.error("파일 스트림 닫기 오류:", e);
            }
            writableStreamRef.current = null;
          } else {
            // 폴백: 메모리 Blob → 다운로드
            const blob = new Blob(chunksRef.current, { type: mimeType });
            if (blob.size === 0) {
              streamRef.current?.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
              setIsRecording(false);
              mediaRecorderRef.current = null;
              return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.style.display = "none";
            a.href = url;
            a.download = `${dayjs().format("YYMMDD_HHmm")}.webm`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }, 100);
          }

          chunksRef.current = [];
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsRecording(false);
          mediaRecorderRef.current = null;

          // 녹화 중지 알림음 재생
          if (recordSoundEnabled) {
            playNotificationSound(recordSoundType, recordSoundVolume);
          }
        };

        recorder.onstop = () => { stopRecording(); };

        // 브라우저 UI에서 '공유 중지' 누를 경우 처리
        stream.getVideoTracks()[0].onended = () => {
          if (recorder.state === "recording") {
            recorder.stop();
          } else {
            // 이미 stop된 경우 상태만 동기화
            setIsRecording(false);
            mediaRecorderRef.current = null;
            streamRef.current = null;
          }
        };

        recorder.start(1000);
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
      }
    }
  }, [isRecording, setIsRecording, quality, frameRate, codec, recordSoundEnabled, recordSoundType, recordSoundVolume]);

  return contentRef;
};
