import { useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { isRecordingAtom } from "@/atoms/ui";
import dayjs from "dayjs";

export const useScreenRecorder = () => {
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const contentRef = useRef(null);

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

        // 사용자가 선택한 스트림의 비디오 트랙을 가져옴
        const [videoTrack] = stream.getVideoTracks();

        // 영역 자르기 (Region Capture) 적용
        if (cropTarget && videoTrack.cropTo) {
          await videoTrack.cropTo(cropTarget);
        }

        const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
          ? "video/webm; codecs=vp9"
          : "video/webm";

        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 192000,
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
            stream.getTracks().forEach((track) => track.stop());
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

          stream.getTracks().forEach((track) => track.stop());
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
      }
    }
  }, [isRecording, setIsRecording]);

  return contentRef;
};
