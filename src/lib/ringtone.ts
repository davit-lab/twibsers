type RingtoneHandle = {
  start: () => void;
  stop: () => void;
};

// Simple WebAudio ringtone with a repeating beep pattern.
// Note: browsers may block autoplay until the user has interacted with the page.
export function createRingtone(): RingtoneHandle {
  let audioContext: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  let timer: number | null = null;

  const ensureContext = async () => {
    if (!audioContext) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioContext = new Ctx();
      gain = audioContext.createGain();
      gain.gain.value = 0;
      gain.connect(audioContext.destination);

      oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      oscillator.connect(gain);
      oscillator.start();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  };

  const playPatternOnce = () => {
    if (!audioContext || !gain) return;
    const now = audioContext.currentTime;

    // Ring-ring ... pause
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.12, now + 0.02);
    gain.gain.setValueAtTime(0, now + 0.22);

    gain.gain.setValueAtTime(0.12, now + 0.32);
    gain.gain.setValueAtTime(0, now + 0.52);
  };

  const start = () => {
    if (timer) return;

    ensureContext()
      .then(() => {
        playPatternOnce();
        timer = window.setInterval(playPatternOnce, 1800);
      })
      .catch(() => {
        // Autoplay might be blocked; fail silently.
      });
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }

    try {
      if (gain && audioContext) {
        const now = audioContext.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
      }
    } catch {
      // ignore
    }

    try {
      oscillator?.stop();
    } catch {
      // ignore
    }

    try {
      oscillator?.disconnect();
      gain?.disconnect();
    } catch {
      // ignore
    }

    oscillator = null;
    gain = null;

    if (audioContext) {
      // Close to release resources
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  };

  return { start, stop };
}
