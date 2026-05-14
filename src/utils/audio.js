let audioCtx = null;

const getAudioContext = () => {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    return audioCtx;
};

export const playNotificationSound = (type, volume = 50) => {
  if (!type || type === "none") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // 사용자 인터랙션 이후 오디오 컨텍스트가 suspended 상태일 수 있으므로 resume 시도
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.error("Audio resume failed", e));
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    const volumeMultiplier = volume / 5;

    if (type === "ding") {
      // 띵~ (C5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, currentTime);
      gain.gain.setValueAtTime(0.1 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.5);
      osc.start(currentTime);
      osc.stop(currentTime + 0.5);
    } else if (type === "chime") {
      // 띠링~ (E5 -> G5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, currentTime);
      osc.frequency.setValueAtTime(783.99, currentTime + 0.1);
      gain.gain.setValueAtTime(0.1 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.6);
      osc.start(currentTime);
      osc.stop(currentTime + 0.6);
    } else if (type === "alert") {
      // 빰! (A4 sawtooth)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440.00, currentTime);
      gain.gain.setValueAtTime(0.05 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.3);
      osc.start(currentTime);
      osc.stop(currentTime + 0.3);
    } else if (type === "beep") {
      // 삐~ (A5)
      osc.type = "square";
      osc.frequency.setValueAtTime(880.00, currentTime);
      gain.gain.setValueAtTime(0.08 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.2);
      osc.start(currentTime);
      osc.stop(currentTime + 0.2);
    } else if (type === "success") {
      // 성공! (C5 -> E5 -> G5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, currentTime);
      osc.frequency.setValueAtTime(659.25, currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, currentTime + 0.16);
      gain.gain.setValueAtTime(0.1 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.5);
      osc.start(currentTime);
      osc.stop(currentTime + 0.5);
    } else if (type === "fanfare") {
      // 팡파레! (C5 -> G5 -> C6)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, currentTime);
      osc.frequency.setValueAtTime(783.99, currentTime + 0.12);
      osc.frequency.setValueAtTime(1046.50, currentTime + 0.24);
      gain.gain.setValueAtTime(0.12 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.7);
      osc.start(currentTime);
      osc.stop(currentTime + 0.7);
    } else if (type === "blip") {
      // 블립! (D6 짧게)
      osc.type = "sine";
      osc.frequency.setValueAtTime(1174.66, currentTime);
      gain.gain.setValueAtTime(0.09 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.15);
      osc.start(currentTime);
      osc.stop(currentTime + 0.15);
    } else if (type === "swoosh") {
      // 슈우~ (800Hz -> 400Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, currentTime + 0.3);
      gain.gain.setValueAtTime(0.08 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.4);
      osc.start(currentTime);
      osc.stop(currentTime + 0.4);
    } else if (type === "pop") {
      // 팝! (F5 짧고 강하게)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(698.46, currentTime);
      gain.gain.setValueAtTime(0.15 * volumeMultiplier, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, currentTime + 0.12);
      osc.start(currentTime);
      osc.stop(currentTime + 0.12);
    }
  } catch (e) {
    console.error("Audio hint failed", e);
  }
};
