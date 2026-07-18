// Petits effets sonores synthétisés à la volée (Web Audio API) — aucun
// fichier audio à charger, tout est généré sur l'appareil, cohérent avec
// le reste de l'app qui ne dépend d'aucune ressource externe.
const SoundFx = (() => {
  let ctx = null;

  function ensureCtx() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!ctx) ctx = new AudioCtor();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(audioCtx, freq, startTime, duration, type, gainPeak) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playCorrect() {
    const audioCtx = ensureCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(audioCtx, 523.25, t, 0.12, "triangle", 0.2); // C5
    tone(audioCtx, 659.25, t + 0.1, 0.18, "triangle", 0.2); // E5
  }

  function playIncorrect() {
    const audioCtx = ensureCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(audioCtx, 220, t, 0.16, "sawtooth", 0.15); // A3
    tone(audioCtx, 185, t + 0.12, 0.24, "sawtooth", 0.15); // F#3, descending
  }

  function playProximity() {
    const audioCtx = ensureCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(audioCtx, 880, t, 0.08, "sine", 0.12);
  }

  function playFound() {
    const audioCtx = ensureCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(audioCtx, 523.25, t, 0.1, "triangle", 0.18); // C5
    tone(audioCtx, 659.25, t + 0.09, 0.1, "triangle", 0.18); // E5
    tone(audioCtx, 783.99, t + 0.18, 0.24, "triangle", 0.2); // G5
  }

  return { ensureCtx, playCorrect, playIncorrect, playProximity, playFound };
})();
