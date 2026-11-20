// Missions: 8 jobs, staged objectives, crew dialogue. J starts the next job.
import { MISSIONS, CREW } from './config.js';

export class Missions {
  constructor() {
    this.list = MISSIONS;
    this.index = 2; // current job: DOWNTOWN HEAT (the cover mission)
    this.active = null;
    this.stage = 3; this.stageMax = 4;
    this.timer = 149; // 2:29
    this.done = 2;
  }
  getCurrentObjective() {
    if (this.active) {
      return { kind: 'mission', title: this.active.title, displayTitle: this.active.displayTitle, chapter: this.active.chapter, obj: this.active.obj, next: this.active.next, speaker: this.active.speaker, line: this.active.line, stage: this.stage, stageMax: this.stageMax, timer: this.timer };
    }
    const m = this.list[this.index];
    return { kind: 'mission', title: m.title, displayTitle: m.displayTitle, chapter: m.chapter, obj: m.obj, next: m.next, speaker: m.speaker, line: m.line, stage: this.stage, stageMax: this.stageMax, timer: this.timer };
  }
  startNext() {
    this.active = this.list[this.index];
    this.stage = 1; this.stageMax = 4; this.timer = 179;
    return this.active;
  }
  advance() {
    if (this.stage < this.stageMax) { this.stage++; return true; }
    this.done++;
    this.index = (this.index + 1) % this.list.length;
    this.active = null; this.stage = 1;
    return false;
  }
  speakerData() {
    const o = this.getCurrentObjective();
    return CREW.find((c) => c.id === o.speaker) || CREW[0];
  }
  update(dt, driving) {
    if (this.active && this.timer > 0) this.timer -= dt;
  }
}
