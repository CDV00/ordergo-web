/**
 * Âm "ting" 2 nốt bằng Web Audio — không cần file âm thanh.
 * Trình duyệt chỉ cho phát sau khi người dùng chạm/bấm 1 lần → gọi `unlockSound()` trong onClick.
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

export async function unlockSound(): Promise<boolean> {
  const c = getContext();
  if (!c) return false;
  if (c.state === "suspended") await c.resume().catch(() => undefined);
  return c.state === "running";
}

export function soundUnlocked(): boolean {
  return ctx?.state === "running";
}

export function playChime(): void {
  const c = getContext();
  if (!c || c.state !== "running") return;
  const now = c.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}
