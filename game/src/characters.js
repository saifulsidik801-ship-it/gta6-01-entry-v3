// Humanoid factory: one shared build for Milo, partner, cops, pedestrians.
// Proportions: 1.8 tall, thick limbs, no 3D face — faces live only in 2D portraits.
const skinMats = new Map(), shirtMats = new Map(), pantsMats = new Map();
function mat(cache, color) {
  if (!cache.has(color)) cache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  return cache.get(color);
}
const headGeo = new THREE.SphereGeometry(0.14, 12, 10);
const torsoGeo = new THREE.BoxGeometry(0.42, 0.55, 0.24);
const armGeo = new THREE.BoxGeometry(0.13, 0.55, 0.13);
const legGeo = new THREE.BoxGeometry(0.14, 0.8, 0.14);
const hairHalfGeo = new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
const capGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.09, 10);
const gunGeo = new THREE.BoxGeometry(0.07, 0.12, 0.3);

export function makeHumanoid({ skin = 0xc98d5f, hair = 0x1c1c22, hairStyle = 'short', shirt = 0xe86a2a, shirt2 = null, pants = 0x1a2a4a, shoes = 0xffffff } = {}) {
  const g = new THREE.Group(); g.name = 'human';
  const hips = new THREE.Group(); hips.position.y = 0.8; g.add(hips);
  const torso = new THREE.Mesh(torsoGeo, mat(shirtMats, shirt)); torso.position.y = 0.28; hips.add(torso);
  if (shirt2) { // open jacket: two side panels over a tee
    const tee = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.25), mat(shirtMats, shirt2));
    tee.position.set(0, 0.28, 0.01); hips.add(tee);
    for (const x of [-0.2, 0.2]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.52, 0.26), mat(shirtMats, shirt));
      panel.position.set(x, 0.28, 0); hips.add(panel);
    }
  }
  const head = new THREE.Mesh(headGeo, mat(skinMats, skin)); head.position.y = 0.72; hips.add(head);
  const hairMat = mat(shirtMats, hair);
  let hairMesh;
  if (hairStyle === 'cap') {
    hairMesh = new THREE.Mesh(capGeo, hairMat); hairMesh.position.y = 0.8;
  } else if (hairStyle === 'ponytail') {
    hairMesh = new THREE.Group();
    const cap = new THREE.Mesh(hairHalfGeo, hairMat); cap.position.y = 0.72; hairMesh.add(cap);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.5, 6), hairMat);
    tail.position.set(0, 0.45, -0.15); tail.rotation.x = 0.25; hairMesh.add(tail);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), hairMat);
    tip.position.set(0, 0.2, -0.21); hairMesh.add(tip);
    hairMesh.position.y = 0;
  } else if (hairStyle === 'bun') {
    hairMesh = new THREE.Group();
    const cap = new THREE.Mesh(hairHalfGeo, hairMat); cap.position.y = 0.72; hairMesh.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), hairMat); bun.position.set(0, 0.85, -0.1); hairMesh.add(bun);
  } else if (hairStyle === 'bob') {
    hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 8), hairMat);
    hairMesh.scale.set(1, 0.85, 1); hairMesh.position.y = 0.74;
  } else {
    hairMesh = new THREE.Mesh(hairHalfGeo, hairMat); hairMesh.position.y = 0.72;
  }
  hips.add(hairMesh);
  const armL = new THREE.Group(); armL.position.set(-0.28, 0.5, 0); hips.add(armL);
  const armLm = new THREE.Mesh(armGeo, mat(shirtMats, shirt)); armLm.position.y = -0.24; armL.add(armLm);
  const armR = new THREE.Group(); armR.position.set(0.28, 0.5, 0); hips.add(armR);
  const armRm = new THREE.Mesh(armGeo, mat(shirtMats, shirt)); armRm.position.y = -0.24; armR.add(armRm);
  const gun = new THREE.Mesh(gunGeo, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 }));
  gun.position.set(0, -0.52, 0.12); gun.visible = false; armR.add(gun);
  const legL = new THREE.Group(); legL.position.set(-0.11, 0.8, 0); g.add(legL);
  const legLm = new THREE.Mesh(legGeo, mat(pantsMats, pants)); legLm.position.y = -0.4; legL.add(legLm);
  const legR = new THREE.Group(); legR.position.set(0.11, 0.8, 0); g.add(legR);
  const legRm = new THREE.Mesh(legGeo, mat(pantsMats, pants)); legRm.position.y = -0.4; legR.add(legRm);
  g.userData = { hips, head, hairMesh, armL, armR, legL, legR, gun, torso };
  return g;
}

export function setPose(h, pose, t = 0) {
  const u = h.userData;
  u.gun.visible = pose === 'aim';
  if (pose === 'aim') {
    u.armR.rotation.x = -Math.PI / 2 + 0.12; u.armR.rotation.z = 0;
    u.armL.rotation.x = -1.1; u.armL.rotation.z = 0.7;
    u.legL.rotation.x = 0.12; u.legR.rotation.x = -0.18;
    u.hips.rotation.x = 0.06;
  } else if (pose === 'panic') {
    u.armL.rotation.set(0, 0, 2.6); u.armR.rotation.set(0, 0, -2.6);
    u.legL.rotation.x = Math.sin(t * 9) * 0.5; u.legR.rotation.x = -Math.sin(t * 9) * 0.5;
    u.hips.rotation.x = -0.08;
  } else if (pose === 'fallen') {
    h.rotation.x = -Math.PI / 2 + 0.06;
    u.armL.rotation.z = 1.4; u.armR.rotation.z = -1.4;
    u.legL.rotation.x = 0.25; u.legR.rotation.x = -0.2;
  } else if (pose === 'run') {
    const s = Math.sin(t * 11);
    u.legL.rotation.x = s * 0.85; u.legR.rotation.x = -s * 0.85;
    u.armL.rotation.x = -s * 0.7 - 0.5; u.armR.rotation.x = s * 0.7 - 0.5;
    u.hips.rotation.x = 0.12; u.hips.position.y = 0.8 + Math.abs(Math.cos(t * 11)) * 0.05;
  } else if (pose === 'walk') {
    const s = Math.sin(t * 6);
    u.legL.rotation.x = s * 0.55; u.legR.rotation.x = -s * 0.55;
    u.armL.rotation.x = -s * 0.4; u.armR.rotation.x = s * 0.4;
    u.hips.position.y = 0.8 + Math.abs(Math.sin(t * 6)) * 0.03;
  } else { // idle
    u.armL.rotation.x = 0; u.armR.rotation.x = 0; u.armL.rotation.z = 0.08; u.armR.rotation.z = -0.08;
    u.legL.rotation.x = 0; u.legR.rotation.x = 0; u.hips.rotation.x = 0;
    u.hips.position.y = 0.8 + Math.sin(t * 2) * 0.012;
  }
}

// Flat-shaded 2D portrait (the ONLY place a face appears): round face, hair
// shape, two eye dots, small mouth, signature-shirt block.
export function drawPortrait(canvas, { skin = '#c98d5f', hair = '#1c1c22', hairStyle = 'short', shirt = '#e86a2a' } = {}) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#20242e'; g.fillRect(0, 0, W, H);
  g.fillStyle = shirt; g.fillRect(0, H * 0.72, W, H * 0.28); // shirt block
  g.fillStyle = skin;
  g.beginPath(); g.arc(W / 2, H * 0.44, W * 0.3, 0, Math.PI * 2); g.fill(); // face
  g.fillStyle = hair;
  if (hairStyle === 'ponytail') {
    g.beginPath(); g.arc(W / 2, H * 0.34, W * 0.3, Math.PI, 0); g.fill();
    g.fillRect(W * 0.62, H * 0.3, W * 0.12, H * 0.5);
  } else if (hairStyle === 'cap') {
    g.fillRect(W * 0.2, H * 0.1, W * 0.6, H * 0.16);
    g.fillRect(W * 0.2, H * 0.1, W * 0.72, H * 0.08);
  } else if (hairStyle === 'bun') {
    g.beginPath(); g.arc(W / 2, H * 0.34, W * 0.3, Math.PI, 0); g.fill();
    g.beginPath(); g.arc(W / 2, H * 0.08, W * 0.1, 0, Math.PI * 2); g.fill();
  } else if (hairStyle === 'bob') {
    g.beginPath(); g.arc(W / 2, H * 0.36, W * 0.33, Math.PI, 0); g.fill();
    g.fillRect(W * 0.17, H * 0.3, W * 0.1, H * 0.3); g.fillRect(W * 0.73, H * 0.3, W * 0.1, H * 0.3);
  } else {
    g.beginPath(); g.arc(W / 2, H * 0.34, W * 0.3, Math.PI, 0); g.fill();
  }
  g.fillStyle = '#141414';
  g.beginPath(); g.arc(W * 0.39, H * 0.44, W * 0.035, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(W * 0.61, H * 0.44, W * 0.035, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#7a4a30'; g.lineWidth = Math.max(1, W * 0.02);
  g.beginPath(); g.moveTo(W * 0.44, H * 0.58); g.lineTo(W * 0.56, H * 0.58); g.stroke();
}
