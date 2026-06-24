export type FeedbackToneType = "success" | "error";

let lastToneAt = 0;
let lastToneType: FeedbackToneType | null = null;

export function playFeedbackTone(type: FeedbackToneType) {
  try {
    const playedAt = Date.now();
    if (lastToneType === type && playedAt - lastToneAt < 220) {
      return;
    }

    lastToneAt = playedAt;
    lastToneType = type;

    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();

    const play = () => {
      const now = context.currentTime;
      const output = context.createGain();

      output.gain.setValueAtTime(0.0001, now);
      output.gain.exponentialRampToValueAtTime(type === "success" ? 0.1 : 0.075, now + 0.018);
      output.gain.exponentialRampToValueAtTime(0.0001, now + (type === "success" ? 0.38 : 0.3));
      output.connect(context.destination);

      if (type === "success") {
        const first = context.createOscillator();
        const second = context.createOscillator();

        first.type = "sine";
        second.type = "sine";
        first.frequency.setValueAtTime(660, now);
        second.frequency.setValueAtTime(880, now + 0.11);
        first.connect(output);
        second.connect(output);
        first.start(now);
        first.stop(now + 0.16);
        second.start(now + 0.11);
        second.stop(now + 0.36);
        second.addEventListener("ended", () => void context.close());
        return;
      }

      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(190, now);
      oscillator.frequency.exponentialRampToValueAtTime(135, now + 0.22);
      oscillator.connect(output);
      oscillator.start(now);
      oscillator.stop(now + 0.28);
      oscillator.addEventListener("ended", () => void context.close());
    };

    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => void context.close());
    } else {
      play();
    }
  } catch {
    // Alerts still work when browser audio is unavailable or blocked.
  }
}
