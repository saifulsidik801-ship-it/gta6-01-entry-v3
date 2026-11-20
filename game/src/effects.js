// Effects: explosion, tracer, muzzle flash, smoke, fire glow, skid marks.
// All procedural; no external assets.
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,240,180,1)'); gr.addColorStop(0.4, 'rgba(255,140,50,0.7)'); gr.addColorStop(1, 'rgba(255,80,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
let glowTex = null;
export function getGlowTex() { if (!glowTex) glowTex = glowTexture(); return glowTex; }

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.tracers = [];
  }
  explosion(pos, scale = 1) {
    const g = new THREE.Group(); g.position.copy(pos);
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.6 * scale, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc23c, transparent: true, opacity: 0.95 }));
    g.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTex(), transparent: true, opacity: 0.9, depthWrite: false }));
    glow.scale.setScalar(11 * scale); g.add(glow);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.9 * scale, 8, 6), smokeMat);
      s.position.set((Math.random() - 0.5) * 3 * scale, Math.random() * 2.5 * scale, (Math.random() - 0.5) * 3 * scale);
      g.add(s);
    }
    // debris
    const debMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    for (let i = 0; i < 6; i++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.5), debMat);
      d.position.set((Math.random() - 0.5) * 4, Math.random() * 1.5, (Math.random() - 0.5) * 4);
      d.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      g.add(d);
    }
    this.scene.add(g);
    this.pool.push({ g, life: 1.4, max: 1.4, kind: 'boom' });
    return g;
  }
  fire(pos, scale = 1) {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTex(), transparent: true, opacity: 0.85, depthWrite: false }));
    glow.scale.setScalar(6 * scale); glow.position.copy(pos); glow.position.y += 1.2;
    this.scene.add(glow);
    this.pool.push({ g: glow, life: 999, max: 999, kind: 'fire' });
    return glow;
  }
  tracer(from, to) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.03, 0.03, len, 5, 1, true);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(from).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    this.scene.add(m);
    this.tracers.push({ m, life: 0.5 });
    return m;
  }
  muzzle(pos, dir) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTex(), transparent: true, opacity: 1, depthWrite: false }));
    f.scale.setScalar(2.2);
    f.position.copy(pos).addScaledVector(dir, 0.6);
    this.scene.add(f);
    this.tracers.push({ m: f, life: 0.25 });
    return f;
  }
  skid(x, z, angle, len = 3) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, len),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.5, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = angle;
    m.position.set(x, 0.05, z); this.scene.add(m);
    return m;
  }
  update(dt) {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      if (p.kind === 'fire') continue;
      p.life -= dt;
      const k = Math.max(0, p.life / p.max);
      p.g.scale.setScalar(1 + (1 - k) * 0.6);
      p.g.children.forEach((c) => { if (c.material.transparent) c.material.opacity = k; });
      if (p.life <= 0) { this.scene.remove(p.g); this.pool.splice(i, 1); }
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) { this.scene.remove(t.m); this.tracers.splice(i, 1); }
    }
  }
}
