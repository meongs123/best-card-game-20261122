// Sound for Lelang Senja: every effect is synthesized with WebAudio.
// One job: turn game moments into short tones. No audio files, no network.
// Silent by default until the player interacts (browsers require a gesture).

let audioContext = null;
let muted = false;

/** True when the player has silenced the effects. */
export function isMuted() {
  return muted;
}

/** Flip the mute switch; returns the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

function context() {
  if (muted) return null;
  try {
    if (!audioContext) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended') void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

/** Play one short tone: frequency in Hz, length in seconds, soft gain. */
export function playTone(frequency, seconds, type, gainValue) {
  const ctx = context();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue || 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Sound is garnish; a blocked tone must never break the game.
  }
}

/** Named moments the game calls: pick, flip, coin, win, lose. */
export const sounds = {
  pick() {
    playTone(520, 0.08, 'triangle', 0.06);
  },
  flip() {
    playTone(340, 0.12, 'sine', 0.09);
    setTimeout(() => playTone(660, 0.1, 'sine', 0.07), 90);
  },
  coin() {
    playTone(880, 0.07, 'square', 0.04);
    setTimeout(() => playTone(1320, 0.09, 'square', 0.04), 70);
  },
  win() {
    // Rising major arpeggio — the win has to land with a flourish.
    [523, 659, 784, 1047].forEach((freq, i) => setTimeout(() => playTone(freq, 0.22, 'triangle', 0.09), i * 130));
  },
  lose() {
    [392, 330, 262].forEach((freq, i) => setTimeout(() => playTone(freq, 0.25, 'sine', 0.08), i * 160));
  },
};
