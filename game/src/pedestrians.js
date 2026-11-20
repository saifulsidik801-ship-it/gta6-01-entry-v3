// Pedestrians: bright-clothed walkers on sidewalks, panic + fallen poses.
// Types from CHARACTER-SPEC: beach local, office worker, youth (panic), elder.
import { makeHumanoid, setPose } from './characters.js';
import { mulberry32, pick, range } from './random.js';

const TYPES = [
  { shirt: 0xffd23c, pants: 0x2a6ab0, hair: 0x8a1a1a, hairStyle: 'cap', pose: 'run' },    // beach local, red cap
  { shirt: 0xf2f2f2, pants: 0x3a3a3a, hair: 0x1a1a1a, hairStyle: 'short', pose: 'walk' }, // office worker
  { shirt: 0x9a5fd0, pants: 0x22283a, hair: 0x1a1a1a, hairStyle: 'short', pose: 'panic' },// youth, purple hoodie
  { shirt: 0xff7ab0, pants: 0x2a2a2a, hair: 0xb0b0b0, hairStyle: 'bun', pose: 'walk' },   // elder, pink blouse
  { shirt: 0xff8a2a, pants: 0x2a4a6a, hair: 0x3a2a1a, hairStyle: 'bob', pose: 'walk' },
  { shirt: 0x35d0d8, pants: 0x1a1a1a, hair: 0x1a1a1a, hairStyle: 'cap', pose: 'run' },
];
const SKINS = [0xc98d5f, 0x8a5a3b, 0xd9a06b, 0x6a4a30];

export class Pedestrians {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    const rng = mulberry32(99);
    for (let i = 0; i < 12; i++) {
      const t = pick(rng, TYPES);
      const h = makeHumanoid({ skin: pick(rng, SKINS), hair: t.hair, hairStyle: t.hairStyle, shirt: t.shirt, pants: t.pants });
      const x = range(rng, -120, 120), z = range(rng, -120, 120);
      h.position.set(x, 0, z);
      h.rotation.y = rng() * Math.PI * 2;
      scene.add(h);
      this.list.push({ mesh: h, pose: t.pose, speed: t.pose === 'run' ? 3.2 : 1.4, dir: rng() * Math.PI * 2, phase: rng() * 10 });
    }
  }
  update(dt, t) {
    for (const p of this.list) {
      if (p.pose === 'fallen') { setPose(p.mesh, 'fallen', t); continue; }
      p.mesh.position.x += Math.sin(p.dir) * p.speed * dt;
      p.mesh.position.z += Math.cos(p.dir) * p.speed * dt;
      if (Math.abs(p.mesh.position.x) > 145 || Math.abs(p.mesh.position.z) > 145) p.dir += Math.PI;
      p.mesh.rotation.y = p.dir + Math.PI;
      setPose(p.mesh, p.pose, t + p.phase);
    }
  }
  // Stage extra pedestrians at fixed spots for a screenshot.
  stage(list) {
    const added = [];
    for (const s of list) {
      const t = TYPES[s.type ?? 0];
      const h = makeHumanoid({ skin: SKINS[s.skin ?? 0], hair: t.hair, hairStyle: t.hairStyle, shirt: t.shirt, pants: t.pants });
      h.position.set(s.x, 0, s.z);
      h.rotation.y = s.rot ?? 0;
      if (s.pose === 'fallen') h.position.y = 0.05;
      setPose(h, s.pose ?? t.pose, s.phase ?? 0);
      this.scene.add(h);
      added.push(h);
    }
    return added;
  }
  clearStaged(meshes) { for (const m of meshes) this.scene.remove(m); }
}
