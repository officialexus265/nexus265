/** Long ringtone-style loop until stopAlert() is called */

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let playing = false;

function beep(ac: AudioContext, freq: number, start: number, dur: number, gain = 0.12) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.linearRampToValueAtTime(0, start + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function playRingBurst(ac: AudioContext) {
  const t = ac.currentTime;
  // classic dual-tone ring pattern ~2s
  beep(ac, 440, t, 0.35);
  beep(ac, 480, t, 0.35);
  beep(ac, 440, t + 0.45, 0.35);
  beep(ac, 480, t + 0.45, 0.35);
  beep(ac, 440, t + 0.9, 0.35);
  beep(ac, 480, t + 0.9, 0.35);
}

export function startAlert() {
  if (typeof window === "undefined") return;
  if (playing) return;
  playing = true;

  try {
    ctx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    playRingBurst(ctx);
    timer = setInterval(() => {
      if (!playing || !ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      playRingBurst(ctx);
    }, 2500);
  } catch {
    /* audio blocked until user gesture */
  }
}

export function stopAlert() {
  playing = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function isAlertPlaying() {
  return playing;
}

export async function requestNotifyPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const p = await Notification.requestPermission();
  return p === "granted";
}

export function notifyNewChat(title: string, body: string, sessionId?: string) {
  if (typeof window === "undefined") return;

  // Prefer service worker notification (works in background)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.active?.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body,
          sessionId,
        });
      })
      .catch(() => {});
  }

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const n = new Notification(title, {
        body,
        icon: "/icons/icon-192.png",
        tag: sessionId || "nexus265-chat",
        requireInteraction: true,
      });
      n.onclick = () => {
        window.focus();
        window.location.href = "/admin/chat";
        n.close();
      };
    } catch {
      /* ignore */
    }
  }

  startAlert();
}
