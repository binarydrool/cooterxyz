"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audio = useAudioState();
  return (
    <AudioContext.Provider value={audio}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    return {
      isMuted: false,
      musicEnabled: true,
      sfxEnabled: true,
      volume: 0.7,
      initialized: false,
      initAudio: () => {},
      playSound: () => {},
      playFootstep: () => {},
      startGearTick: () => {},
      stopGearTick: () => {},
      startAmbientMusic: () => {},
      stopAmbientMusic: () => {},
      startSwampMusic: () => {},
      stopSwampMusic: () => {},
      toggleMute: () => {},
      setVolume: () => {},
    };
  }
  return context;
}

// Sound effects enum
export const SOUNDS = {
  GEAR_TICK: 'gearTick',
  TIME_STOP: 'timeStop',
  TIME_RESUME: 'timeResume',
  ESSENCE_SPAWN: 'essenceSpawn',
  COLLECT_ESSENCE: 'collectEssence',
  MODAL_OPEN: 'modalOpen',
  MODAL_CLOSE: 'modalClose',
  FOOTSTEP: 'footstep',
  JUMP: 'jump',
  PORTAL_ENTER: 'portalEnter',
  SUCCESS: 'success',
  ERROR: 'error',
  UNLOCK: 'unlock',
  // Frog game sounds
  FROG_HOP: 'frogHop',
  FROG_SPLASH: 'frogSplash',
  FROG_DAMAGE: 'frogDamage',
  FROG_RIBBIT: 'frogRibbit',
  DRAGONFLY_BUZZ: 'dragonflyBuzz',
  FISH_ATTACK: 'fishAttack',
  COIN_COLLECT: 'coinCollect',
  POWERUP: 'powerup',
  GAME_OVER: 'gameOver',
  VICTORY: 'victory',
};

const AUDIO_SETTINGS_KEY = 'cooter_audio_settings';

function useAudioState() {
  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [initialized, setInitialized] = useState(false);

  const audioContextRef = useRef(null);
  const gearTickIntervalRef = useRef(null);
  const lastFootstepRef = useRef(0);
  const ambientOscillatorsRef = useRef([]);
  const ambientGainRef = useRef(null);
  const ambientChimeIntervalRef = useRef(null);
  const isAmbientPlayingRef = useRef(false);
  // Swamp music refs
  const swampOscillatorsRef = useRef([]);
  const swampGainRef = useRef(null);
  const swampIntervalsRef = useRef([]);
  const isSwampPlayingRef = useRef(false);

  // Load settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setIsMuted(settings.isMuted ?? false);
        setMusicEnabled(settings.musicEnabled ?? true);
        setSfxEnabled(settings.sfxEnabled ?? true);
        setVolume(settings.volume ?? 0.7);
      }
    } catch (err) {}
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({
        isMuted, musicEnabled, sfxEnabled, volume,
      }));
    } catch (err) {}
  }, [isMuted, musicEnabled, sfxEnabled, volume]);

  // Get or create audio context
  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    return audioContextRef.current;
  }, []);

  // Initialize audio
  const initAudio = useCallback(() => {
    if (initialized) return;
    const ctx = getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    setInitialized(true);
  }, [initialized, getContext]);

  // Auto-init on interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initAudio]);

  // Sound synthesis functions
  const synthesizeSound = useCallback((type) => {
    const ctx = getContext();
    if (!ctx || isMuted || !sfxEnabled) return;

    const now = ctx.currentTime;
    const vol = volume;

    switch (type) {
      case SOUNDS.GEAR_TICK: {
        // Multi-layered grandfather clock tick - warm and mechanical
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.04, now);
        masterGain.connect(ctx.destination);

        // Layer 1: Deep wooden thunk
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const filter1 = ctx.createBiquadFilter();
        osc1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(masterGain);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.04);
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(200, now);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc1.start(now);
        osc1.stop(now + 0.1);

        // Layer 2: Metallic click
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const filter2 = ctx.createBiquadFilter();
        osc2.connect(filter2);
        filter2.connect(gain2);
        gain2.connect(masterGain);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2200, now);
        osc2.frequency.exponentialRampToValueAtTime(800, now + 0.015);
        filter2.type = 'bandpass';
        filter2.frequency.setValueAtTime(1500, now);
        filter2.Q.setValueAtTime(2, now);
        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc2.start(now);
        osc2.stop(now + 0.03);

        // Layer 3: Gentle mechanical whir undertone
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        const filter3 = ctx.createBiquadFilter();
        osc3.connect(filter3);
        filter3.connect(gain3);
        gain3.connect(masterGain);
        osc3.type = 'sawtooth';
        osc3.frequency.setValueAtTime(60, now);
        filter3.type = 'lowpass';
        filter3.frequency.setValueAtTime(120, now);
        gain3.gain.setValueAtTime(0.08, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc3.start(now);
        osc3.stop(now + 0.06);

        // Layer 4: High resonance (escapement ping)
        const osc4 = ctx.createOscillator();
        const gain4 = ctx.createGain();
        osc4.connect(gain4);
        gain4.connect(masterGain);
        osc4.type = 'sine';
        osc4.frequency.setValueAtTime(3500, now);
        osc4.frequency.exponentialRampToValueAtTime(2000, now + 0.02);
        gain4.gain.setValueAtTime(0.03, now);
        gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc4.start(now);
        osc4.stop(now + 0.04);
        break;
      }

      case SOUNDS.TIME_STOP: {
        // Low whoosh
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain1.gain.setValueAtTime(vol * 0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.start(now);
        osc1.stop(now + 0.5);
        // High shimmer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2000, now);
        osc2.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain2.gain.setValueAtTime(vol * 0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.start(now);
        osc2.stop(now + 0.3);
        break;
      }

      case SOUNDS.TIME_RESUME: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(vol * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case SOUNDS.ESSENCE_SPAWN: {
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.8);
          }, i * 80);
        });
        break;
      }

      case SOUNDS.COLLECT_ESSENCE: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.1);
        gain.gain.setValueAtTime(vol * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case SOUNDS.MODAL_OPEN: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(vol * 0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case SOUNDS.MODAL_CLOSE: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(vol * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case SOUNDS.FOOTSTEP: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(vol * 0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case SOUNDS.JUMP: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(vol * 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case SOUNDS.PORTAL_ENTER: {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, now);
        osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
        gain1.gain.setValueAtTime(vol * 0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.start(now);
        osc1.stop(now + 0.6);
        break;
      }

      case SOUNDS.SUCCESS:
      case SOUNDS.UNLOCK: {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          }, i * 100);
        });
        break;
      }

      case SOUNDS.ERROR: {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(vol * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      // === FROG GAME SOUNDS ===

      case SOUNDS.FROG_HOP: {
        // Bouncy cartoon frog hop - "boing" sound
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.15, now);
        masterGain.connect(ctx.destination);

        // Main boing - pitch sweep up then down
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        osc1.frequency.exponentialRampToValueAtTime(250, now + 0.15);
        gain1.gain.setValueAtTime(0.6, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // Splash undertone
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        const filter2 = ctx.createBiquadFilter();
        osc2.connect(filter2);
        filter2.connect(gain2);
        gain2.connect(masterGain);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(80, now);
        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(200, now);
        gain2.gain.setValueAtTime(0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc2.start(now);
        osc2.stop(now + 0.1);
        break;
      }

      case SOUNDS.FROG_SPLASH: {
        // Water splash - bubbles and swoosh
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.25, now);
        masterGain.connect(ctx.destination);

        // Low splash impact
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const filter1 = ctx.createBiquadFilter();
        osc1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(masterGain);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(300, now);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Bubble pops - multiple small high pops
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const bubbleOsc = ctx.createOscillator();
            const bubbleGain = ctx.createGain();
            bubbleOsc.connect(bubbleGain);
            bubbleGain.connect(masterGain);
            bubbleOsc.type = 'sine';
            const bubbleFreq = 800 + Math.random() * 600;
            bubbleOsc.frequency.setValueAtTime(bubbleFreq, ctx.currentTime);
            bubbleOsc.frequency.exponentialRampToValueAtTime(bubbleFreq * 0.5, ctx.currentTime + 0.05);
            bubbleGain.gain.setValueAtTime(0.15, ctx.currentTime);
            bubbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            bubbleOsc.start(ctx.currentTime);
            bubbleOsc.stop(ctx.currentTime + 0.08);
          }, i * 40 + Math.random() * 30);
        }
        break;
      }

      case SOUNDS.FROG_DAMAGE: {
        // Hurt sound - descending painful bwah
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.2, now);
        masterGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);

        // Impact thud
        const thud = ctx.createOscillator();
        const thudGain = ctx.createGain();
        thud.connect(thudGain);
        thudGain.connect(masterGain);
        thud.type = 'sine';
        thud.frequency.setValueAtTime(80, now);
        thudGain.gain.setValueAtTime(0.5, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        thud.start(now);
        thud.stop(now + 0.1);
        break;
      }

      case SOUNDS.FROG_RIBBIT: {
        // Classic ribbit - two-tone croak
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.12, now);
        masterGain.connect(ctx.destination);

        // First ribbit
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.setValueAtTime(220, now + 0.05);
        osc1.frequency.setValueAtTime(180, now + 0.08);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.start(now);
        osc1.stop(now + 0.12);

        // Second ribbit (slightly delayed)
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(masterGain);
          osc2.type = 'square';
          osc2.frequency.setValueAtTime(200, ctx.currentTime);
          osc2.frequency.setValueAtTime(250, ctx.currentTime + 0.04);
          osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.07);
          gain2.gain.setValueAtTime(0.35, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.1);
        }, 150);
        break;
      }

      case SOUNDS.DRAGONFLY_BUZZ: {
        // Angry buzzing insect
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.1, now);
        masterGain.connect(ctx.destination);

        // Main buzz - modulated sawtooth
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        // Vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.frequency.setValueAtTime(40, now);
        lfoGain.gain.setValueAtTime(30, now);
        lfo.start(now);
        lfo.stop(now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case SOUNDS.FISH_ATTACK: {
        // Threatening underwater attack - whoosh with bite
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(vol * 0.25, now);
        masterGain.connect(ctx.destination);

        // Deep whoosh rising
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const filter1 = ctx.createBiquadFilter();
        osc1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(masterGain);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(50, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(400, now);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.start(now);
        osc1.stop(now + 0.4);

        // Snap/bite at the end
        setTimeout(() => {
          const snap = ctx.createOscillator();
          const snapGain = ctx.createGain();
          snap.connect(snapGain);
          snapGain.connect(masterGain);
          snap.type = 'triangle';
          snap.frequency.setValueAtTime(800, ctx.currentTime);
          snap.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);
          snapGain.gain.setValueAtTime(0.5, ctx.currentTime);
          snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          snap.start(ctx.currentTime);
          snap.stop(ctx.currentTime + 0.05);
        }, 250);
        break;
      }

      case SOUNDS.COIN_COLLECT: {
        // Classic coin bling
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(988, now); // B5
        osc.frequency.setValueAtTime(1319, now + 0.08); // E6
        gain.gain.setValueAtTime(vol * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case SOUNDS.POWERUP: {
        // Rising magical chime
        const notes = [523, 659, 784, 988, 1175]; // C5, E5, G5, B5, D6
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol * 0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
          }, i * 50);
        });
        break;
      }

      case SOUNDS.GAME_OVER: {
        // Sad descending tones
        const notes = [392, 349, 294, 262]; // G4, F4, D4, C4
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
          }, i * 200);
        });
        break;
      }

      case SOUNDS.VICTORY: {
        // Triumphant fanfare
        const notes = [523, 659, 784, 1047, 1319, 1568]; // C5, E5, G5, C6, E6, G6
        notes.forEach((freq, i) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc2.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);
            gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc2.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            osc2.stop(ctx.currentTime + 0.5);
          }, i * 80);
        });
        break;
      }
    }
  }, [getContext, isMuted, sfxEnabled, volume]);

  // Play sound
  const playSound = useCallback((soundId) => {
    if (!initialized || isMuted || !sfxEnabled) return;
    synthesizeSound(soundId);
  }, [initialized, isMuted, sfxEnabled, synthesizeSound]);

  // Play footstep with rate limiting
  const playFootstep = useCallback(() => {
    if (!initialized || isMuted || !sfxEnabled) return;
    const now = Date.now();
    if (now - lastFootstepRef.current > 280) {
      lastFootstepRef.current = now;
      synthesizeSound(SOUNDS.FOOTSTEP);
    }
  }, [initialized, isMuted, sfxEnabled, synthesizeSound]);

  // Start gear ticking
  const startGearTick = useCallback(() => {
    if (gearTickIntervalRef.current) return;
    gearTickIntervalRef.current = setInterval(() => {
      if (!isMuted && sfxEnabled && initialized) {
        synthesizeSound(SOUNDS.GEAR_TICK);
      }
    }, 500);
  }, [isMuted, sfxEnabled, initialized, synthesizeSound]);

  // Stop gear ticking
  const stopGearTick = useCallback(() => {
    if (gearTickIntervalRef.current) {
      clearInterval(gearTickIntervalRef.current);
      gearTickIntervalRef.current = null;
    }
  }, []);

  // Start ambient music - sophisticated clock tower soundscape
  const startAmbientMusic = useCallback(() => {
    if (isAmbientPlayingRef.current || !musicEnabled || isMuted || !initialized) return;

    const ctx = getContext();
    if (!ctx) return;

    isAmbientPlayingRef.current = true;

    // Master gain with subtle compression effect via multiple gain stages
    ambientGainRef.current = ctx.createGain();
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(2000, ctx.currentTime);
    ambientGainRef.current.connect(masterFilter);
    masterFilter.connect(ctx.destination);
    ambientGainRef.current.gain.setValueAtTime(volume * 0.06, ctx.currentTime);

    // Rich drone with multiple harmonics - D major 7 chord
    const droneNotes = [
      { freq: 73.42, type: 'sine', vol: 0.12 },    // D2 - root
      { freq: 110, type: 'sine', vol: 0.10 },      // A2 - fifth
      { freq: 146.83, type: 'sine', vol: 0.08 },   // D3 - octave
      { freq: 185, type: 'triangle', vol: 0.04 },  // F#3 - major third
      { freq: 220, type: 'sine', vol: 0.06 },      // A3 - fifth
      { freq: 277.18, type: 'sine', vol: 0.03 },   // C#4 - major 7th
    ];

    droneNotes.forEach((note, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const oscFilter = ctx.createBiquadFilter();
      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(ambientGainRef.current);
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime);
      // Slight detuning for warmth
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);
      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(800 + i * 100, ctx.currentTime);
      oscGain.gain.setValueAtTime(note.vol, ctx.currentTime);
      osc.start(ctx.currentTime);
      ambientOscillatorsRef.current.push({ osc, gain: oscGain });
    });

    // Slow LFO to modulate drone volume for breathing effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(ambientGainRef.current.gain);
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // Very slow
    lfoGain.gain.setValueAtTime(volume * 0.01, ctx.currentTime);
    lfo.start(ctx.currentTime);
    ambientOscillatorsRef.current.push({ osc: lfo, gain: lfoGain });

    // Periodic musical phrases - clock tower bells and chimes
    const playChime = () => {
      if (!isAmbientPlayingRef.current || !musicEnabled || isMuted) return;

      // Choose from different musical motifs
      const motifs = [
        // Westminster-style phrase
        [{ f: 392, d: 0.4 }, { f: 330, d: 0.4 }, { f: 349, d: 0.4 }, { f: 262, d: 0.8 }],
        // Simple bell
        [{ f: 523, d: 1.2 }],
        // Two-note chime
        [{ f: 440, d: 0.5 }, { f: 330, d: 0.8 }],
        // Ascending arpeggio
        [{ f: 262, d: 0.3 }, { f: 330, d: 0.3 }, { f: 392, d: 0.3 }, { f: 523, d: 0.6 }],
        // Descending bells
        [{ f: 523, d: 0.4 }, { f: 440, d: 0.4 }, { f: 392, d: 0.6 }],
      ];

      const motif = motifs[Math.floor(Math.random() * motifs.length)];
      let delay = 0;

      motif.forEach(note => {
        setTimeout(() => {
          if (!isAmbientPlayingRef.current) return;

          // Bell-like sound with harmonics
          const fundamental = ctx.createOscillator();
          const harmonic2 = ctx.createOscillator();
          const harmonic3 = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          fundamental.connect(filter);
          harmonic2.connect(filter);
          harmonic3.connect(filter);
          filter.connect(gain);
          gain.connect(ambientGainRef.current);

          fundamental.type = 'sine';
          fundamental.frequency.setValueAtTime(note.f, ctx.currentTime);
          harmonic2.type = 'sine';
          harmonic2.frequency.setValueAtTime(note.f * 2.0, ctx.currentTime);
          harmonic3.type = 'sine';
          harmonic3.frequency.setValueAtTime(note.f * 3.0, ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(note.f * 4, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(note.f, ctx.currentTime + note.d);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.d + 0.5);

          fundamental.start(ctx.currentTime);
          harmonic2.start(ctx.currentTime);
          harmonic3.start(ctx.currentTime);
          fundamental.stop(ctx.currentTime + note.d + 0.6);
          harmonic2.stop(ctx.currentTime + note.d + 0.6);
          harmonic3.stop(ctx.currentTime + note.d + 0.6);
        }, delay * 1000);

        delay += note.d;
      });
    };

    // Play chimes at varying intervals
    const scheduleNextChime = () => {
      if (!isAmbientPlayingRef.current) return;
      const interval = 5000 + Math.random() * 8000; // 5-13 seconds
      ambientChimeIntervalRef.current = setTimeout(() => {
        playChime();
        scheduleNextChime();
      }, interval);
    };

    // Start first chime after a short delay
    setTimeout(() => {
      if (isAmbientPlayingRef.current) {
        playChime();
        scheduleNextChime();
      }
    }, 2000);

  }, [getContext, musicEnabled, isMuted, initialized, volume]);

  // Stop ambient music
  const stopAmbientMusic = useCallback(() => {
    if (!isAmbientPlayingRef.current) return;
    isAmbientPlayingRef.current = false;

    const ctx = getContext();
    if (ctx && ambientGainRef.current) {
      ambientGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    }

    // Clear the chime timeout
    if (ambientChimeIntervalRef.current) {
      clearTimeout(ambientChimeIntervalRef.current);
      ambientChimeIntervalRef.current = null;
    }

    setTimeout(() => {
      ambientOscillatorsRef.current.forEach(({ osc }) => {
        try { osc.stop(); } catch (e) {}
      });
      ambientOscillatorsRef.current = [];
    }, 1100);
  }, [getContext]);

  // Start swamp music - mysterious, eerie pond atmosphere
  const startSwampMusic = useCallback(() => {
    if (isSwampPlayingRef.current || !musicEnabled || isMuted || !initialized) return;

    const ctx = getContext();
    if (!ctx) return;

    isSwampPlayingRef.current = true;

    // Master gain
    swampGainRef.current = ctx.createGain();
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(1500, ctx.currentTime);
    swampGainRef.current.connect(masterFilter);
    masterFilter.connect(ctx.destination);
    swampGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
    swampGainRef.current.gain.linearRampToValueAtTime(volume * 0.08, ctx.currentTime + 2);

    // Deep drone - mysterious minor key (E minor)
    const droneNotes = [
      { freq: 82.41, type: 'sine', vol: 0.15 },    // E2 - root
      { freq: 123.47, type: 'sine', vol: 0.12 },   // B2 - fifth
      { freq: 164.81, type: 'triangle', vol: 0.08 }, // E3 - octave
      { freq: 196, type: 'sine', vol: 0.05 },      // G3 - minor third
    ];

    droneNotes.forEach((note, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const oscFilter = ctx.createBiquadFilter();
      osc.connect(oscFilter);
      oscFilter.connect(oscGain);
      oscGain.connect(swampGainRef.current);
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, ctx.currentTime);
      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(600 + i * 50, ctx.currentTime);
      oscGain.gain.setValueAtTime(note.vol, ctx.currentTime);
      osc.start(ctx.currentTime);
      swampOscillatorsRef.current.push({ osc, gain: oscGain });
    });

    // Slow LFO for breathing effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(swampGainRef.current.gain);
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
    lfoGain.gain.setValueAtTime(volume * 0.015, ctx.currentTime);
    lfo.start(ctx.currentTime);
    swampOscillatorsRef.current.push({ osc: lfo, gain: lfoGain });

    // Water drip sounds - occasional random
    const scheduleWaterDrip = () => {
      if (!isSwampPlayingRef.current) return;
      const interval = 2000 + Math.random() * 5000;
      const timeout = setTimeout(() => {
        if (!isSwampPlayingRef.current) return;

        // Drip sound
        const drip = ctx.createOscillator();
        const dripGain = ctx.createGain();
        drip.connect(dripGain);
        dripGain.connect(swampGainRef.current);
        drip.type = 'sine';
        const dripFreq = 800 + Math.random() * 400;
        drip.frequency.setValueAtTime(dripFreq, ctx.currentTime);
        drip.frequency.exponentialRampToValueAtTime(dripFreq * 0.6, ctx.currentTime + 0.1);
        dripGain.gain.setValueAtTime(0.08, ctx.currentTime);
        dripGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        drip.start(ctx.currentTime);
        drip.stop(ctx.currentTime + 0.15);

        scheduleWaterDrip();
      }, interval);
      swampIntervalsRef.current.push(timeout);
    };
    scheduleWaterDrip();

    // Occasional frog croaks in distance
    const scheduleFrogCroak = () => {
      if (!isSwampPlayingRef.current) return;
      const interval = 4000 + Math.random() * 8000;
      const timeout = setTimeout(() => {
        if (!isSwampPlayingRef.current) return;

        // Distant croak
        const croak1 = ctx.createOscillator();
        const croakGain = ctx.createGain();
        croak1.connect(croakGain);
        croakGain.connect(swampGainRef.current);
        croak1.type = 'square';
        const baseFreq = 120 + Math.random() * 60;
        croak1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        croak1.frequency.setValueAtTime(baseFreq * 1.2, ctx.currentTime + 0.05);
        croak1.frequency.setValueAtTime(baseFreq, ctx.currentTime + 0.08);
        croakGain.gain.setValueAtTime(0.03, ctx.currentTime);
        croakGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        croak1.start(ctx.currentTime);
        croak1.stop(ctx.currentTime + 0.12);

        scheduleFrogCroak();
      }, interval);
      swampIntervalsRef.current.push(timeout);
    };
    scheduleFrogCroak();

    // Eerie wind whoosh
    const scheduleWind = () => {
      if (!isSwampPlayingRef.current) return;
      const interval = 8000 + Math.random() * 12000;
      const timeout = setTimeout(() => {
        if (!isSwampPlayingRef.current) return;

        const wind = ctx.createOscillator();
        const windGain = ctx.createGain();
        const windFilter = ctx.createBiquadFilter();
        wind.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(swampGainRef.current);
        wind.type = 'sine';
        const windFreq = 150 + Math.random() * 100;
        wind.frequency.setValueAtTime(windFreq, ctx.currentTime);
        wind.frequency.linearRampToValueAtTime(windFreq * 1.5, ctx.currentTime + 1);
        wind.frequency.linearRampToValueAtTime(windFreq, ctx.currentTime + 2);
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(300, ctx.currentTime);
        windFilter.Q.setValueAtTime(5, ctx.currentTime);
        windGain.gain.setValueAtTime(0, ctx.currentTime);
        windGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
        windGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        wind.start(ctx.currentTime);
        wind.stop(ctx.currentTime + 2.1);

        scheduleWind();
      }, interval);
      swampIntervalsRef.current.push(timeout);
    };
    scheduleWind();

  }, [getContext, musicEnabled, isMuted, initialized, volume]);

  // Stop swamp music
  const stopSwampMusic = useCallback(() => {
    if (!isSwampPlayingRef.current) return;
    isSwampPlayingRef.current = false;

    const ctx = getContext();
    if (ctx && swampGainRef.current) {
      swampGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    }

    // Clear all intervals/timeouts
    swampIntervalsRef.current.forEach(id => clearTimeout(id));
    swampIntervalsRef.current = [];

    setTimeout(() => {
      swampOscillatorsRef.current.forEach(({ osc }) => {
        try { osc.stop(); } catch (e) {}
      });
      swampOscillatorsRef.current = [];
    }, 1100);
  }, [getContext]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopGearTick();
      stopAmbientMusic();
      stopSwampMusic();
    };
  }, [stopGearTick, stopAmbientMusic, stopSwampMusic]);

  return {
    isMuted,
    musicEnabled,
    sfxEnabled,
    volume,
    initialized,
    initAudio,
    playSound,
    playFootstep,
    startGearTick,
    stopGearTick,
    startAmbientMusic,
    stopAmbientMusic,
    startSwampMusic,
    stopSwampMusic,
    toggleMute,
    setMusicEnabled,
    setSfxEnabled,
    setVolume,
  };
}

export default useAudio;
