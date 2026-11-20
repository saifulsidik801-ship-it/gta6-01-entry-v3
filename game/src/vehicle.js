// Shaped cars from an extruded side profile (sloped hood, cabin, fenders) —
// never stacked boxes. One shared profile geometry; materials per colour.
let profileGeo = null;
function getProfileGeo() {
  if (profileGeo) return profileGeo;
  // Side profile in x (length, -2.2..2.2) / y (height), extruded across z (width 1.9).
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.25); s.lineTo(-2.15, 0.62); s.lineTo(-1.55, 0.78); // rear deck
  s.lineTo(-0.95, 0.82); s.lineTo(-0.55, 1.28); s.lineTo(0.55, 1.28); // cabin roof
  s.lineTo(1.05, 0.86); s.lineTo(1.75, 0.72); s.lineTo(2.2, 0.55); // hood slope
  s.lineTo(2.2, 0.25); s.closePath();
  profileGeo = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, steps: 1 });
  profileGeo.translate(0, 0, -0.95);
  return profileGeo;
}
const paintCache = new Map();
function paint(color) {
  if (!paintCache.has(color)) paintCache.set(color, new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.35 }));
  return paintCache.get(color);
}
const glassMat = new THREE.MeshStandardMaterial({ color: 0x14202e, metalness: 0.7, roughness: 0.15 });
const tyreMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0xc8c8d0, metalness: 0.8, roughness: 0.3 });
const lightFrontMat = new THREE.MeshStandardMaterial({ color: 0xfff6c0, emissive: 0xfff2b0, emissiveIntensity: 1.8 });
const lightRearMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 1.4 });
const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12);
wheelGeo.rotateX(Math.PI / 2);

export function buildCar({ color = 0xe8362a, police = false, taxi = false } = {}) {
  const g = new THREE.Group(); g.name = police ? 'cruiser' : 'car';
  const body = new THREE.Mesh(getProfileGeo(), paint(police ? 0xf2f2f2 : taxi ? 0xf2b705 : color));
  body.position.y = 0.32; g.add(body);
  // glass cabin
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 1.6), glassMat);
  cab.position.set(0, 1.18, 0); g.add(cab);
  // fender flares
  const fenderGeo = new THREE.BoxGeometry(0.5, 0.22, 1.98);
  for (const [x] of [[-1.45], [1.45]]) { const f = new THREE.Mesh(fenderGeo, paint(police ? 0xf2f2f2 : color)); f.position.set(x, 0.55, 0); g.add(f); }
  // wheels (steerable front pair kept as refs)
  const wheels = [];
  for (const [x, z] of [[-1.45, 0.95], [-1.45, -0.95], [1.45, 0.95], [1.45, -0.95]]) {
    const w = new THREE.Mesh(wheelGeo, tyreMat);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.3, 8), hubMat);
    hub.rotation.x = Math.PI / 2; w.add(hub);
    w.position.set(x, 0.36, z); g.add(w); wheels.push(w);
  }
  // headlights + taillights
  for (const z of [-0.62, 0.62]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.34), lightFrontMat);
    h.position.set(2.2, 0.62, z); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.4), lightRearMat);
    t.position.set(-2.22, 0.68, z); g.add(t);
  }
  // rear details so the chase view reads as a car, not a slab
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 1.5), glassMat);
  rearGlass.position.set(-1.15, 1.0, 0); rearGlass.rotation.z = 0.35; g.add(rearGlass);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 1.9), paint(0x1a1a1a));
  spoiler.position.set(-2.05, 1.02, 0); g.add(spoiler);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 1.95), paint(0x1a1a1a));
  bumper.position.set(-2.2, 0.42, 0); g.add(bumper);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.55), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, emissive: 0x888888, emissiveIntensity: 0.4 }));
  plate.position.set(-2.3, 0.62, 0); g.add(plate);
  for (const z of [-0.5, 0.5]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 8), hubMat);
    ex.rotation.z = Math.PI / 2; ex.position.set(-2.28, 0.32, z); g.add(ex);
  }
  // headlight cones (additive, dusk-visible)
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const coneGeo = new THREE.ConeGeometry(1.6, 7, 12, 1, true);
  coneGeo.rotateX(-Math.PI / 2); coneGeo.translate(0, -0.25, 0);
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = Math.PI / 2; cone.position.set(5.4, 0.5, 0); g.add(cone);
  let lightBar = null, poolRed = null, poolBlue = null;
  if (police) {
    lightBar = new THREE.Group();
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.5), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2.5 }));
    r.position.z = -0.42; lightBar.add(r);
    const b = r.clone(); b.material = new THREE.MeshStandardMaterial({ color: 0x2266ff, emissive: 0x2266ff, emissiveIntensity: 2.5 }); b.position.z = 0.42; lightBar.add(b);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 1.1), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    lightBar.add(base);
    lightBar.position.set(0, 1.5, 0); g.add(lightBar);
    // siren light pools on the asphalt (alternating red/blue)
    const poolGeo = new THREE.CircleGeometry(3.4, 20);
    poolRed = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    poolRed.rotation.x = -Math.PI / 2; poolRed.position.y = 0.06; g.add(poolRed);
    poolBlue = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ color: 0x2a66ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    poolBlue.rotation.x = -Math.PI / 2; poolBlue.position.y = 0.07; g.add(poolBlue);
    // door stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a2a6a }));
    stripe.position.set(0, 0.72, 0.99); g.add(stripe);
    const stripe2 = stripe.clone(); stripe2.position.z = -0.99; g.add(stripe2);
  }
  g.userData = { wheels, lightBar, poolRed, poolBlue, cone };
  return g;
}
