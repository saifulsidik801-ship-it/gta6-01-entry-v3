// MARISOL BAY — main wiring: renderer, loop, input, screens, MARISOL API.
// Written fresh from the design specs. No code copied from any prior entry.
import { CFG, DISTRICTS, districtAt, CREW } from './config.js';
import { buildSkyDome, buildWorld } from './world.js';
import { Traffic } from './traffic.js';
import { Pedestrians } from './pedestrians.js';
import { Police } from './police.js';
import { PoliceHeli } from './heli.js';
import { Player } from './player.js';
import { CameraRig } from './camera.js';
import { Combat } from './combat.js';
import { Effects } from './effects.js';
import { Missions } from './missions.js';
import { Radio } from './radio.js';
import { AudioEngine } from './audio.js';
import { HUD } from './hud.js';
import { Input } from './input.js';
import { Save } from './save.js';
import { Garage } from './garage.js';
import { stageShot, shotTick, heliAudit } from './shots.js';

const $ = (s) => document.querySelector(s);

function applyPalette(scene, hemi, sun, amb, dome, p) {
  scene.fog.color.setHex(p.fog);
  hemi.color.setHex(p.hemiSky); hemi.groundColor.setHex(p.hemiGround); hemi.intensity = p.hemiI;
  sun.color.setHex(p.sun); sun.intensity = p.sunI;
  amb.intensity = p.ambI;
  dome.material.uniforms.top.value.setHex(p.skyTop);
  dome.material.uniforms.mid.value.setHex(p.skyMid);
  dome.material.uniforms.low.value.setHex(p.skyLow);
  dome.material.uniforms.lift.value = p.lift;
}

function main() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.62;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  $('#game').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x8a5a7d, 120, 400);
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(30, 4, -28);

  const hemi = new THREE.HemisphereLight(0xffb08a, 0x4a3a55, 1.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb36b, 1.9);
  sun.position.set(-60, 55, -80); scene.add(sun);
  const amb = new THREE.AmbientLight(0xffffff, 0.5); scene.add(amb);
  const dome = buildSkyDome(scene, CFG.dusk, CFG.dusk.lift);
  applyPalette(scene, hemi, sun, amb, dome, CFG.dusk);

  const world = buildWorld(scene, CFG.dusk);
  const cityGroup = world.group;
  const traffic = new Traffic(scene);
  const peds = new Pedestrians(scene);
  const police = new Police(scene);
  const heli = new PoliceHeli(scene);
  const player = new Player(scene);
  const effects = new Effects(scene);
  const combat = new Combat(scene, effects);
  const missions = new Missions();
  const radio = new Radio();
  const audio = new AudioEngine(radio);
  const hud = new HUD();
  const input = new Input();
  const save = new Save();
  const garage = new Garage(scene);
  const camRig = new CameraRig(camera);

  const g = {
    scene, camera, camRig, renderer, player, police, heli, traffic, peds, combat, missions,
    radio, audio, hud, input, save, garage, cityGroup, effects, staged: [],
    frozen: false, shotName: null, heliPinned: null, gunfight: false, shotPrompt: null,
    hudState: {},
  };

  // ---- live HUD state (shots override fields via baseHud) ----
  function liveHudState() {
    const o = missions.getCurrentObjective();
    const d = districtAt(player.position.x, player.position.z);
    return {
      objective: o, speaker: missions.speakerData(), radio: radio.nowPlaying(),
      money: 18450, wanted: police.wanted, day: 9, clock: police.wanted >= 3 ? '18:40' : '18:40',
      rank: 'B', rankName: 'FIXER', rp: 3900, rpMax: 5200, respect: 290, respectMax: 550, respectLv: 4,
      missionIndex: missions.index, health: player.health, armour: player.armour,
      street: Math.abs(player.position.x) < 16 ? 'Harbor Ave' : 'Marina Blvd',
      district: d, playerPos: player.position, facing: player.state.facing,
      playerSpeed: player.state.speed, driving: player.driving,
      policeRows: police.panelData(player.position, heli),
      policeFoot: police.wanted >= 3 ? 'IN SIGHT \u00b7 CLOSEST 7 M' : police.wanted > 0 ? 'SEARCHING \u00b7 STAY LOW' : 'CLEAN \u00b7 NO UNITS NEARBY',
      heliVisible: heli.visible, heliState: heli.state,
      heliPos: heli.visible ? heli.group.position : null,
      copDots: police.cruisers.map((c) => ({ x: c.mesh.position.x, z: c.mesh.position.z })),
    };
  }

  // ---- state ----
  let state = 'menu'; // menu | playing | paused
  let garageOpen = false, mapOpen = false;
  const MARISOL = {
    ready: false, hud, player, missions, radio, police, heli,
    get driving() { return player.driving; },
    get paused() { return state === 'paused'; },
    save,
  };
  window.MARISOL = MARISOL;
  window.__r10audit = () => heliAudit(g);

  function startGame() {
    if (state !== 'menu') return;
    state = 'playing';
    hud.build();
    hud.setStarted(true);
    audio.unlock();
    police.setWanted(0);
    hud.toast('MISSION 3 \u00b7 DOWNTOWN HEAT \u2014 lose the patrol. Press J for the next job.');
    MARISOL.ready = true;
    window.__gameReady = true;
  }
  $('#btn-start').addEventListener('click', startGame);
  $('#btn-continue').addEventListener('click', startGame);
  $('#btn-load').addEventListener('click', startGame);
  $('#btn-controls').addEventListener('click', () => hud.toast('WASD move \u00b7 E steal car \u00b7 Click shoot \u00b7 M map \u00b7 U garage \u00b7 P pause \u00b7 Q/E radio \u00b7 V play'));

  function togglePause() {
    if (state === 'playing') { state = 'paused'; hud.setPaused(true); }
    else if (state === 'paused') { state = 'playing'; hud.setPaused(false); }
  }
  function toggleMap() {
    if (state === 'menu') return;
    mapOpen = !mapOpen;
    hud.setMap(mapOpen);
  }
  function toggleGarage() {
    if (state === 'menu') return;
    garageOpen = !garageOpen;
    if (garageOpen) {
      cityGroup.visible = false;
      garage.show(true);
      hud.setGarage(true);
      camera.position.set(4.2, 3.4, 8.2);
      camera.lookAt(-0.5, 1.0, -0.4);
      camera.fov = 55; camera.updateProjectionMatrix();
    } else {
      garage.show(false);
      cityGroup.visible = true;
      hud.setGarage(false);
      camRig.snap(player, player.driving);
    }
  }

  input.on('p', togglePause);
  input.on('escape', () => { if (mapOpen) toggleMap(); else if (garageOpen) toggleGarage(); else togglePause(); });
  input.on('m', toggleMap);
  input.on('u', toggleGarage);
  input.on('j', () => { if (state === 'playing') { missions.startNext(); hud.toast(`JOB STARTED \u00b7 ${missions.active.title} \u2014 ${missions.active.obj}`); } });
  input.on('q', () => radio.nextStation(1));
  input.on('v', () => radio.toggle());
  // E: enter/exit car
  input.on('e', () => {
    if (state !== 'playing' || garageOpen || mapOpen) return;
    if (player.driving) { player.exitCar(); hud.toast('On foot.'); }
    else {
      const near = player.nearestCar(traffic.parked, 3);
      if (near) {
        player.enterCar(near);
        if (police.wanted === 0) { police.setWanted(1); hud.toast('VEHICLE STOLEN \u00b7 a witness called it in.'); }
        hud.setPopup(`VEHICLE STOLEN &middot; ${near.name}<div class="sub">A witness called the patrol</div>`);
        setTimeout(() => hud.setPopup(null), 2600);
      }
    }
  });
  renderer.domElement.addEventListener('mousedown', (e) => {
    if (state !== 'playing' || garageOpen || mapOpen || g.frozen) return;
    if (player.driving) return;
    audio.unlock();
    const dir = new THREE.Vector3(Math.sin(player.state.facing), 0, Math.cos(player.state.facing));
    combat.shoot(player.position.clone(), dir);
  });

  // ---- HUD scaler ----
  function fitHud() {
    const s = Math.min(window.innerWidth / 800, window.innerHeight / 480);
    const el = $('#hud-scale');
    el.style.transform = `translate(-50%, -50%) scale(${s})`;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', fitHud);
  fitHud();

  // ---- shot mode ----
  const params = new URLSearchParams(location.search);
  const shotParam = params.get('shot');
  let shotFrames = 0;
  let shotT0 = 0;
  if (shotParam) {
    // boot straight into the staged shot (no menu click needed)
    state = 'playing';
    hud.build();
    hud.setStarted(true);
    MARISOL.ready = true;
    window.__gameReady = true;
    const shotName = shotParam;
    // defer one frame so the first render lands, then stage
    requestAnimationFrame(() => {
      try {
        stageShot(g, shotName);
        // one HUD paint from live state + shot overrides (frozen mode never repaints)
        Object.assign(g.hudState, liveHudState(), g.shotHudOverride || {});
        if (!g.shotName.startsWith('03') && !g.shotName.startsWith('04')) {
          hud.update(g.hudState);
          hud.drawMinimap(g.hudState);
        }
      } catch (e) { console.error('stageShot failed', e); }
      shotT0 = performance.now();
    });
  } else {
    MARISOL.ready = true;
    window.__gameReady = true;
  }

  // ---- main loop ----
  const clock = new THREE.Clock();
  let elapsed = 0;
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    elapsed += dt;
    if (g.frozen) {
      shotTick(g, dt, elapsed);
      if (shotParam && !window.__shotReady) {
        shotFrames++;
        if (shotFrames >= 3 && performance.now() - shotT0 > 1000) window.__shotReady = true;
      }
      renderer.render(scene, camera);
      return;
    }
    if (state === 'playing' && !garageOpen && !mapOpen) {
      player.update(dt, input, camRig.yaw);
      traffic.update(dt);
      peds.update(dt, elapsed);
      police.update(dt, elapsed, player.position, player.state.speed);
      heli.update(dt, player.position, player.state.speed, police.wanted);
      missions.update(dt, !!player.driving);
      radio.update(dt);
      audio.update(dt, heli.visible ? heli.distance : null);
      combat.update(elapsed);
      camRig.mode = player.driving ? 'chase' : (input.aim ? 'shoulder' : 'chase');
      camRig.update(dt, player, player.driving);
      if (world.wheel) world.wheel.rotation.z += dt * 0.2;
      Object.assign(g.hudState, liveHudState());
      hud.update(g.hudState);
    } else if (garageOpen) {
      garage.car.rotation.y += dt * 0.25; // turntable spin
      audio.update(dt, null);
    } else if (state === 'paused') {
      // frozen frame
    } else {
      // menu: slow orbit around the city
      camera.position.set(Math.sin(elapsed * 0.05) * 90, 42, Math.cos(elapsed * 0.05) * 90);
      camera.lookAt(0, 4, 0);
      if (world.wheel) world.wheel.rotation.z += dt * 0.2;
      traffic.update(dt);
    }
    effects.update(dt);
    input.endFrame();
    renderer.render(scene, camera);
  }
  loop();
}

try {
  main();
} catch (e) {
  console.error('MARISOL boot failed', e);
  window.__bootError = String(e && e.message || e);
}
