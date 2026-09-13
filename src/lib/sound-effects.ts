// ═══════════════════════════════════════════════════════════════
// Web Audio API Synthesizer for The ARC Cinematic Onboarding
// Zero external asset dependencies — deterministic, zero-latency
// ═══════════════════════════════════════════════════════════════

let audioCtx: AudioContext | null = null;
let isMuted = false;
let activeDroneGain: GainNode | null = null;
let activeDroneOscs: OscillatorNode[] = [];

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (isMuted && activeDroneGain) {
    activeDroneGain.gain.value = 0;
  }
}

export function getIsMuted(): boolean {
  return isMuted;
}

/**
 * Subtle high-precision mechanical tick for card selection / hover.
 */
export function playTick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // AudioContext may be restricted by browser policy
  }
}

/**
 * Cinematic comic impact beat: sub-bass shockwave with a punchy transient.
 */
export function playImpactBeat() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // Sub oscillator (punch + body)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(38, t + 0.35);

    subGain.gain.setValueAtTime(0.35, t);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(t);
    subOsc.stop(t + 0.45);

    // Filtered noise crack for comic "impact" transient
    const bufferSize = ctx.sampleRate * 0.06;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(900, t);
    noiseFilter.frequency.linearRampToValueAtTime(200, t + 0.05);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.06);
  } catch {
    // Graceful fallback
  }
}

/**
 * Shimmering antique gold chime (D5 + A5 harmonics) for affirmative comic beats.
 */
export function playChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const freqs = [587.33, 880.0, 1174.66]; // D5, A5, D6
    const gains = [0.12, 0.08, 0.05];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(gains[idx], t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1.2);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Heavy iron vault bolt lock sound for Q4 "DISCIPLINE LOCKED".
 */
export function playLockSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // First notch
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.exponentialRampToValueAtTime(110, t + 0.08);
    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Second heavy slam (80ms later)
    const t2 = t + 0.08;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(180, t2);
    osc2.frequency.exponentialRampToValueAtTime(45, t2 + 0.35);
    gain2.gain.setValueAtTime(0.3, t2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.35);
  } catch {
    // Graceful fallback
  }
}

/**
 * Start ambient drone pulse for "UNDERSTANDING YOUR ARC..." phase.
 */
export function startAmbientPulse() {
  if (isMuted) return () => {};
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  try {
    stopAmbientPulse();

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t);
    masterGain.gain.linearRampToValueAtTime(0.12, t + 0.8);
    masterGain.connect(ctx.destination);
    activeDroneGain = masterGain;

    const freqs = [55, 110, 165]; // A1, A2, E3 harmonics
    activeDroneOscs = freqs.map((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Subtle slow frequency wobble
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.4 + i * 0.1;
      lfoGain.gain.value = 1.2;
      lfo.connect(osc.frequency);
      lfo.start(t);

      oscGain.gain.value = 0.2 / (i + 1);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(t);
      return osc;
    });

    return () => stopAmbientPulse();
  } catch {
    return () => {};
  }
}

export function stopAmbientPulse() {
  if (activeDroneGain && audioCtx) {
    try {
      activeDroneGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    } catch {}
  }
  setTimeout(() => {
    activeDroneOscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {}
    });
    activeDroneOscs = [];
    if (activeDroneGain) {
      try {
        activeDroneGain.disconnect();
      } catch {}
      activeDroneGain = null;
    }
  }, 450);
}

/**
 * Resonant open fifth chord (D - A - D - F#) for the Arc Climax reveal.
 */
export function playClimaxFanfare() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const notes = [
      { freq: 146.83, delay: 0, dur: 2.2, vol: 0.18, type: 'triangle' as OscillatorType }, // D3
      { freq: 220.00, delay: 0.05, dur: 2.4, vol: 0.15, type: 'sine' as OscillatorType },    // A3
      { freq: 293.66, delay: 0.1, dur: 2.6, vol: 0.14, type: 'sine' as OscillatorType },     // D4
      { freq: 369.99, delay: 0.15, dur: 2.8, vol: 0.12, type: 'sine' as OscillatorType },    // F#4
      { freq: 587.33, delay: 0.2, dur: 3.0, vol: 0.10, type: 'sine' as OscillatorType },     // D5 shimmer
    ];

    notes.forEach(({ freq, delay, dur, vol, type }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.0001, t + delay);
      gain.gain.linearRampToValueAtTime(vol, t + delay + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + dur);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Semantic Graphic Novel Sound Events
 */

/** Deep cinematic entrance sound for the opening of THE ARC */
export function playComicIntro() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.linearRampToValueAtTime(120, t + 1.2);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 1.25);
  } catch {}
}

/** Crisp, delicate typewriter/dialogue entry click */
export function playDialogueAppear() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.02);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.03);
  } catch {}
}

/** Punchy restrained panel transition swipe */
export function playQuestionAdvance() {
  if (isMuted) return;
  playImpactBeat();
}

/** Swift iron lock for quest acceptance (<250ms) */
export function playQuestAccept() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  } catch {}
}

/** High-impact quest completion thump + chime */
export function playQuestComplete() {
  if (isMuted) return;
  playImpactBeat();
  setTimeout(() => {
    playChime();
  }, 120);
}

/** Ascending pip for XP gain increment */
export function playXpGain() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t); // E5
    osc.frequency.exponentialRampToValueAtTime(880.0, t + 0.08); // A5

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  } catch {}
}

/** Warm harmonic pip for attribute score increment */
export function playAttributeGain() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(554.37, t); // C#5
    osc.frequency.exponentialRampToValueAtTime(739.99, t + 0.09); // F#5

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  } catch {}
}

/** Resonant brass/bell harmonic swell for relic/badge unlock */
export function playBadgeUnlock() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const freqs = [329.63, 493.88, 659.25, 987.77]; // E4, B4, E5, B5

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.001, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.14 - idx * 0.02, t + idx * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 1.5);
    });
  } catch {}
}

/** Dramatic dual-octave chord rise for Level Up */
export function playLevelUp() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    // Dramatic low to high power chord: A2, E3, A3, C#4, E4, A4
    const notes = [110, 164.81, 220, 277.18, 329.63, 440];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0.001, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.16, t + i * 0.04 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 1.9);
    });
  } catch {}
}

/** Reverberant cadence for Milestones */
export function playMilestone() {
  if (isMuted) return;
  playClimaxFanfare();
}

/** Restrained low hollow stone reject sound (Anti-Cheat / Invalid Action) */
export function playActionRejected() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Low hollow square/saw wave at 82 Hz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(82, t);
    osc.frequency.linearRampToValueAtTime(45, t + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.linearRampToValueAtTime(100, t + 0.3);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  } catch {}
}

/** Mechanical latch / relic seating snap when equipping a reward */
export function playRewardEquipped() {
  if (isMuted) return;
  playLockSound();
}
