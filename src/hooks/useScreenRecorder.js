import { useRef, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { isRecordingAtom } from "@/atoms/ui";
import { recordQualityAtom, recordFrameRateAtom } from "@/atoms/setting";
import dayjs from "dayjs";

export const useScreenRecorder = () => {
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const quality = useAtomValue(recordQualityAtom);
  const frameRate = useAtomValue(recordFrameRateAtom);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
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

        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
            cursor: "never",
            frameRate: { ideal: frameRate },
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

        // 사용자가 선택한 스트림의 비디오 트랙을 가져옴
        const [videoTrack] = stream.getVideoTracks();

        // 영역 자르기 (Region Capture) 적용
        if (cropTarget && videoTrack.cropTo) {
          await videoTrack.cropTo(cropTarget);
        }

        const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
          ? "video/webm; codecs=vp9"
          : "video/webm";

        const bitrateMap = {
          high: 8000000,
          medium: 5000000,
          low: 2500000,
        };
        const videoBitsPerSecond = bitrateMap[quality] || 8000000;

        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 192000,
          videoBitsPerSecond,
        });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        const stopRecording = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          if (blob.size === 0) {
            // 데이터가 없으면 저장하지 않고 종료
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setIsRecording(false);
            mediaRecorderRef.current = null;
            return;
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const fileName = `${dayjs().format("YYMMDD_HHdm")}.webm`;

          a.style.display = "none";
          a.href = url;
          a.download = fileName;

          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);

          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsRecording(false);
          mediaRecorderRef.current = null;
        };

        recorder.onstop = stopRecording;

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
  }, [isRecording, setIsRecording, quality, frameRate]);

  return contentRef;
};
