// Procedural audio: synth radio music (no audio files) + heli rotor thump.
// Everything guarded — audio must never throw.
export class AudioEngine {
  constructor(radio) {
    this.radio = radio;
    this.ctx = null;
    this.musicGain = null;
    this.rotorGain = null;
    this._step = 0;
    this._nextNote = 0;
    this._unlocked = false;
  }
  unlock() {
    if (this._unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.ctx.destination);
      // rotor: low thump loop (oscillator + LFO on gain)
      const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 22;
      this.rotorGain = this.ctx.createGain(); this.rotorGain.gain.value = 0;
      const lfo = this.ctx.createOscillator(); lfo.frequency.value = 11;
      const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain); lfoGain.connect(this.rotorGain.gain);
      osc.connect(this.rotorGain); this.rotorGain.connect(this.ctx.destination);
      osc.start(); lfo.start();
      this._unlocked = true;
    } catch (e) { /* audio unavailable — game continues silent */ }
  }
  // One short synth note per call; main loop schedules by bpm.
  _note(freq, dur, type = 'triangle', vol = 0.2) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.musicGain);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch (e) { /* ignore */ }
  }
  update(dt, heliDistance) {
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      // rotor volume by distance
      if (this.rotorGain) {
        const d = heliDistance == null ? 999 : heliDistance;
        const v = d > 150 ? 0 : (1 - d / 150) * 0.5;
        this.rotorGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
      }
      // music: simple arpeggio on the station's scale when playing
      if (this.radio.playing && !this.radio.muted) {
        this.musicGain.gain.setTargetAtTime(0.16 * this.radio.volume * 2, this.ctx.currentTime, 0.1);
        this._nextNote -= dt;
        if (this._nextNote <= 0) {
          const bpm = this.radio.station.bpm || 100;
          this._nextNote = 60 / bpm / 2;
          const scales = { bay985: [262, 330, 392, 494], vice1073: [220, 262, 330, 415], onda911: [196, 247, 294, 370], talk1047: [0] };
          const sc = scales[this.radio.stationId] || scales.bay985;
          const f = sc[this._step % sc.length];
          if (f) this._note(f, 0.22, this.radio.stationId === 'vice1073' ? 'sawtooth' : 'triangle', 0.12);
          this._step++;
        }
      } else if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
    } catch (e) { /* ignore */ }
  }
}
