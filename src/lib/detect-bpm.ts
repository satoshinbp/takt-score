"use client";

import MusicTempo from "music-tempo";

export const detectBpm = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const channelData = audioBuffer.getChannelData(0);
  const mt = new MusicTempo(channelData);
  return Math.round(mt.tempo);
};
