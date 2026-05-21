import type { SoundTheme } from "../types/settings";

type AppSoundKind = "notification" | "success" | "error" | "timer" | "palette" | "button" | "reminder";

interface SoundSettings {
  soundsEnabled?: boolean;
  soundTheme?: SoundTheme;
  soundVolume?: number;
}

function readSettings(): SoundSettings {
  try {
    return JSON.parse(window.localStorage.getItem("quality-life:settings") ?? "{}") as SoundSettings;
  } catch {
    return {};
  }
}

export function playAppSound(kind: AppSoundKind) {
  const settings = readSettings();
  if (!settings.soundsEnabled || settings.soundTheme === "silent") {
    return;
  }

  const volume = volumeScale(settings.soundVolume ?? 42);
  if (volume === 0) {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const now = context.currentTime;
  const theme = settings.soundTheme ?? "soft";
  const plan = soundPlan(theme, kind);

  plan.forEach((step, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = step.waveform;
    oscillator.frequency.setValueAtTime(step.frequency, now + step.delay);
    gain.gain.setValueAtTime(0.0001, now + step.delay);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, step.volume * volume), now + step.delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + step.delay + step.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + step.delay);
    oscillator.stop(now + step.delay + step.duration + 0.04);
    window.setTimeout(() => {
      oscillator.disconnect();
      gain.disconnect();
    }, (step.delay + step.duration + 0.1) * 1000);
    if (index === plan.length - 1) {
      window.setTimeout(() => void context.close(), (step.delay + step.duration + 0.15) * 1000);
    }
  });
}

export function previewSoundTheme(theme: SoundTheme, volumePercent = 42) {
  if (theme === "silent") {
    return;
  }
  const volume = volumeScale(volumePercent);
  const steps =
    theme === "nature"
      ? [
          { frequency: 392, volume: 0.03 * volume, duration: 0.09, delay: 0, waveform: "sine" as const },
          { frequency: 523, volume: 0.025 * volume, duration: 0.14, delay: 0.12, waveform: "triangle" as const }
        ]
      : theme === "minimal"
        ? [{ frequency: 480, volume: 0.02 * volume, duration: 0.07, delay: 0, waveform: "sine" as const }]
        : [
            { frequency: 440, volume: 0.03 * volume, duration: 0.09, delay: 0, waveform: "sine" as const },
            { frequency: 660, volume: 0.022 * volume, duration: 0.11, delay: 0.1, waveform: "triangle" as const }
          ];

  playSequence(steps);
}

function playSequence(
  steps: Array<{ frequency: number; volume: number; duration: number; delay: number; waveform: OscillatorType }>
) {
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }
  const context = new AudioContextCtor();
  const now = context.currentTime;
  steps.forEach((step, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = step.waveform;
    oscillator.frequency.setValueAtTime(step.frequency, now + step.delay);
    gain.gain.setValueAtTime(0.0001, now + step.delay);
    gain.gain.exponentialRampToValueAtTime(step.volume, now + step.delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + step.delay + step.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + step.delay);
    oscillator.stop(now + step.delay + step.duration + 0.04);
    window.setTimeout(() => {
      oscillator.disconnect();
      gain.disconnect();
    }, (step.delay + step.duration + 0.1) * 1000);
    if (index === steps.length - 1) {
      window.setTimeout(() => void context.close(), (step.delay + step.duration + 0.15) * 1000);
    }
  });
}

function soundPlan(theme: SoundTheme, kind: AppSoundKind) {
  const accent = kind === "error" ? 220 : kind === "timer" ? 528 : kind === "reminder" ? 494 : 440;
  const lift = kind === "success" ? 1.22 : kind === "notification" ? 1.12 : kind === "palette" ? 1.06 : 1;
  const volume = theme === "minimal" ? 0.018 : theme === "nature" ? 0.024 : 0.022;

  if (kind === "error") {
    return [
      { frequency: 220, volume: 0.024, duration: 0.09, delay: 0, waveform: "sine" as const },
      { frequency: 185, volume: 0.018, duration: 0.12, delay: 0.11, waveform: "triangle" as const }
    ];
  }

  if (kind === "timer") {
    return [
      { frequency: accent, volume, duration: 0.11, delay: 0, waveform: "sine" as const },
      { frequency: accent * lift, volume: volume * 0.9, duration: 0.12, delay: 0.14, waveform: "triangle" as const }
    ];
  }

  return [{ frequency: accent * lift, volume, duration: kind === "button" ? 0.05 : 0.1, delay: 0, waveform: "sine" as const }];
}

function volumeScale(percent: number) {
  const normalized = Math.max(0, Math.min(100, percent)) / 100;
  return normalized === 0 ? 0 : Math.pow(normalized, 0.85);
}
