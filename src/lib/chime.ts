/**
 * Soft two-tone "ding" for new-email notifications. Generated via
 * Web Audio so we don't ship an audio asset and so the chime renders
 * cleanly at any volume the user has the app at — pre-recorded chimes
 * tend to clip when amplified by accessibility tools.
 *
 * Two sine partials, A5 → A6, ~150 ms total, with a smooth attack/decay
 * envelope so it lands as a chime instead of a click.
 */
let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  try {
    context = new AudioContext();
    return context;
  } catch {
    return null;
  }
}

export function playChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const partials: { freq: number; start: number; dur: number; gain: number }[] = [
    { freq: 880, start: now, dur: 0.18, gain: 0.18 },
    { freq: 1318.5, start: now + 0.08, dur: 0.22, gain: 0.14 },
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = p.freq;

    env.gain.setValueAtTime(0, p.start);
    env.gain.linearRampToValueAtTime(p.gain, p.start + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, p.start + p.dur);

    osc.connect(env).connect(ctx.destination);
    osc.start(p.start);
    osc.stop(p.start + p.dur);
  }
}
