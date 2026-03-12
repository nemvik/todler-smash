import type { SoundPresetId } from "@/types/app";
import { clamp, randomBetween } from "@/lib/utils";

interface PlaySoundOptions {
  volume: number;
  pan?: number;
}

export class AudioSynth {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private activeVoices = 0;
  private readonly maxVoices = 6;
  public unlocked = false;

  async unlock() {
    const context = this.getContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    this.unlocked = context.state === "running";
    return this.unlocked;
  }

  play(preset: SoundPresetId, options: PlaySoundOptions) {
    const context = this.getContext();

    if (!this.unlocked || this.activeVoices >= this.maxVoices) {
      return;
    }

    this.activeVoices += 1;

    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    const now = context.currentTime;
    const level = clamp(options.volume, 0, 1) * 0.26;

    gain.connect(filter);
    oscillator.connect(gain);
    filter.connect(this.master!);

    if (typeof StereoPannerNode !== "undefined") {
      const panNode = new StereoPannerNode(context, {
        pan: clamp(options.pan ?? 0, -1, 1),
      });
      filter.disconnect();
      filter.connect(panNode);
      panNode.connect(this.master!);
    }

    switch (preset) {
      case "bloop":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(randomBetween(310, 390), now);
        oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.18);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2200, now);
        shapeEnvelope(gain, now, level, 0.01, 0.18);
        oscillator.start(now);
        oscillator.stop(now + 0.22);
        break;
      case "chirp":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(randomBetween(420, 540), now);
        oscillator.frequency.linearRampToValueAtTime(720, now + 0.07);
        oscillator.frequency.linearRampToValueAtTime(490, now + 0.16);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1800, now);
        shapeEnvelope(gain, now, level * 0.88, 0.005, 0.16);
        oscillator.start(now);
        oscillator.stop(now + 0.19);
        break;
      case "bubble":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(randomBetween(240, 320), now);
        oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.24);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, now);
        shapeEnvelope(gain, now, level * 0.95, 0.01, 0.22);
        oscillator.start(now);
        oscillator.stop(now + 0.26);
        break;
      case "pluck":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(randomBetween(260, 340), now);
        oscillator.frequency.exponentialRampToValueAtTime(140, now + 0.12);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1600, now);
        shapeEnvelope(gain, now, level * 0.75, 0.002, 0.12);
        oscillator.start(now);
        oscillator.stop(now + 0.16);
        break;
      case "whoosh":
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(randomBetween(180, 260), now);
        oscillator.frequency.linearRampToValueAtTime(420, now + 0.26);
        filter.type = "highpass";
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(1200, now + 0.26);
        shapeEnvelope(gain, now, level * 0.65, 0.01, 0.28);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
      case "celebrate":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.linearRampToValueAtTime(620, now + 0.08);
        oscillator.frequency.linearRampToValueAtTime(740, now + 0.16);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2600, now);
        shapeEnvelope(gain, now, level * 0.9, 0.003, 0.22);
        oscillator.start(now);
        oscillator.stop(now + 0.24);
        this.playSecondaryTone(now + 0.07, level * 0.55);
        break;
    }

    oscillator.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      gain.disconnect();
      filter.disconnect();
    };
  }

  private playSecondaryTone(startTime: number, level: number) {
    if (!this.context || !this.master) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, startTime);
    oscillator.frequency.linearRampToValueAtTime(1170, startTime + 0.07);
    gain.connect(this.master);
    shapeEnvelope(gain, startTime, level, 0.003, 0.09);
    oscillator.connect(gain);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.12);
  }

  private getContext() {
    if (this.context && this.master) {
      return this.context;
    }

    this.context = new AudioContext({ latencyHint: "interactive" });
    this.master = this.context.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.context.destination);
    return this.context;
  }
}

function shapeEnvelope(
  gain: GainNode,
  now: number,
  level: number,
  attack: number,
  release: number,
) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(level, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + release);
}
