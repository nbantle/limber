// Beeps (Web Audio), spoken cues (speech synthesis), and screen wake lock.
// iOS only allows audio after a user gesture, so call unlock() from a tap handler.

// Mix with whatever else is playing (an audiobook, podcast or music) instead of taking over and pausing it.
// Safari 16.4+; elsewhere this is a no-op. 'ambient' also follows the ring/silent switch.
try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* unsupported */ }

let ctx = null;
let voice = null;

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  const en = voices.filter((v) => v.lang?.startsWith('en'));
  voice = en.find((v) => /Samantha|Ava|Allison|Karen|Daniel/.test(v.name) && v.localService) || en.find((v) => v.default) || en[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const audio = {
  unlocked: false,

  // beeps / speech: only wake the outputs that will actually be used, so nothing grabs the audio for no reason.
  unlock({ beeps = true, speech = true } = {}) {
    if (beeps) try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      // A silent blip primes the output on iOS.
      const o = ctx.createOscillator(), g = ctx.createGain();
      g.gain.value = 0.0001; o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.02);
    } catch { /* no audio available */ }
    if (speech) try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    } catch { /* no speech available */ }
    this.unlocked = true;
  },

  beep(freq = 880, dur = 0.12, vol = 0.25) {
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch { /* ignore */ }
  },

  speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  },

  stopSpeech() {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  },
};

let lock = null;
let wanted = false;

async function acquire() {
  try {
    if (wanted && 'wakeLock' in navigator && !lock && document.visibilityState === 'visible') {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    }
  } catch { lock = null; }
}
document.addEventListener('visibilitychange', acquire);

export const wakeLock = {
  on() { wanted = true; acquire(); },
  off() { wanted = false; lock?.release?.(); lock = null; },
};
