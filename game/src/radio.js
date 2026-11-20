// Radio: fictional stations, track rotation, play/pause, volume/mute.
// Audio itself lives in audio.js; this is state + HUD data.
import { STATIONS } from './stations.js';

export class Radio {
  constructor({ onTrackChange = null, onStationChange = null } = {}) {
    this.stations = STATIONS;
    this.stationIndex = 0;
    this.trackIndex = 0;
    this.playing = false;
    this.volume = 0.5;
    this.muted = false;
    this.elapsed = 0;
    this.onTrackChange = onTrackChange;
    this.onStationChange = onStationChange;
  }
  get station() { return this.stations[this.stationIndex]; }
  get track() { return this.station.tracks[this.trackIndex]; }
  get stationId() { return this.station.id; }
  nowPlaying() {
    const t = this.track;
    return {
      stationId: this.station.id, station: this.station.name, freq: this.station.freq,
      genre: this.station.genre, color: this.station.color, title: t.title, artist: t.artist,
      durSec: t.durSec, elapsedSec: Math.floor(this.elapsed),
      progress: Math.min(1, this.elapsed / t.durSec), playing: this.playing, muted: this.muted, volume: this.volume,
    };
  }
  play() { this.playing = true; return true; }
  pause() { this.playing = false; }
  toggle() { this.playing = !this.playing; return this.playing; }
  nextStation(dir = 1) {
    this.stationIndex = (this.stationIndex + dir + this.stations.length) % this.stations.length;
    this.trackIndex = 0; this.elapsed = 0;
    if (this.onStationChange) this.onStationChange(this.station);
    if (this.onTrackChange) this.onTrackChange(this.track);
  }
  nextTrack() {
    this.trackIndex = (this.trackIndex + 1) % this.station.tracks.length;
    this.elapsed = 0;
    if (this.onTrackChange) this.onTrackChange(this.track);
  }
  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }
  setMuted(m) { this.muted = !!m; }
  update(dt) {
    if (!this.playing) return;
    this.elapsed += dt;
    if (this.elapsed >= this.track.durSec) this.nextTrack();
  }
}
