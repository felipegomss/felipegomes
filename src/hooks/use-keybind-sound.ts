"use client";

let audioContext: AudioContext | null = null;

export function playKeybindSound() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const ctx = audioContext;
  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.015;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };

  source.start(now);
}
