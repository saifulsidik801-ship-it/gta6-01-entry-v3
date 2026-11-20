// Police: wanted 0-5, cruisers that chase, foot cops, panel data.
// Tactic tags: PURSUIT / RAMMING / FLANKING / SPOTLIGHT / FIRING / ROADBLOCK / SEARCHING.
import { buildCar } from './vehicle.js';
import { makeHumanoid, setPose } from './characters.js';
import { mulberry32 } from './random.js';

const UNIT_NAMES = ['KITE-1', 'MARLIN-3', 'CORAL-48', 'CORAL-85', 'PIER-5', 'TIDE-2', 'TIDE-6', 'GULL-8', 'BASTION-3'];
const TACTICS = ['PURSUIT', 'RAMMING', 'FLANKING', 'FIRING', 'ROADBLOCK', 'SEARCHING', 'CLOSING'];

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.wanted = 0;
    this.cruisers = []; // {mesh, speed}
    this.cops = [];
    this._rng = mulberry32(7);
    this._flash = 0;
  }
  setWanted(n) {
    this.wanted = Math.max(0, Math.min(5, n));
    const wantCruisers = this.wanted === 0 ? 0 : this.wanted === 1 ? 1 : this.wanted === 2 ? 2 : this.wanted === 3 ? 3 : this.wanted === 4 ? 4 : 5;
    while (this.cruisers.length < wantCruisers) this._spawnCruiser();
    while (this.cruisers.length > wantCruisers) {
      const c = this.cruisers.pop();
      this.scene.remove(c.mesh);
    }
    const wantCops = this.wanted >= 2 ? 2 : 0;
    while (this.cops.length < wantCops) this._spawnCop();
    while (this.cops.length > wantCops) { const c = this.cops.pop(); this.scene.remove(c.mesh); }
  }
  _spawnCruiser() {
    const mesh = buildCar({ police: true });
    const a = this._rng() * Math.PI * 2;
    mesh.position.set(Math.cos(a) * 60, 0, Math.sin(a) * 60);
    this.scene.add(mesh);
    this.cruisers.push({ mesh, speed: 14 + this._rng() * 4 });
  }
  _spawnCop() {
    const mesh = makeHumanoid({ skin: 0x8a5a3b, hair: 0x1a1a1a, hairStyle: 'cap', shirt: 0x1a2a55, pants: 0x141c33 });
    mesh.position.set(20 + this._rng() * 10, 0, -30 + this._rng() * 10);
    this.scene.add(mesh);
    this.cops.push({ mesh, phase: this._rng() * 10 });
  }
  // Panel rows: heli first (if active), then nearest cruisers, then foot cops.
  panelData(playerPos, heli) {
    const rows = [];
    if (heli && heli.visible) rows.push({ name: 'HELI 1', dist: Math.round(heli.distance || 26), tag: 'SPOTLIGHT' });
    const sorted = [...this.cruisers].sort((a, b) =>
      a.mesh.position.distanceTo(playerPos) - b.mesh.position.distanceTo(playerPos));
    sorted.forEach((c, i) => {
      rows.push({ name: UNIT_NAMES[i % UNIT_NAMES.length], dist: Math.round(c.mesh.position.distanceTo(playerPos)), tag: TACTICS[(i + 1) % TACTICS.length] });
    });
    this.cops.forEach((c, i) => {
      rows.push({ name: 'FOOT \u00d7' + (i + 1), dist: Math.round(c.mesh.position.distanceTo(playerPos)), tag: 'PURSUIT' });
    });
    return rows;
  }
  update(dt, t, playerPos, playerSpeed) {
    this._flash += dt;
    for (const c of this.cruisers) {
      // chase: steer toward the player, capped speed
      const dx = playerPos.x - c.mesh.position.x, dz = playerPos.z - c.mesh.position.z;
      const d = Math.hypot(dx, dz) || 1;
      if (d > 9) {
        const targetHeading = Math.atan2(dx, dz);
        let dh = targetHeading - (c.heading ?? 0);
        while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
        c.heading = (c.heading ?? 0) + Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
        c.mesh.rotation.y = c.heading - Math.PI / 2;
        c.mesh.position.x += Math.sin(c.heading) * c.speed * dt;
        c.mesh.position.z += Math.cos(c.heading) * c.speed * dt;
      }
      const u = c.mesh.userData;
      if (u.lightBar) {
        const on = Math.sin(this._flash * 10) > 0;
        u.lightBar.children[0].material.emissiveIntensity = on ? 3 : 0.3;
        u.lightBar.children[1].material.emissiveIntensity = on ? 0.3 : 3;
      }
      if (u.poolRed && u.poolBlue) {
        const on = Math.sin(this._flash * 10) > 0;
        u.poolRed.material.opacity = on ? 0.26 : 0.05;
        u.poolBlue.material.opacity = on ? 0.05 : 0.26;
      }
      if (u.wheels) for (const w of u.wheels) w.rotation.z += c.speed * dt * 0.8;
    }
    for (const c of this.cops) {
      const dx = playerPos.x - c.mesh.position.x, dz = playerPos.z - c.mesh.position.z;
      const d = Math.hypot(dx, dz) || 1;
      if (d > 4) {
        c.mesh.position.x += (dx / d) * 3.4 * dt;
        c.mesh.position.z += (dz / d) * 3.4 * dt;
        c.mesh.rotation.y = Math.atan2(dx, dz);
        setPose(c.mesh, 'run', t + c.phase);
      } else setPose(c.mesh, 'aim', t);
    }
  }
}
