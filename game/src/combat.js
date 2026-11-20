// Combat: on-foot aiming + shooting (tracer, muzzle flash, enemy markers).
import { makeHumanoid, setPose } from './characters.js';

export class Combat {
  constructor(scene, effects) {
    this.scene = scene;
    this.effects = effects;
    this.enemies = []; // {mesh, marker, alive}
    this.aiming = false;
    this._markerGeo = new THREE.ConeGeometry(0.28, 0.6, 4);
    this._markerMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  }
  spawnEnemies(list) {
    const added = [];
    for (const s of list) {
      const m = makeHumanoid({ skin: s.skin ?? 0x8a5a3b, hair: 0x1a1a1a, hairStyle: 'cap', shirt: s.shirt ?? 0xd93c3c, pants: 0x222222 });
      m.position.set(s.x, 0, s.z);
      m.rotation.y = s.rot ?? 0;
      setPose(m, 'aim', 0);
      const marker = new THREE.Mesh(this._markerGeo, this._markerMat);
      marker.position.set(s.x, 2.15, s.z);
      marker.rotation.x = Math.PI;
      this.scene.add(m); this.scene.add(marker);
      const e = { mesh: m, marker, alive: true };
      this.enemies.push(e); added.push(e);
    }
    return added;
  }
  clearEnemies() {
    for (const e of this.enemies) { this.scene.remove(e.mesh); this.scene.remove(e.marker); }
    this.enemies = [];
  }
  shoot(from, dir, opts = {}) {
    const muzzlePos = from.clone().addScaledVector(dir, 0.8); muzzlePos.y = 1.35;
    this.effects.muzzle(muzzlePos, dir);
    // nearest enemy roughly along the aim dir
    let best = null, bd = 1e9;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const to = new THREE.Vector3().subVectors(e.mesh.position, from); to.y = 0;
      const d = to.length(); if (d < 1) continue;
      const dot = (to.x * dir.x + to.z * dir.z) / d;
      if (dot > 0.92 && d < bd) { bd = d; best = e; }
    }
    const end = best ? best.mesh.position.clone().setY(1.3) : from.clone().addScaledVector(dir, 26).setY(1.3);
    this.effects.tracer(muzzlePos, end);
    if (best && !opts.noKill) {
      best.alive = false;
      setPose(best.mesh, 'fallen', 0);
      best.mesh.position.y = 0.05;
      this.scene.remove(best.marker);
      return true;
    }
    return false;
  }
  update(t) {
    for (const e of this.enemies) if (e.alive) e.marker.position.y = 2.15 + Math.sin(t * 3) * 0.08;
  }
}
