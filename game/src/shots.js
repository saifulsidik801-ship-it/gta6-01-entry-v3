// Screenshot staging: deterministic, frozen scenes for the 4 shots.
// 01 cover chase (dusk, big heli + cone), 02 on-foot gunfight (dusk),
// 03 map menu, 04 garage interior. Plus the __r10audit heli-framing hook.
import { buildCar } from './vehicle.js';
import { setPose } from './characters.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function stageShot(g, name) {
  const { player, police, heli, traffic, peds, combat, missions, hud, camera, garage, cityGroup, effects } = g;
  g.frozen = true;
  g.shotName = name;
  hud.build();
  hud.setStarted(true);
  police.setWanted(0);
  heli.setVisible(false);
  combat.clearEnemies();

  if (name.startsWith('01')) return stageCover(g);
  if (name.startsWith('02')) return stageGunfight(g);
  if (name.startsWith('03')) { hud.setMap(true); return; }
  if (name.startsWith('04')) return stageGarage(g);
}

function baseHud(g, over) {
  g.shotHudOverride = Object.assign({
    money: 18450, wanted: 4, day: 9, clock: '18:40', rank: 'B', rankName: 'FIXER',
    rp: 3900, rpMax: 5200, respect: 290, respectMax: 550, respectLv: 4, missionIndex: 2,
    health: 100, armour: 55, street: 'Harbor Ave', heliVisible: true, heliState: 'orbiting',
    policeFoot: 'IN SIGHT \u00b7 CLOSEST 7 M',
  }, over);
}

function stageCover(g) {
  const { player, police, heli, traffic, peds, effects, missions, hud } = g;
  // Coastal avenue x=-96 (beach + palms west, towers east) heading north — the
  // top-1 cover pattern: open sky, sea light, palms, traffic ahead.
  const AX = -96;
  const hero = buildCar({ color: 0xe8362a });
  hero.position.set(AX, 0, 10); hero.rotation.y = Math.PI - Math.PI / 2;
  g.scene.add(hero);
  g.staged.push(hero);
  player.car = { mesh: hero, speed: 20, name: 'KITE COUPE', cond: 84, top: 34, heading: Math.PI };
  player.mesh.visible = false;
  player.position.set(AX, 0, 10);
  player.state.facing = Math.PI;
  // flanking cruisers + traffic ahead + one oncoming car
  police.setWanted(4);
  const spots = [[AX - 5.2, 4], [AX + 5.2, 0], [AX - 3, -18], [AX + 3, -26]];
  police.cruisers.forEach((c, i) => {
    const [x, z] = spots[i] || [AX, -30 - i * 8];
    c.mesh.position.set(x, 0, z);
    c.heading = Math.PI; c.mesh.rotation.y = Math.PI - Math.PI / 2;
  });
  g.staged.push(...traffic.stage([
    { x: AX - 2, z: -34, rot: Math.PI / 2, color: 0xe8e8e8 },
    { x: AX + 2, z: -46, rot: Math.PI / 2, color: 0x3b7ec9 },
    { x: AX - 2, z: -58, rot: Math.PI / 2, color: 0xff5a7a },
    { x: AX + 2, z: -72, rot: Math.PI / 2, color: 0xf2b705, taxi: true },
    { x: AX - 5, z: -84, rot: Math.PI / 2, color: 0x8a8a8a },
    { x: AX + 4, z: -40, rot: -Math.PI / 2, color: 0x2f9d4a },
  ]));
  // explosion + fire ahead on the avenue (fire persists; boom re-fires in shotTick)
  effects.explosion(V3(AX + 1, 1.5, -55), 2.2);
  effects.fire(V3(AX + 1, 0, -55), 2.5);
  effects.fire(V3(AX - 3, 0, -50), 1.6);
  g.coverShot = { boom: V3(AX + 1, 1.5, -55) };
  // pedestrians on both pavements + the beach
  g.staged.push(...peds.stage([
    { x: AX - 9.5, z: -6, type: 0, pose: 'run', rot: 2.6 }, { x: AX + 9.5, z: -2, type: 4, pose: 'walk', rot: -1.2 },
    { x: AX - 9.5, z: -22, type: 1, pose: 'walk', rot: 0.4 }, { x: AX + 9.5, z: -14, type: 2, pose: 'panic', rot: 3.1 },
    { x: AX - 9.5, z: 14, type: 3, pose: 'walk', rot: -0.6 }, { x: AX + 9.5, z: 10, type: 5, pose: 'run', rot: 2.2 },
    { x: AX - 16, z: -30, type: 0, pose: 'run', rot: -2.4 }, { x: AX - 14, z: 18, type: 4, pose: 'walk', rot: 1.0 },
  ]));
  // HELI: pinned top-center, fully in frame — height 13 m, 28 m north of the car.
  heli.pin(player.position, 13, 28, -Math.PI / 2);
  g.heliPinned = { height: 13, radius: 28, angle: -Math.PI / 2 };
  g.camRig.mode = 'chase';
  g.camRig.dist = 8.5;
  g.camRig.chaseHeight = 3.4;
  g.camRig.lookHeight = 3.0;
  g.camRig.snap(player, player.car);
  missions.index = 2; missions.active = null; missions.stage = 3; missions.stageMax = 4; missions.timer = 149;
  baseHud(g, {
    policeRows: [
      { name: 'HELI 1', dist: 26, tag: 'SPOTLIGHT' },
      { name: 'KITE-1', dist: 7, tag: 'RAMMING' },
      { name: 'MARLIN-3', dist: 10, tag: 'PURSUIT' },
      { name: 'CORAL-85', dist: 30, tag: 'CLOSING' },
      { name: 'CORAL-48', dist: 128, tag: 'FLANKING' },
    ],
    district: { name: 'LANTERN MILE', standing: 'FRIENDLY', grip: 73 },
    street: 'Shoreline Ave',
  });
  hud.setPopup(null);
}

function stageGunfight(g) {
  const { player, police, heli, traffic, peds, combat, effects, missions, hud } = g;
  // Coastal avenue x=-96 at dusk: Milo over-shoulder, enemies close ahead,
  // burning van to the right, panicking locals, beach + open sky behind.
  const AX = -96;
  player.exitCar && player.car && player.exitCar();
  player.setPosition(AX, 0, 8);
  player.state.facing = Math.PI; // face north (-z)
  player.mesh.visible = true;
  player.mesh.rotation.y = Math.PI;
  setPose(player.mesh, 'aim', 0);
  g.camRig.mode = 'shoulder';
  g.camRig.snap(player, null);
  // enemies with red markers + one fallen + burning van
  combat.spawnEnemies([
    { x: AX - 2, z: -1, rot: 0.3, shirt: 0xd93c3c }, { x: AX + 2, z: -4, rot: -0.2, shirt: 0xe8e8e8 }, { x: AX - 1, z: -8, rot: 0.5, shirt: 0xff5a7a },
  ]);
  g.staged.push(...peds.stage([
    { x: AX - 3, z: -3, type: 1, pose: 'fallen', rot: 0.8 },
  ]));
  const van = buildCar({ color: 0x1a1a1a });
  van.position.set(AX + 6.5, 0, -6); van.rotation.y = Math.PI / 2 + 0.2;
  g.scene.add(van); g.staged.push(van);
  effects.fire(V3(AX + 6.5, 0, -6), 1.8);
  effects.explosion(V3(AX + 6.5, 1.2, -6), 1.1);
  // panicking locals on the pavements + beach
  g.staged.push(...peds.stage([
    { x: AX - 9.5, z: -2, type: 2, pose: 'panic', rot: 1.2 }, { x: AX + 9.5, z: -5, type: 2, pose: 'panic', rot: -1.4 },
    { x: AX - 9.5, z: -10, type: 0, pose: 'run', rot: 2.8 }, { x: AX - 15, z: -6, type: 4, pose: 'walk', rot: -2.2 },
    { x: AX - 9.5, z: 2, type: 3, pose: 'walk', rot: 0.5 },
  ]));
  // parked taxi nearby for the steal prompt
  g.staged.push(...traffic.stage([{ x: AX + 8, z: -14, rot: Math.PI / 2, color: 0xf2b705, taxi: true }]));
  missions.index = 1; missions.active = null; missions.stage = 2; missions.stageMax = 3; missions.timer = 0;
  baseHud(g, {
    money: 7270, wanted: 2, clock: '19:31', rank: '9', rankName: 'WHEELMAN', rp: 1875, rpMax: 1800,
    respect: 140, respectMax: 250, respectLv: 2, missionIndex: 1, health: 95, armour: 27,
    heliVisible: false, street: 'Shoreline Ave',
    policeRows: [
      { name: 'FOOT \u00d7 2', dist: 21, tag: 'PURSUIT' },
      { name: 'CORAL-48', dist: 33, tag: 'PURSUIT' },
    ],
    policeFoot: 'CORAL-48: shots fired in the Lantern Mile market',
    district: { name: 'LANTERN MILE', standing: 'FRIENDLY', grip: 74 },
  });
  hud.setPopup(`SEARCHING &mdash; search zone 31 m &middot; clear in 11 s<div class="sub">Break line of sight to clear it</div>`);
  // contextual steal prompt (centre screen, like top-4 shot 2)
  const pr = document.createElement('div');
  pr.id = 'shot-prompt';
  pr.innerHTML = `<span style="background:#ffc93c;color:#111;font-weight:900;border-radius:3px;padding:2px 7px">F</span> &nbsp;STEAL SUNLINE CAB`;
  Object.assign(pr.style, { position: 'absolute', left: '330px', top: '300px', background: 'rgba(10,13,18,0.85)', color: '#fff', fontSize: '13px', fontWeight: '900', padding: '6px 10px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.2)', zIndex: 6 });
  document.getElementById('hud-scale').appendChild(pr);
  g.shotPrompt = pr;
  g.gunfight = true;
}

function stageGarage(g) {
  const { hud, garage, cityGroup, camera } = g;
  cityGroup.visible = false;
  garage.show(true);
  hud.setGarage(true);
  document.getElementById('g-cash').textContent = '$18,450';
  // fixed 3/4 camera on the car (car sits at (-2.5, 0.5, 0), panel covers right)
  camera.position.set(4.2, 3.4, 8.2);
  camera.lookAt(-0.5, 1.0, -0.4);
  camera.fov = 55; camera.updateProjectionMatrix();
}

// Per-frame tick while a shot is frozen: keep the live bits alive.
export function shotTick(g, dt, t) {
  const { heli, player, effects, combat } = g;
  if (g.heliPinned) {
    heli.pin(player.position, g.heliPinned.height, g.heliPinned.radius, g.heliPinned.angle);
    heli.rotor.rotation.y += 28 * dt;
    heli.tailRotor.rotation.x += 28 * 1.4 * dt;
  }
  // cruiser light bars flash
  const on = Math.sin(t * 10) > 0;
  for (const c of g.police.cruisers) {
    const u = c.mesh.userData;
    if (u.lightBar) {
      u.lightBar.children[0].material.emissiveIntensity = on ? 3 : 0.3;
      u.lightBar.children[1].material.emissiveIntensity = on ? 0.3 : 3;
    }
    if (u.poolRed && u.poolBlue) {
      u.poolRed.material.opacity = on ? 0.26 : 0.05;
      u.poolBlue.material.opacity = on ? 0.05 : 0.26;
    }
  }
  if (g.coverShot) {
    // keep a live explosion glow on the avenue so the shot always catches one
    g._boomT = (g._boomT || 0) - dt;
    if (g._boomT <= 0) {
      g._boomT = 1.2;
      effects.explosion(g.coverShot.boom, 2.2);
    }
  }
  if (g.gunfight) {
    setPose(player.mesh, 'aim', t);
    // re-fire the tracer every ~0.4 s so the shot always catches one live
    g._shootT = (g._shootT || 0) - dt;
    if (g._shootT <= 0) {
      g._shootT = 0.4;
      const from = player.position.clone();
      const dir = new THREE.Vector3(Math.sin(Math.PI), 0, Math.cos(Math.PI));
      combat.shoot(from, dir, { noKill: true });
    }
    combat.update(t);
  }
  effects.update(dt);
}

// Heli framing audit (project key points to NDC).
export function heliAudit(g) {
  const { heli, camera } = g;
  if (!heli.visible) return { heliVisible: false };
  const cam = camera; // g.camera is the THREE camera
  const pos = heli.group.position.clone();
  const toNDC = (v) => { const p = v.clone().project(cam); return [Number(p.x.toFixed(3)), Number(p.y.toFixed(3))]; };
  const bodyTop = toNDC(pos.clone().add(V3(0, 3.4, 0)));
  const bodyBottom = toNDC(pos.clone().add(V3(0, -2.7, 0)));
  const camDir = V3(cam.position.x - pos.x, 0, cam.position.z - pos.z).normalize();
  const rotorNear = toNDC(pos.clone().add(camDir.clone().multiplyScalar(8.8)).add(V3(0, 3.4, 0)));
  const fwd = V3(g.player.position.x - pos.x, 0, g.player.position.z - pos.z).normalize();
  const tail = toNDC(pos.clone().add(fwd.clone().multiplyScalar(-8.3)).add(V3(0, 0.5, 0)));
  const inFrame = ([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1;
  return {
    heliVisible: true,
    heliHeightFrac: Number((Math.abs(bodyTop[1] - bodyBottom[1]) / 2).toFixed(4)),
    bodyTopNdc: bodyTop, bodyBottomNdc: bodyBottom,
    rotorNearNdc: rotorNear, tailNdc: tail,
    rotorNearInFrame: inFrame(rotorNear), tailInFrame: inFrame(tail),
    heliInFrame: inFrame(bodyTop) && inFrame(bodyBottom) && inFrame(rotorNear) && inFrame(tail),
  };
}
