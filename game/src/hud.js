// HUD: all DOM panels, minimap, crew portraits, garage + map screens.
// Layout is authored for the 800x480 scaler in index.html; this file only
// fills values, draws the minimap/big map, and toggles screens.
import { CREW, WEAPONS, UPGRADES, GEAR, CARS, DISTRICTS, MISSIONS, districtAt } from './config.js';
import { drawPortrait } from './characters.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function fmtMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function fmtTimer(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

export class HUD {
  constructor() {
    this.started = false;
    this.garageOpen = false;
    this.mapOpen = false;
    this._built = false;
    this._mmTick = 0;
  }
  build() {
    if (this._built) return;
    this._built = true;
    // weapon slots: each slot is its own box; LOCKED lives inside its own slot.
    const w = $('#weapons');
    w.innerHTML = WEAPONS.map((wp, i) => {
      const locked = !wp.owned;
      return `<div class="slot${i === 2 ? ' active' : ''}${locked ? ' locked' : ''}"><div class="n">${wp.key}</div>` +
        `<div class="ic">${locked ? '\u{1F512}' : (i === 0 ? '\u270A' : '\u25AC')}</div>` +
        `<div class="nm">${wp.name}</div>` +
        (locked ? `<div class="lk">LOCKED</div><div class="pr">${wp.price}</div>` : `<div class="am">${wp.ammo}</div>`) +
        `</div>`;
    }).join('');
    // crew cards with flat-shaded portraits
    const cc = $('#crew-cards');
    cc.innerHTML = CREW.map((c) => `<div class="card"><canvas width="60" height="60" data-crew="${c.id}"></canvas><div><div class="c-name">${c.name}</div><div class="c-role">${c.ability} &middot; ${c.role}</div></div><span class="c-key">${c.key}</span></div>`).join('');
    $$('#crew-cards canvas').forEach((cv) => {
      const c = CREW.find((x) => x.id === cv.dataset.crew);
      drawPortrait(cv, { skin: c.skin, hair: c.hair, hairStyle: c.hairStyle, shirt: c.shirt });
    });
    // map checklist
    const checks = [
      ['Story missions', '5/6'], ['Street races won', '1/4'], ['Stunt jumps', '5/8'],
      ['Golden Geckos', '12/20'], ['Export list', '3/5'], ['District jobs', '5/7'],
      ['Districts FRIENDLY', '3/8'], ['Crew recruited', '3/3'], ['Gold mission ratings', '2/6'],
    ];
    $('#map-checklist').innerHTML = checks.map(([n, v]) =>
      `<div class="row"><span>${n}</span><b>${v}</b></div>`).join('') +
      `<div style="margin-top:8px;font-size:11px;color:#ffc93c;font-weight:900">MISSION RATINGS</div>` +
      `<div style="font-size:15px;letter-spacing:4px">\u{1F947}\u{1F948}\u{1F947}\u{1F949}\u{1F948}</div>`;
    // pause mission list
    $('#mission-list').innerHTML = MISSIONS.map((m, i) =>
      `<div class="mission-row"><b>${i + 1}. ${m.title}</b> &middot; ${m.chapter} &middot; ${i < 2 ? '<span class="grn">DONE</span>' : i === 2 ? '<span class="acc">NEXT</span>' : '<span class="dim">LOCKED</span>'}</div>`).join('');
    this._buildGarage();
  }
  _buildGarage() {
    const car = CARS[0];
    const rows = UPGRADES.map((u, i) => {
      const st = u.status === 'OWNED' ? `<span class="u-own">\u2713 OWNED</span>`
        : u.status.startsWith('LOCKED') ? `<span class="u-lock">\u{1F512} ${u.status}</span>`
        : `<span class="u-price">$${u.price.toLocaleString('en-US')}</span>`;
      return `<div class="u-row${i === 3 ? ' sel' : ''}"><div style="min-width:0"><b>${u.name}</b> <span class="u-fx">${u.fx}</span></div>${st}</div>`;
    }).join('');
    const gear = GEAR.map((g) => {
      const st = g.status === 'OWNED' ? `<span class="u-own">\u2713 OWNED</span>` : `<span class="u-price">$${g.price.toLocaleString('en-US')}</span>`;
      return `<div class="u-row"><div><b>${g.name}</b></div>${st}</div>`;
    }).join('');
    $('#garage-panel').innerHTML =
      `<h3>SPRAY &amp; TUNE</h3><div class="g-tabs"><span class="on">WORKSHOP</span> &nbsp; SHOWROOM</div>` +
      `<div class="g-sec">CAR UPGRADES</div>${rows}` +
      `<div class="g-sec">WEAPONS &amp; GEAR</div>${gear}` +
      `<div class="g-desc"><b>ARMOUR PLATING</b> &mdash; Every car takes half damage from crashes, bullets and blasts.</div>`;
    const bars = [['TOP SPEED', 78, car.top + ' KM/H'], ['ACCELERATION', 72, car.acc + ' S 0\u2013100'], ['ARMOUR', 60, car.armour + '/100'], ['HANDLING', 81, car.handling + '/100']];
    $('#garage-carcard').innerHTML =
      `<div class="cc-name">${car.name} &middot; <span class="dim">${car.cls}</span></div>` +
      `<div class="cc-row"><span class="lab">CONDITION ${car.cond}%</span><div class="bar"><i style="width:${car.cond}%;background:#3ddc5a"></i></div></div>` +
      bars.map(([n, p, v]) => `<div class="cc-row"><span class="lab">${n}</span><div class="bar"><i style="width:${p}%;background:#ffc93c"></i></div><span>${v}</span></div>`).join('') +
      `<div class="cc-row"><span class="lab">CHIPS</span><span class="grn">\u2713 TUNE</span> <span>PLATING</span> <span>NITRO</span></div>`;
  }
  setStarted(v) {
    this.started = v;
    $('#hud').classList.toggle('hidden', !v);
    $('#start').classList.toggle('hidden', v);
  }
  setGarage(open) {
    this.garageOpen = open;
    $('#garage').classList.toggle('hidden', !open);
    $('#garage').classList.toggle('on', open);
    if (open) { $('#hud').classList.add('hidden'); }
    else if (this.started) { $('#hud').classList.remove('hidden'); }
  }
  setMap(open) {
    this.mapOpen = open;
    $('#screen-map').classList.toggle('hidden', !open);
    if (open) { $('#hud').classList.add('hidden'); this.drawBigMap(); }
    else if (this.started && !this.garageOpen) { $('#hud').classList.remove('hidden'); }
  }
  setPaused(p) {
    $('#pause-panel').classList.toggle('hidden', !p);
  }
  toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.add('hidden'), ms);
  }
  setPopup(html) {
    const p = $('#popup');
    if (!html) { p.classList.add('hidden'); return; }
    p.innerHTML = html; p.classList.remove('hidden');
  }
  // Full HUD refresh from game state (called every frame; cheap DOM writes only on change).
  update(s) {
    if (!this.started || this.garageOpen || this.mapOpen) return;
    const o = s.objective;
    $('#m-kicker').textContent = `MISSION ${o.chapter ? '' : ''}${s.missionIndex + 1} \u00b7 ${o.title}`;
    $('#m-title').textContent = o.displayTitle || o.obj.toUpperCase().slice(0, 26);
    $('#m-obj').textContent = o.obj;
    $('#m-stage').textContent = `STAGE ${o.stage}/${o.stageMax}`;
    $('#m-stagebar').style.width = (o.stage / o.stageMax * 100) + '%';
    $('#m-timer').textContent = o.timer > 0 ? '\u23F1 ' + fmtTimer(o.timer) : '';
    $('#m-next').innerHTML = `NEXT &nbsp;${o.next}`;
    // police panel
    const rows = s.policeRows.slice(0, 6);
    $('#p-count').textContent = `${rows.length} UNITS`;
    $('#p-rows').innerHTML = rows.map((r) =>
      `<div class="p-row"><span class="u">${r.name}</span><span class="tag ${r.tag}">${r.tag}</span><span class="d">${r.dist} m</span></div>`).join('');
    $('#p-foot').textContent = s.policeFoot;
    // top right
    $('#t-money').textContent = fmtMoney(s.money);
    const stars = Array.from({ length: 5 }, (_, i) => `<span class="${i < s.wanted ? '' : 'off'}">\u2605</span>`).join('');
    $('#t-stars').innerHTML = stars;
    $('#t-status').textContent = s.wanted === 0 ? 'CLEAN' : s.wanted >= 3 ? 'IN SIGHT' : 'WANTED';
    $('#t-status').style.color = s.wanted === 0 ? '#3ddc5a' : '#ff5a5a';
    $('#t-day').textContent = `DAY ${s.day} \u00b7 ${s.clock}`;
    $('#t-rankname').textContent = `RANK ${s.rank} \u00b7 ${s.rankName}`;
    $('#t-rp').textContent = `${s.rp.toLocaleString('en-US')} / ${s.rpMax.toLocaleString('en-US')} RP`;
    $('#t-rpbar').style.width = (s.rp / s.rpMax * 100) + '%';
    $('#t-respect').textContent = `RESPECT LV ${s.respectLv} \u00b7 ${s.respect} / ${s.respectMax}`;
    $('#airunit').style.display = s.heliVisible ? '' : 'none';
    $('#airunit').innerHTML = `<span class="dot">\u25CF</span> AIR UNIT &middot; HELI 1 &mdash; ${s.heliState === 'hover' ? 'HOVER' : 'TRACKING'}`;
    // health
    $('#h-hp').style.width = s.health + '%';
    $('#h-hp-n').textContent = Math.round(s.health);
    $('#h-ar').style.width = s.armour + '%';
    $('#h-ar-n').textContent = Math.round(s.armour);
    // minimap district
    $('#mm-dist').textContent = s.district.name;
    $('#mm-street').textContent = s.street;
    $('#mm-stand').textContent = `${s.district.standing} \u00b7 ${s.district.grip}`;
    // dialogue
    const sp = s.speaker;
    $('#d-name').textContent = `${sp.name} \u00b7 CREW \u00b7 ${sp.role}`;
    $('#d-line').textContent = `\u201C${o.line}\u201D`;
    drawPortrait($('#dlg-portrait'), { skin: sp.skin, hair: sp.hair, hairStyle: sp.hairStyle, shirt: sp.shirt });
    // radio + speed
    const np = s.radio;
    $('#radio-line').innerHTML = `\u266A ${np.station} &mdash; \u201C${np.title}\u201D &mdash; ${np.artist}${np.playing ? '' : ' &middot; PAUSED'}`;
    if (s.driving) {
      $('#s-car').textContent = s.driving.name;
      $('#s-num').textContent = Math.round(Math.abs(s.driving.speed) * 3.6);
      $('#s-cond-n').textContent = s.driving.cond + '%';
      $('#s-condbar').style.width = s.driving.cond + '%';
    } else {
      $('#s-car').textContent = 'ON FOOT';
      $('#s-num').textContent = Math.round(s.playerSpeed * 3.6);
      $('#s-cond-n').textContent = '\u2014';
      $('#s-condbar').style.width = '0%';
    }
    // minimap at ~10 Hz
    if (++this._mmTick % 6 === 0) this.drawMinimap(s);
  }
  drawMinimap(s) {
    const cv = $('#minimap');
    if (!cv) return;
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#1d3a4d'; g.fillRect(0, 0, W, H);
    const sc = W / 340;
    const cx = W / 2 - s.playerPos.x * sc, cy = H / 2 - s.playerPos.z * sc;
    // districts
    for (const d of DISTRICTS) {
      g.fillStyle = d.color + 'aa';
      g.fillRect(cx + d.x0 * sc, cy + d.z0 * sc, (d.x1 - d.x0) * sc, (d.z1 - d.z0) * sc);
    }
    // roads
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
    for (const v of [-96, -64, -32, 0, 32, 64, 96]) {
      g.beginPath(); g.moveTo(cx + v * sc, 0); g.lineTo(cx + v * sc, H); g.stroke();
      g.beginPath(); g.moveTo(0, cy + v * sc); g.lineTo(W, cy + v * sc); g.stroke();
    }
    // sea
    g.fillStyle = '#3a7a9a'; g.fillRect(0, 0, Math.max(0, cx - 160 * sc), H);
    // police dots
    g.fillStyle = '#ff5a5a';
    for (const p of s.copDots || []) { g.beginPath(); g.arc(cx + p.x * sc, cy + p.z * sc, 3, 0, 7); g.fill(); }
    // heli icon
    if (s.heliVisible && s.heliPos) {
      g.strokeStyle = '#fff'; g.lineWidth = 2;
      const hx = cx + s.heliPos.x * sc, hy = cy + s.heliPos.z * sc;
      g.beginPath(); g.moveTo(hx - 6, hy); g.lineTo(hx + 6, hy); g.moveTo(hx, hy - 6); g.lineTo(hx, hy + 6); g.stroke();
    }
    // player arrow
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(Math.atan2(Math.sin(s.facing), Math.cos(s.facing)) * 0 + s.facing);
    g.fillStyle = '#ffc93c';
    g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 6); g.lineTo(0, 3); g.lineTo(-5, 6); g.closePath(); g.fill();
    g.restore();
    // north tick
    g.fillStyle = '#fff'; g.font = 'bold 11px Arial'; g.fillText('N', W / 2 - 4, 12);
  }
  drawBigMap() {
    const cv = $('#bigmap');
    if (!cv) return;
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#2c4258'; g.fillRect(0, 0, W, H);
    const sc = W / 360;
    const ox = 20, oy = 10;
    // sea + beach
    g.fillStyle = '#41658a'; g.fillRect(0, 0, ox + (-120 + 160) * sc, H);
    g.fillStyle = '#d9b98a'; g.fillRect(ox + (-120 + 160) * sc, 0, 14, H);
    // districts
    for (const d of DISTRICTS) {
      g.fillStyle = d.color;
      g.globalAlpha = 0.85;
      g.fillRect(ox + (d.x0 + 160) * sc, oy + (d.z0 + 160) * sc, (d.x1 - d.x0) * sc - 2, (d.z1 - d.z0) * sc - 2);
      g.globalAlpha = 1;
      g.fillStyle = '#fff'; g.font = '900 18px Arial';
      g.fillText(d.name, ox + (d.x0 + 160) * sc + 8, oy + (d.z0 + 160) * sc + 26);
      g.font = '14px Arial'; g.fillStyle = '#e8e8e8';
      g.fillText(`${d.standing} \u00b7 ${d.pct}%`, ox + (d.x0 + 160) * sc + 8, oy + (d.z0 + 160) * sc + 46);
    }
    // roads
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
    for (const v of [-96, -64, -32, 0, 32, 64, 96]) {
      const px = ox + (v + 160) * sc;
      g.beginPath(); g.moveTo(px, oy); g.lineTo(px, oy + 320 * sc); g.stroke();
      g.beginPath(); g.moveTo(ox, oy + (v + 160) * sc); g.lineTo(ox + 320 * sc, oy + (v + 160) * sc); g.stroke();
    }
    // race route
    g.strokeStyle = '#ff5a7a'; g.lineWidth = 5; g.setLineDash([8, 6]);
    g.beginPath();
    g.moveTo(ox + (0 + 160) * sc, oy + (96 + 160) * sc);
    g.lineTo(ox + (0 + 160) * sc, oy + (0 + 160) * sc);
    g.lineTo(ox + (96 + 160) * sc, oy + (0 + 160) * sc);
    g.stroke(); g.setLineDash([]);
    // markers
    const marks = [['H', ox + (16 + 160) * sc, oy + (16 + 160) * sc, '#3ddc5a'], ['G', ox + (64 + 160) * sc, oy + (64 + 160) * sc, '#ffc93c'], ['D', ox + (-48 + 160) * sc, oy + (48 + 160) * sc, '#ff5a7a'], ['R', ox + (96 + 160) * sc, oy + (0 + 160) * sc, '#35d0d8'], ['P', ox + (-64 + 160) * sc, oy + (-32 + 160) * sc, '#b8c4d0']];
    for (const [t, x, y, c] of marks) {
      g.fillStyle = c; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
      g.fillStyle = '#111'; g.font = '900 12px Arial'; g.textAlign = 'center'; g.fillText(t, x, y + 4); g.textAlign = 'left';
    }
    // player arrow
    g.fillStyle = '#ffc93c';
    g.beginPath(); g.moveTo(ox + (30 + 160) * sc, oy + (-40 + 160) * sc - 9); g.lineTo(ox + (30 + 160) * sc + 7, oy + (-40 + 160) * sc + 6); g.lineTo(ox + (30 + 160) * sc - 7, oy + (-40 + 160) * sc + 6); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.font = '900 13px Arial';
    g.fillText('MILO', ox + (30 + 160) * sc + 10, oy + (-40 + 160) * sc + 4);
  }
}
