type AlarmHandle = {
  stop: () => void;
};

export function startLoopAlarm(): AlarmHandle {
  const AudioCtx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtx) {
    return { stop: () => undefined };
  }

  const ctx = new AudioCtx();
  let stopped = false;
  let intervalId: number | null = null;

  const beep = () => {
    if (stopped || ctx.state === "closed") return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const start = async () => {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    beep();
    intervalId = window.setInterval(beep, 1400);
  };

  void start();

  return {
    stop: () => {
      stopped = true;
      if (intervalId) window.clearInterval(intervalId);
      if (ctx.state !== "closed") void ctx.close();
    },
  };
}
