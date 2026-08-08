/** Browser Speech Synthesis — $0, no external API */

function pickVoice(gender: "male" | "female"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = en.length ? en : voices;

  const femaleHints = /female|woman|girl|samantha|victoria|karen|moira|fiona|tessa|zira|susan|hazel|google us english female|microsoft zira/i;
  const maleHints = /male|man|boy|david|daniel|thomas|fred|alex|google us english male|microsoft david|microsoft mark|ravi/i;

  if (gender === "female") {
    return (
      pool.find((v) => femaleHints.test(v.name)) ||
      pool.find((v) => !maleHints.test(v.name)) ||
      pool[0]
    );
  }
  return (
    pool.find((v) => maleHints.test(v.name)) ||
    pool.find((v) => !femaleHints.test(v.name)) ||
    pool[0]
  );
}

export function speakAsAgent(
  text: string,
  gender: "male" | "female" = "female"
) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 1.02;
  utter.pitch = gender === "female" ? 1.08 : 0.92;
  utter.volume = 1;

  const apply = () => {
    const voice = pickVoice(gender);
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  };

  // Chrome often loads voices async
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) apply();
  else {
    window.speechSynthesis.onvoiceschanged = () => {
      apply();
      window.speechSynthesis.onvoiceschanged = null;
    };
    // fallback
    setTimeout(apply, 250);
  }
}

export function stopAgentVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
