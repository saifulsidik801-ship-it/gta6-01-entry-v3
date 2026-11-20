// Police helicopter: white body (reads in dusk), navy belly, glass cabin,
// big main rotor + translucent blur disc, spotlight cone + ground pool.
// State machine: hidden -> arriving -> orbiting <-> hover -> leaving -> hidden.
import { CFG } from './config.js';

export class PoliceHeli {
  constructor(scene) {
    this.scene = scene;
    this.state = 'hidden';
    this.visible = false;
    this.angle = Math.PI / 2;
    this.leaveTimer = 0;
    this._tmp = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._spotTarget = new THREE.Vector3();
    this.group = new THREE.Group(); this.group.name = 'heli'; this.group.visible = false;
    const white = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.4, metalness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.3 });
    const navy = new THREE.MeshStandardMaterial({ color: 0x1a2a55, roughness: 0.5, metalness: 0.3 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x0e2233, roughness: 0.15, metalness: 0.7 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 });
    // fuselage: rounded box + nose wedge
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.35, 1.5), white); body.position.y = 0; this.group.add(body);
    const belly = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 1.52), navy); belly.position.y = -0.62; this.group.add(belly);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.1, 4), white);
    nose.rotation.z = -Math.PI / 2; nose.rotation.y = Math.PI / 4; nose.position.set(2.1, -0.05, 0); this.group.add(nose);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 1.35), glass); cab.position.set(1.0, 0.32, 0); this.group.add(cab);
    // tail boom + fin + tail rotor
    const boom = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.32, 0.32), white); boom.position.set(-3.2, 0.25, 0); this.group.add(boom);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.12), navy); fin.position.set(-4.8, 0.7, 0); this.group.add(fin);
    this.tailRotor = new THREE.Group(); this.tailRotor.position.set(-4.9, 0.3, 0.25);
    const tr1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.08), dark); this.tailRotor.add(tr1);
    const tr2 = tr1.clone(); tr2.rotation.x = Math.PI / 2; this.tailRotor.add(tr2);
    this.group.add(this.tailRotor);
    // mast + main rotor (2 blades + blur disc)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.6, 8), dark); mast.position.y = 0.95; this.group.add(mast);
    this.rotor = new THREE.Group(); this.rotor.position.y = 1.3;
    const bladeGeo = new THREE.BoxGeometry(8.6, 0.07, 0.42);
    const blade = new THREE.Mesh(bladeGeo, dark); this.rotor.add(blade);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 8.6), dark); this.rotor.add(blade2);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(4.4, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; this.rotor.add(disc);
    this.group.add(this.rotor);
    // skids
    for (const z of [-0.65, 0.65]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.09, 0.09), dark);
      skid.position.set(0.2, -1.05, z); this.group.add(skid);
      for (const x of [-0.9, 1.1]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), dark);
        strut.position.set(x, -0.85, z); this.group.add(strut);
      }
    }
    // strobes (emissive, blink)
    this.strobeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 3 }));
    this.strobeR.position.set(-1.2, -0.85, 0); this.group.add(this.strobeR);
    this.strobeB = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2266ff, emissive: 0x2266ff, emissiveIntensity: 3 }));
    this.strobeB.position.set(-4.9, 1.35, 0); this.group.add(this.strobeB);
    // spotlight cone (additive) + ground pool
    const coneGeo = new THREE.ConeGeometry(6.5, 1, 20, 1, true);
    coneGeo.translate(0, -0.5, 0);
    this.cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.scene.add(this.cone);
    this.pool = new THREE.Mesh(new THREE.CircleGeometry(5.5, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.pool.rotation.x = -Math.PI / 2; this.pool.position.y = 0.08;
    this.scene.add(this.pool);
    this.light = new THREE.SpotLight(0xfff6c0, 900, 90, 0.32, 0.45, 1.2);
    this.light.position.set(0, 20, 0); this.scene.add(this.light); this.scene.add(this.light.target);
    this.group.scale.set(2.0, 2.6, 2.0); // tall body reads big; rotor radius stays in frame
    this.scene.add(this.group);
    this.setVisible(false);
  }
  setVisible(v) {
    this.visible = v; this.group.visible = v;
    this.cone.visible = v; this.pool.visible = v; this.light.visible = v;
  }
  spawn(playerPos) {
    this.group.position.set(playerPos.x + 90, 60, playerPos.z + 40);
    this._spotTarget.copy(playerPos);
    this.state = 'arriving'; this.setVisible(true);
  }
  despawn() { if (this.state === 'orbiting' || this.state === 'arriving' || this.state === 'hover') this.state = 'leaving'; }
  // Pin the heli for a staged shot: fixed height/radius/angle above the player.
  pin(playerPos, height, radius, angle) {
    this.state = 'orbiting'; this.setVisible(true);
    this.group.position.set(playerPos.x + Math.cos(angle) * radius, height, playerPos.z + Math.sin(angle) * radius);
    this._spotTarget.copy(playerPos);
    this._placeSpot(playerPos);
    this.group.lookAt(playerPos.x, height, playerPos.z);
  }
  _placeSpot(playerPos) {
    const hp = this.group.position;
    const dx = playerPos.x - hp.x, dy = 0 - hp.y, dz = playerPos.z - hp.z;
    const len = Math.hypot(dx, dy, dz);
    this.cone.position.set(hp.x, hp.y - 0.8, hp.z);
    this.cone.scale.set(1, len, 1);
    this.cone.lookAt(playerPos.x, 0, playerPos.z);
    this.cone.rotateX(-Math.PI / 2);
    this.pool.position.set(playerPos.x, 0.08, playerPos.z);
    this.light.position.copy(hp);
    this.light.target.position.set(playerPos.x, 0, playerPos.z);
  }
  update(dt, playerPos, playerSpeed, wanted) {
    const C = CFG.heli;
    if (this.state === 'hidden') {
      if (wanted >= C.triggerWanted) this.spawn(playerPos);
      else return;
    }
    this.rotor.rotation.y += C.rotorSpeed * dt;
    this.tailRotor.rotation.x += C.rotorSpeed * 1.4 * dt;
    const blink = Math.sin(performance.now() * 0.012) > 0;
    this.strobeR.material.emissiveIntensity = blink ? 3.5 : 0.4;
    this.strobeB.material.emissiveIntensity = blink ? 0.4 : 3.5;
    if (wanted < C.triggerWanted && this.state !== 'leaving') {
      this.leaveTimer += dt;
      if (this.leaveTimer > C.leaveDelaySec) this.despawn();
    } else if (wanted >= C.triggerWanted) this.leaveTimer = 0;
    if (this.state === 'arriving') {
      this.angle += C.orbitSpeed * dt;
      this._tmp.set(playerPos.x + Math.cos(this.angle) * C.orbitRadius, C.orbitHeight, playerPos.z + Math.sin(this.angle) * C.orbitRadius);
      this.group.position.lerp(this._tmp, Math.min(1, dt * 2.5));
      if (this.group.position.distanceTo(this._tmp) < 3) this.state = 'orbiting';
    } else if (this.state === 'orbiting' || this.state === 'hover') {
      if (playerSpeed < 2 && this.state === 'orbiting') this.state = 'hover';
      if (playerSpeed >= 2 && this.state === 'hover') this.state = 'orbiting';
      const radius = this.state === 'hover' ? 20 : C.orbitRadius;
      const speed = this.state === 'hover' ? 0.15 : C.orbitSpeed;
      this.angle += speed * dt;
      const h = C.orbitHeight + Math.sin(performance.now() * 0.002) * 1.2 - (this.state === 'hover' ? 4 : 0);
      this._tmp.set(playerPos.x + Math.cos(this.angle) * radius, h, playerPos.z + Math.sin(this.angle) * radius);
      this.group.position.lerp(this._tmp, Math.min(1, dt * 2.5));
      // bank into the turn
      this.group.rotation.z = 0;
      this.group.lookAt(this._tmp.x - Math.sin(this.angle), h, this._tmp.z + Math.cos(this.angle));
      this.group.rotateZ(C.bankAngle * 0.5);
    } else if (this.state === 'leaving') {
      this.group.position.y += dt * 14;
      this.group.position.x += dt * 18;
      if (this.group.position.y > 90) { this.state = 'hidden'; this.setVisible(false); }
    }
    // spotlight follows the player with a small lag + lead
    this._target.set(playerPos.x, 0, playerPos.z);
    this._spotTarget.lerp(this._target, Math.min(1, dt * 4));
    this._placeSpot(this._spotTarget);
    this.distance = this.group.position.distanceTo(playerPos);
  }
  dispose() { /* scene-owned; nothing to free per frame */ }
}
