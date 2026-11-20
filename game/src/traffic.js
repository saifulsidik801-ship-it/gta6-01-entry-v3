// Traffic: cars looping the avenue/street grid + parked cars.
// Each traffic car: { mesh, axis ('x'|'z'), lane, pos, speed, dir }.
import { buildCar } from './vehicle.js';
import { mulberry32, pick } from './random.js';

const COLORS = [0x3b7ec9, 0xe8e8e8, 0xff5a7a, 0x7a5fb0, 0x2f9d4a, 0xf2b705, 0x8a8a8a, 0xc96a3b];
export class Traffic {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.parked = [];
    const rng = mulberry32(4242);
    const lanes = [-96, -64, -32, 0, 32, 64, 96];
    for (let i = 0; i < 14; i++) {
      const axis = rng() < 0.5 ? 'x' : 'z';
      const lane = pick(rng, lanes);
      const mesh = buildCar({ color: pick(rng, COLORS) });
      const speed = 6 + rng() * 7;
      const dir = rng() < 0.5 ? 1 : -1;
      const t = -140 + rng() * 280;
      mesh.position.set(axis === 'x' ? t : lane + (dir > 0 ? 2.6 : -2.6), 0, axis === 'x' ? lane + (dir > 0 ? 2.6 : -2.6) : t);
      mesh.rotation.y = axis === 'x' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
      // car model noses +x; rotation maps +x to (cos r, -sin r) in xz.
      scene.add(mesh);
      this.cars.push({ mesh, axis, lane, speed, dir, t });
    }
    // parked cars (incl. the red sport the playtest enters)
    const spots = [
      { x: 33, z: -42, color: 0xd21f2b, name: 'SOLARA GT', enter: true },
      { x: -30, z: 34, color: 0x3b7ec9, name: 'SEDAN' },
      { x: 66, z: -30, color: 0xf2b705, name: 'SUNLINE CAB', taxi: true },
      { x: -62, z: -66, color: 0xe8e8e8, name: 'SEDAN' },
      { x: 34, z: 66, color: 0x7a5fb0, name: 'HATCH' },
      { x: -34, z: -98, color: 0x2f9d4a, name: 'SEDAN' },
    ];
    for (const s of spots) {
      const mesh = buildCar({ color: s.color, taxi: !!s.taxi });
      mesh.position.set(s.x, 0, s.z);
      mesh.rotation.y = Math.PI / 2 + (s.x % 3) * 0.05;
      scene.add(mesh);
      this.parked.push({ mesh, x: s.x, z: s.z, name: s.name, enter: !!s.enter, color: s.color });
    }
  }
  update(dt) {
    for (const c of this.cars) {
      c.t += c.speed * c.dir * dt;
      if (c.t > 150) c.t = -150; if (c.t < -150) c.t = 150;
      if (c.axis === 'x') { c.mesh.position.x = c.t; }
      else { c.mesh.position.z = c.t; }
      // wheels spin
      const w = c.mesh.userData.wheels;
      if (w) for (const wh of w) wh.rotation.z += c.speed * dt * 0.8;
    }
  }
  // Place extra staged cars for a screenshot: [{x,z,rot,color,police,taxi}]
  stage(list) {
    const added = [];
    for (const s of list) {
      const mesh = buildCar({ color: s.color ?? 0xe8e8e8, police: !!s.police, taxi: !!s.taxi });
      mesh.position.set(s.x, 0, s.z);
      mesh.rotation.y = s.rot ?? 0;
      this.scene.add(mesh);
      added.push(mesh);
    }
    return added;
  }
}
