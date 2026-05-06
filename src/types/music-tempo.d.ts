declare module "music-tempo" {
  export default class MusicTempo {
    constructor(buffer: Float32Array);
    tempo: number;
  }
}
