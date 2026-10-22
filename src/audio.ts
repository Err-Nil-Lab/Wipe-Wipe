// Suara placeholder yang dibuat langsung dengan Web Audio API (oscillator + noise), tanpa file audio.
// Fungsi build* menerima konteks apa saja supaya bisa dites lewat OfflineAudioContext;
// fungsi play*/start* dipakai game dan hanya bunyi setelah pemain pernah klik (aturan autoplay browser).
import { config } from "./config";

const cfg = config.audio;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let stopCurrentHum: (() => void) | null = null;

// Panggil dari klik pertama pemain.
export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = cfg.masterGain;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function noise(c: BaseAudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = c.createBufferSource();
  source.buffer = buffer;
  return source;
}

// Naik cepat, bertahan di puncak (hold), lalu turun perlahan sampai hampir nol.
function envelope(c: BaseAudioContext, out: AudioNode, t: number, peak: number, attack: number, decay: number, hold = 0): GainNode {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.setValueAtTime(peak, t + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + decay);
  gain.connect(out);
  return gain;
}

// Satu dentuman rendah: nada yang turun cepat + sedikit noise tumpul.
function thud(c: BaseAudioContext, out: AudioNode, t: number) {
  const tone = c.createOscillator();
  tone.frequency.setValueAtTime(140, t);
  tone.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  tone.connect(envelope(c, out, t, cfg.knockGain, 0.005, 0.2));
  tone.start(t);
  tone.stop(t + 0.3);

  const body = noise(c, 0.1);
  const lowpass = c.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 400;
  body.connect(lowpass);
  lowpass.connect(envelope(c, out, t, cfg.knockGain * 0.6, 0.003, 0.06));
  body.start(t);
}

// Ketukan: dua dentuman berdekatan.
export function buildKnock(c: BaseAudioContext, out: AudioNode, t: number) {
  thud(c, out, t);
  thud(c, out, t + 0.18);
}

// Dengung rendah dua nada yang sedikit beda (terdengar berdenyut) dengan volume naik-turun pelan.
// Mengembalikan fungsi untuk menghentikannya.
export function buildHum(c: BaseAudioContext, out: AudioNode, t: number): () => void {
  const level = c.createGain();
  level.gain.value = cfg.humGain;
  level.connect(out);

  const swell = c.createGain(); // volume yang naik-turun
  swell.gain.value = 0.75;
  swell.connect(level);

  const sources: OscillatorNode[] = [];
  for (const freq of [50, 53]) {
    const osc = c.createOscillator();
    osc.frequency.value = freq;
    osc.connect(swell);
    osc.start(t);
    sources.push(osc);
  }

  const lfo = c.createOscillator(); // 0,15 Hz = satu denyut tiap ~7 dtk
  lfo.frequency.value = 0.15;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 0.25;
  lfo.connect(lfoDepth);
  lfoDepth.connect(swell.gain);
  lfo.start(t);
  sources.push(lfo);

  return () => {
    const end = c.currentTime;
    level.gain.setValueAtTime(level.gain.value, end);
    level.gain.linearRampToValueAtTime(0, end + 0.3);
    for (const s of sources) s.stop(end + 0.35);
  };
}

// Jumpscare: ledakan noise + dua nada gergaji yang naik tajam.
export function buildJumpscare(c: BaseAudioContext, out: AudioNode, t: number) {
  const blast = noise(c, 1.5);
  blast.connect(envelope(c, out, t, cfg.jumpscareGain, 0.01, 0.9, 0.3)); // tahan di puncak supaya terasa keras, bukan sekadar letupan
  blast.start(t);

  const lowpass = c.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3000;
  lowpass.connect(envelope(c, out, t, cfg.jumpscareGain * 0.5, 0.02, 0.9, 0.4));
  for (const detune of [0, 17]) {
    const scream = c.createOscillator();
    scream.type = "sawtooth";
    scream.detune.value = detune;
    scream.frequency.setValueAtTime(180, t);
    scream.frequency.exponentialRampToValueAtTime(900, t + 0.4);
    scream.connect(lowpass);
    scream.start(t);
    scream.stop(t + 1.5);
  }
}

export function playKnock() {
  if (ctx && master) buildKnock(ctx, master, ctx.currentTime);
}

export function playJumpscare() {
  if (ctx && master) buildJumpscare(ctx, master, ctx.currentTime);
}

export function startHum() {
  if (!ctx || !master || stopCurrentHum) return;
  stopCurrentHum = buildHum(ctx, master, ctx.currentTime);
}

export function stopHum() {
  stopCurrentHum?.();
  stopCurrentHum = null;
}
