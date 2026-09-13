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
