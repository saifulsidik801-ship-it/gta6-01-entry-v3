// Player: Milo Kade on foot + driving. Heading psi: forward = (sin psi, cos psi)
// in xz; the car model noses +x, so mesh.rotation.y = psi - PI/2.
import { makeHumanoid, setPose } from './characters.js';
import { CFG } from './config.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(CFG.playerStart.x, 0, CFG.playerStart.z);
    this.state = { facing: CFG.playerStart.facing, speed: 0 };
    this.mesh = makeHumanoid({ skin: 0xc98d5f, hair: 0x1c1c22, hairStyle: 'cap', shirt: 0xe86a2a, shirt2: 0xf2f2f2, pants: 0x1a2a4a, shoes: 0xffffff });
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
    this.car = null; // driving state {mesh, speed, name, cond, heading}
    this.health = 100; this.armour = 55;
    this._walkPhase = 0;
  }
  get driving() { return this.car; }
  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.mesh.position.copy(this.position);
    if (this.car) { this.car.mesh.position.set(x, 0, z); }
  }
  nearestCar(parked, radius = 3) {
    let best = null, bd = radius;
    for (const p of parked) {
      const d = Math.hypot(p.x - this.position.x, p.z - this.position.z);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  enterCar(p) {
    this.car = { mesh: p.mesh, speed: 0, name: p.name, cond: 100, top: 34, heading: Math.PI };
    p.mesh.rotation.y = this.car.heading - Math.PI / 2;
    this.mesh.visible = false;
    this.position.set(p.x, 0, p.z);
    return this.car;
  }
  exitCar() {
    if (!this.car) return;
    const m = this.car.mesh;
    this.position.set(m.position.x - 2.5, 0, m.position.z);
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
    this.car = null;
  }
  update(dt, input, camYaw) {
    if (this.car) {
      const c = this.car;
      const accel = input.forward ? 9 : input.back ? -7 : 0;
      c.speed += accel * dt;
      if (!input.forward && !input.back) c.speed *= Math.max(0, 1 - 1.6 * dt);
      c.speed = Math.max(-8, Math.min(c.top, c.speed));
      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      c.heading += steer * 1.5 * dt * Math.min(1, Math.abs(c.speed) / 8) * (c.speed < 0 ? -1 : 1);
      c.mesh.rotation.y = c.heading - Math.PI / 2;
      c.mesh.position.x += Math.sin(c.heading) * c.speed * dt;
      c.mesh.position.z += Math.cos(c.heading) * c.speed * dt;
      this.position.copy(c.mesh.position);
      this.state.speed = Math.abs(c.speed);
      const w = c.mesh.userData.wheels;
      if (w) { for (const wh of w) wh.rotation.z += c.speed * dt * 0.9; }
      return;
    }
    const run = input.run ? 5.2 : 3.1;
    let mx = 0, mz = 0;
    if (input.forward) { mx -= Math.sin(camYaw); mz -= Math.cos(camYaw); }
    if (input.back) { mx += Math.sin(camYaw); mz += Math.cos(camYaw); }
    if (input.left) { mx -= Math.cos(camYaw); mz += Math.sin(camYaw); }
    if (input.right) { mx += Math.cos(camYaw); mz -= Math.sin(camYaw); }
    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len; mz /= len;
      this.position.x += mx * run * dt;
      this.position.z += mz * run * dt;
      this.position.x = Math.max(-150, Math.min(150, this.position.x));
      this.position.z = Math.max(-150, Math.min(150, this.position.z));
      this.state.facing = Math.atan2(mx, mz);
      this.state.speed = run;
      this._walkPhase += dt * (input.run ? 11 : 6);
      setPose(this.mesh, input.run ? 'run' : 'walk', this._walkPhase);
    } else {
      this.state.speed = 0;
      setPose(this.mesh, input.aim ? 'aim' : 'idle', performance.now() / 1000);
    }
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.state.facing;
  }
}
