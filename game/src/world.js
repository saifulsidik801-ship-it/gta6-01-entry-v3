// World: dusk sky dome, grid city, lit buildings, palms, beach + sea, pier wheel.
// Written fresh from the design specs (gradient dusk, dense streets, lit windows).
import { mulberry32, range } from './random.js';

export function makeWindowTexture(rng) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#23202e'; g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 122; y += 12) for (let x = 5; x < 58; x += 11) {
    const r = rng();
    g.fillStyle = r < 0.55 ? '#ffd98a' : r < 0.7 ? '#9fd4ef' : '#2e2a3a';
    g.fillRect(x, y, 7, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildSkyDome(scene, palette, lift = 1) {
  const geo = new THREE.SphereGeometry(420, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(palette.skyTop) },
      mid: { value: new THREE.Color(palette.skyMid) },
      low: { value: new THREE.Color(palette.skyLow) },
      sunDir: { value: new THREE.Vector3(-0.45, 0.18, -0.87).normalize() },
      lift: { value: lift },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vP; uniform vec3 top, mid, low, sunDir; uniform float lift;
      void main(){
        vec3 d = normalize(vP);
        float h = clamp(d.y, -0.08, 1.0);
        vec3 col = h < 0.22 ? mix(low, mid, h / 0.22) : mix(mid, top, (h - 0.22) / 0.78);
        float s = pow(max(dot(d, sunDir), 0.0), 24.0);
        col += vec3(1.0, 0.75, 0.45) * s * 0.9;
        float s2 = pow(max(dot(d, sunDir), 0.0), 4.0);
        col += vec3(1.0, 0.55, 0.3) * s2 * 0.22;
        // faint clouds
        float cl = sin(d.x * 18.0 + d.z * 7.0) * sin(d.z * 14.0 - d.x * 5.0);
        col += vec3(0.10, 0.06, 0.10) * smoothstep(0.45, 0.9, cl) * (1.0 - h);
        gl_FragColor = vec4(col * lift, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(geo, mat);
  dome.name = 'skyDome';
  scene.add(dome);
  return dome;
}

export function buildWorld(scene, palette) {
  const rng = mulberry32(1337);
  const group = new THREE.Group(); group.name = 'city';
  const H = 160; // city half-size
  // ground: asphalt base + beach + sea
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(H * 2 + 320, H * 2 + 320),
    new THREE.MeshStandardMaterial({ color: 0x4a4550, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(40, -0.05, 0); group.add(ground);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(90, H * 2 + 320),
    new THREE.MeshStandardMaterial({ color: 0xd9b98a, roughness: 1 }));
  beach.rotation.x = -Math.PI / 2; beach.position.set(-H - 45, 0, 0); group.add(beach);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, H * 2 + 320),
    new THREE.MeshStandardMaterial({ color: 0x2a6a8a, roughness: 0.25, metalness: 0.35 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(-H - 200, -0.4, 0); group.add(sea);

  // roads: avenues along z at x = -96..96 step 32, streets along x at z = same
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x38353f, roughness: 0.9 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xd8b93c, roughness: 0.8 });
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x7d7887, roughness: 1 });
  const lines = [-96, -64, -32, 0, 32, 64, 96];
  for (const v of lines) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(10, H * 2), roadMat);
    a.rotation.x = -Math.PI / 2; a.position.set(v, 0.02, 0); group.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 10), roadMat);
    b.rotation.x = -Math.PI / 2; b.position.set(0, 0.02, v); group.add(b);
    // centre dashes
    for (let t = -H + 8; t < H; t += 16) {
      const d1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 5), lineMat);
      d1.rotation.x = -Math.PI / 2; d1.position.set(v, 0.04, t); group.add(d1);
      const d2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.5), lineMat);
      d2.rotation.x = -Math.PI / 2; d2.position.set(t, 0.04, v); group.add(d2);
    }
    // sidewalks
    for (const off of [-7.5, 7.5]) {
      const s1 = new THREE.Mesh(new THREE.PlaneGeometry(5, H * 2), walkMat);
      s1.rotation.x = -Math.PI / 2; s1.position.set(v + off, 0.03, 0); group.add(s1);
      const s2 = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 5), walkMat);
      s2.rotation.x = -Math.PI / 2; s2.position.set(0, 0.03, v + off); group.add(s2);
    }
  }

  // buildings: one or two per block, windows lit (emissive canvas texture)
  const winTex = makeWindowTexture(mulberry32(77));
  const facadeCols = [0x8a6a8a, 0x6a7a9a, 0x9a7a5a, 0x5a7a6a, 0x7a5a6a, 0xb08a5a, 0x4a5a7a];
  const winMat = new THREE.MeshStandardMaterial({ map: winTex, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 1.3, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2e2a33, roughness: 1 });
  const shopCols = [0xff5a5a, 0x35d0d8, 0xffc93c, 0xff7a3c, 0x7aff8a];
  let bi = 0;
  for (let gx = -3; gx <= 3; gx++) for (let gz = -3; gz <= 3; gz++) {
    if (gx === 0 && gz === 0) continue; // keep the downtown plaza open for the cover chase
    const cx = gx * 32 + 16, cz = gz * 32 + 16;
    const n = rng() < 0.45 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const w = range(rng, 12, 18), d = range(rng, 12, 18);
      const h = Math.min(30, range(rng, 10, 34) * (Math.abs(gx) <= 1 && Math.abs(gz) <= 1 ? 1.4 : 1));
      const px = cx + (n === 2 ? (k === 0 ? -6 : 6) : 0);
      const pz = cz + (n === 2 ? (k === 0 ? 4 : -4) : 0);
      const col = facadeCols[Math.floor(rng() * facadeCols.length)];
      const side = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roofMat, roofMat, winMat, winMat]);
      // windows on the two long faces: use winMat on +/-z faces via material array order [px, nx, py, ny, pz, nz]
      b.position.set(px, h / 2, pz); group.add(b);
      // shop sign strip on ground floors facing the avenue
      if (rng() < 0.6) {
        const sign = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w, 10), 1.1, 0.4),
          new THREE.MeshStandardMaterial({ color: shopCols[Math.floor(rng() * shopCols.length)], emissive: shopCols[Math.floor(rng() * shopCols.length)], emissiveIntensity: 0.7 }));
        sign.position.set(px, 3.4, pz + d / 2 + 0.25); group.add(sign);
      }
      bi++;
    }
  }

  // palms along avenues + beach (instanced: 2 draw calls)
  const palmSpots = [];
  for (const v of lines) for (let t = -140; t <= 140; t += 24) {
    if (rng() < 0.75) palmSpots.push([v + 9.5, t + (rng() < 0.5 ? 4 : -4)]);
    if (rng() < 0.5) palmSpots.push([v - 9.5, t + 6]);
  }
  for (let z = -150; z <= 150; z += 18) palmSpots.push([-118 + range(rng, -4, 4), z]);
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 7, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
  const crownGeo = new THREE.ConeGeometry(2.6, 2.2, 6);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x2f9d4a, roughness: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, palmSpots.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  palmSpots.forEach(([x, z], i) => {
    e.set(0.06 * (rng() - 0.5), rng() * Math.PI, 0.06 * (rng() - 0.5)); q.setFromEuler(e);
    m4.compose(new THREE.Vector3(x, 3.5, z), q, s); trunks.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 7.6, z), q, s); crowns.setMatrixAt(i, m4);
  });
  group.add(trunks); group.add(crowns);

  // street lamps (instanced poles + emissive heads)
  const lampGeo = new THREE.CylinderGeometry(0.09, 0.09, 6, 5);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.8 });
  const headGeo = new THREE.SphereGeometry(0.32, 8, 6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffd98a, emissiveIntensity: 1.6 });
  const lampSpots = [];
  for (const v of lines) for (let t = -128; t <= 128; t += 32) lampSpots.push([v + 6.5, t]);
  const lamps = new THREE.InstancedMesh(lampGeo, lampMat, lampSpots.length);
  const heads = new THREE.InstancedMesh(headGeo, headMat, lampSpots.length);
  lampSpots.forEach(([x, z], i) => {
    m4.compose(new THREE.Vector3(x, 3, z), new THREE.Quaternion(), s); lamps.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x, 6.1, z), new THREE.Quaternion(), s); heads.setMatrixAt(i, m4);
  });
  group.add(lamps); group.add(heads);

  // beach umbrellas + pier ferris wheel
  const umbMat = new THREE.MeshStandardMaterial({ color: 0xff5a7a, roughness: 0.9 });
  const umbMat2 = new THREE.MeshStandardMaterial({ color: 0x35d0d8, roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const ux = -128 - rng() * 22, uz = -130 + i * 28 + range(rng, -6, 6);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 5), trunkMat);
    pole.position.set(ux, 1.2, uz); group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1, 8), i % 2 ? umbMat : umbMat2);
    top.position.set(ux, 2.6, uz); group.add(top);
  }
  const wheel = new THREE.Group(); wheel.position.set(-128, 16, 96);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.5, 6, 24), new THREE.MeshStandardMaterial({ color: 0xff7a3c, emissive: 0xff7a3c, emissiveIntensity: 0.5 }));
  wheel.add(rim);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffc93c, emissive: 0xffc93c, emissiveIntensity: 0.8 }));
  wheel.add(hub);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x35d0d8 : 0xff5a7a, emissive: 0xffffff, emissiveIntensity: 0.25 }));
    cab.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0); wheel.add(cab);
  }
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 17, 6), lampMat);
  legL.position.set(-4, -8, 0); legL.rotation.z = 0.35; wheel.add(legL);
  const legR = legL.clone(); legR.position.x = 4; legR.rotation.z = -0.35; wheel.add(legR);
  group.add(wheel);
  group.userData.wheel = wheel;

  // billboards
  const bbCols = [0xff5a7a, 0x35d0d8, 0xffc93c];
  [[-96, -40, 'MARISOL'], [32, 96, 'BAY FM'], [64, -96, 'PIER 9']].forEach(([x, z, txt], i) => {
    const bd = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.5),
      new THREE.MeshStandardMaterial({ color: bbCols[i], emissive: bbCols[i], emissiveIntensity: 0.55 }));
    bd.position.set(x, 12, z); group.add(bd);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 10, 6), lampMat);
    post.position.set(x, 5, z); group.add(post);
  });

  scene.add(group);
  return { group, wheel, buildingCount: bi };
}
