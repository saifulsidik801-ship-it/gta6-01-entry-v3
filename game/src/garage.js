// Hillside Garage: real workshop interior (wood walls, containers, tool rack,
// tire stack, workbench, neon, lift posts, hazard turntable) + the hero car.
import { buildCar } from './vehicle.js';
import { makeHumanoid, setPose } from './characters.js';

export class Garage {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group(); this.group.name = 'garage'; this.group.visible = false;
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.95 });
    const woodDark = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.95 });
    const concrete = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 1 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.6, roughness: 0.4 });
    const red = new THREE.MeshStandardMaterial({ color: 0x8c2f26, roughness: 0.8 });
    // floor + oil stains + yellow parking lines
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), concrete);
    floor.rotation.x = -Math.PI / 2; this.group.add(floor);
    for (const [x, z] of [[-3, 2], [2, -2], [0, 4]]) {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), new THREE.MeshBasicMaterial({ color: 0x141416, transparent: true, opacity: 0.55 }));
      stain.rotation.x = -Math.PI / 2; stain.position.set(x, 0.02, z); this.group.add(stain);
    }
    for (const z of [-2.5, 2.5]) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.25), new THREE.MeshStandardMaterial({ color: 0xe8b93c }));
      line.rotation.x = -Math.PI / 2; line.position.set(-2, 0.02, z); this.group.add(line);
    }
    // back wall (wood planks) + side walls
    const back = new THREE.Mesh(new THREE.BoxGeometry(30, 7, 0.5), wood);
    back.position.set(0, 3.5, -9); this.group.add(back);
    for (let i = 0; i < 8; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7, 0.55), woodDark);
      plank.position.set(-13 + i * 3.7, 3.5, -9); this.group.add(plank);
    }
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 20), woodDark);
    sideL.position.set(-14, 3.5, 0); this.group.add(sideL);
    const sideR = sideL.clone(); sideR.position.x = 14; this.group.add(sideR);
    // containers (left back)
    const contCols = [0x2f6a8a, 0x8a3a2a, 0x3a7a4a];
    contCols.forEach((c, i) => {
      const cont = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 2.4), new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
      cont.position.set(-11 + i * 0.2, 1.3, -7.2 - i * 0.4); this.group.add(cont);
    });
    // tool rack + workbench (right back)
    const rack = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 0.4), red);
    rack.position.set(10, 1.2, -8.6); this.group.add(rack);
    for (let i = 0; i < 5; i++) {
      const tool = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.1), steel);
      tool.position.set(8.6 + i * 0.7, 1.6, -8.35); this.group.add(tool);
    }
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 1.2), woodDark);
    bench.position.set(10, 0.45, -6.5); this.group.add(bench);
    // tire stack (left)
    const tyre = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1 });
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 12), tyre);
      t.position.set(-12.5, 0.15 + i * 0.32, -3); this.group.add(t);
    }
    // oil cans + hose (right edge)
    for (let i = 0; i < 3; i++) {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe8b93c : 0x35d0d8 }));
      can.position.set(12.5, 0.3, -2 + i * 0.8); this.group.add(can);
    }
    // neon strips (cyan back wall + orange sign)
    const neonC = new THREE.Mesh(new THREE.BoxGeometry(10, 0.18, 0.18), new THREE.MeshStandardMaterial({ color: 0x35d0d8, emissive: 0x35d0d8, emissiveIntensity: 2.2 }));
    neonC.position.set(0, 5.6, -8.7); this.group.add(neonC);
    const neonO = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 0.18), new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff7a1a, emissiveIntensity: 1.8 }));
    neonO.position.set(-8, 5.6, -8.7); this.group.add(neonO);
    // hanging lamps
    for (const x of [-4, 3]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      cord.position.set(x, 6.4, -1); this.group.add(cord);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffd98a, emissiveIntensity: 2 }));
      lamp.position.set(x, 5.7, -1); this.group.add(lamp);
      const glow = new THREE.PointLight(0xffd98a, 60, 18, 1.6);
      glow.position.set(x, 5.4, -1); this.group.add(glow);
    }
    // turntable: hazard ring
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.1, 32), new THREE.MeshStandardMaterial({ color: 0xe8b93c, emissive: 0xe8b93c, emissiveIntensity: 0.25 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(-2, 0.03, 0); this.group.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.7, metalness: 0.4 }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(-2, 0.025, 0); this.group.add(disc);
    // lift posts (yellow)
    const liftMat = new THREE.MeshStandardMaterial({ color: 0xe8b93c, roughness: 0.6 });
    for (const [x, z] of [[-4.9, -2.2], [-4.9, 2.2], [-0.1, -2.2], [-0.1, 2.2]]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 0.35), liftMat);
      post.position.set(x, 0.9, z); this.group.add(post);
    }
    // hero car on the turntable, headlights on, lifted slightly
    this.car = buildCar({ color: 0xe8362a });
    this.car.position.set(-2.5, 0.5, 0);
    this.car.rotation.y = -0.35; // nose to the right, 3/4 view from the camera
    this.group.add(this.car);
    // mechanic beside the car
    const mech = makeHumanoid({ skin: 0x8a5a3b, hair: 0x2a2a2a, hairStyle: 'cap', shirt: 0x3a6a8a, pants: 0x2a2a2a });
    mech.position.set(1.6, 0, 1.8); mech.rotation.y = -2.2;
    setPose(mech, 'idle', 0);
    this.group.add(mech);
    // warm key light + cool fill
    const key = new THREE.PointLight(0xffd9a0, 180, 22, 1.5);
    key.position.set(-2, 5.5, 3); this.group.add(key);
    const fill = new THREE.PointLight(0x35d0d8, 70, 18, 1.6);
    fill.position.set(4, 4, -6); this.group.add(fill);
    scene.add(this.group);
  }
  show(v) { this.group.visible = v; }
}
