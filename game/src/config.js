// MARISOL BAY — config + world data (fresh, written from the design specs).
// Original IP only: own city, names, story, stations, cars, crew.
export const CFG = {
  cityHalf: 160,
  roadGap: 32,          // avenues/streets every 32 m
  roadWidth: 10,
  dusk: { skyTop: 0x5a3d8a, skyMid: 0xc65b7c, skyLow: 0xff9a5c, sun: 0xffb36b, fog: 0x9a6a8d, hemiSky: 0xffb08a, hemiGround: 0x5a4a60, sunI: 2.6, hemiI: 2.1, ambI: 0.7, lift: 1.9 },
  day: { skyTop: 0x3f8fd2, skyMid: 0x9fd4ef, skyLow: 0xffe9b0, sun: 0xfff2c0, fog: 0xa8c8de, hemiSky: 0xbfe3ff, hemiGround: 0x5a5248, sunI: 2.2, hemiI: 1.4, ambI: 0.45, lift: 1.0 },
  heli: { triggerWanted: 3, leaveDelaySec: 2.0, orbitRadius: 26, orbitHeight: 20, orbitSpeed: 0.45, arriveSpeed: 14, bankAngle: 0.28, rotorSpeed: 28 },
  playerStart: { x: 30, z: -40, facing: 0 },
  parkedSport: { x: 33, z: -42, facing: 0 }, // red SOLARA GT, ~1.5 m from the playtest teleport spot
};

export const DISTRICTS = [
  { id: 'old-cannery', name: 'OLD CANNERY', pct: 34, x0: -160, z0: -160, x1: -32, z1: -32, color: '#b06a3b', standing: 'NEUTRAL', grip: 34 },
  { id: 'sundial', name: 'SUNDIAL SQUARE', pct: 61, x0: -32, z0: -160, x1: 32, z1: -32, color: '#c9a13b', standing: 'FRIENDLY', grip: 61 },
  { id: 'palm-heights', name: 'PALM HEIGHTS', pct: 22, x0: 32, z0: -160, x1: 160, z1: -32, color: '#4f9d6b', standing: 'NEUTRAL', grip: 22 },
  { id: 'lantern-mile', name: 'LANTERN MILE', pct: 73, x0: -160, z0: -32, x1: -32, z1: 32, color: '#7a5fb0', standing: 'FRIENDLY', grip: 73 },
  { id: 'downtown', name: 'DOWNTOWN', pct: 58, x0: -32, z0: -32, x1: 32, z1: 32, color: '#3b7ec9', standing: 'NEUTRAL', grip: 58 },
  { id: 'marina-row', name: 'MARINA ROW', pct: 47, x0: 32, z0: -32, x1: 160, z1: 32, color: '#3ba8a0', standing: 'NEUTRAL', grip: 47 },
  { id: 'saltflats', name: 'SALTFLATS PORT', pct: 18, x0: -160, z0: 32, x1: -32, z1: 160, color: '#8a7a5a', standing: 'HOSTILE', grip: 18 },
  { id: 'seaglass', name: 'SEAGLASS BEACH', pct: 82, x0: 32, z0: 32, x1: 160, z1: 160, color: '#e08a3b', standing: 'FRIENDLY', grip: 82 },
];
export function districtAt(x, z) {
  for (const d of DISTRICTS) if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return d;
  return DISTRICTS[4];
}

export const CREW = [
  { id: 'mira', name: 'MIRA KESANG', role: 'DRIVER', ability: 'SWAP PLATES', key: 'Z', skin: '#c98d5f', hair: '#1c1c22', hairStyle: 'bob', shirt: '#2fae8f', desc: 'Swaps your plates — drops 1 wanted star.' },
  { id: 'lio', name: 'LIO', role: 'MECHANIC', ability: 'QUICK FIX', key: 'X', skin: '#8a5a3b', hair: '#2a2a2a', hairStyle: 'cap', shirt: '#e8a13c', desc: 'Field repair — restores 40 condition on the spot.' },
  { id: 'kiki', name: 'KIKI', role: 'LOOKOUT', ability: 'EYES OUT', key: 'C', skin: '#d9a06b', hair: '#3a2a1a', hairStyle: 'bun', shirt: '#b05fb0', desc: 'Spots the patrols — shows every unit on the minimap.' },
];

export const MISSIONS = [
  { id: 1, title: 'GOLD PAINT', displayTitle: 'STEAL THE COUPE', chapter: 'ACT I', obj: 'Steal the gold-painted coupe from the marina lot', next: 'Bring it to Hillside Garage', speaker: 'mira', line: 'Gold paint, no plates, one guard asleep. Easy money, Milo.' },
  { id: 2, title: 'MARKET SQUEEZE', displayTitle: 'CLEAR THE AISLES', chapter: 'ACT I', obj: 'Clear the Kerono crew from the market', next: 'Melt away before the patrol arrives', speaker: 'kiki', line: 'Two down the left aisle! I have got the stall side, Milo.' },
  { id: 3, title: 'DOWNTOWN HEAT', displayTitle: 'LOSE THE PATROL', chapter: 'ACT II', obj: 'Lose the patrol on the downtown streets', next: 'Vanish through the Lantern Mile alleys', speaker: 'mira', line: 'Four units on your tail, Milo — lose them through the towers, do not stop for anything.' },
  { id: 4, title: 'SALT & SIRENS', displayTitle: 'OUTRUN THE HEAT', chapter: 'ACT II', obj: 'Outrun the heat along Marina Row', next: 'Lose the heat, then meet Pilar', speaker: 'lio', line: 'Every cruiser in the bay wants that red coupe. Forty seconds on the parade, then you vanish.' },
  { id: 5, title: 'PARADE LAP', displayTitle: 'MEET PILAR', chapter: 'ACT II', obj: 'Meet Pilar at Dockside Customs', next: 'Win the Seaglass Sprint', speaker: 'kiki', line: 'Pilar is waiting at the docks. Do not keep a mechanic waiting.' },
  { id: 6, title: 'DOCKSIDE AMBUSH', displayTitle: 'CLEAR THE DOCKS', chapter: 'ACT III', obj: 'Clear the Tiburones from the docks', next: 'Take Marco\u2019s van', speaker: 'lio', line: 'Three left by their van. Keep that Mako singing, Milo.' },
  { id: 7, title: 'TERRACE CLIMB', displayTitle: 'WIN THE RACE', chapter: 'ACT III', obj: 'Win the street race up the Terrace Climb', next: 'Collect the payout at the safehouse', speaker: 'mira', line: '0.79 km, all uphill. Do not brake for the hairpin.' },
  { id: 8, title: 'GOLDEN HOUR', displayTitle: 'LOSE THE MANHUNT', chapter: 'ACT III', obj: 'Lose the manhunt before the boat sails', next: 'Reach the boat at the pier', speaker: 'kiki', line: 'The boat sails in two minutes. Shake that chopper and get to the pier!' },
];

export const WEAPONS = [
  { key: '1', name: 'FISTS', ammo: '\u221e', owned: true },
  { key: '2', name: 'P9', ammo: '12', owned: true },
  { key: '3', name: 'SMG', ammo: '30/60', owned: true },
  { key: '4', name: '12G', ammo: '18', owned: true },
  { key: '5', name: 'AR-9', ammo: '—', owned: false, price: '$3,800' },
  { key: '6', name: 'RPG', ammo: '—', owned: false, price: '$9,000' },
];

export const UPGRADES = [
  { name: 'FULL REPAIR', price: 250, status: 'OWNED', fx: 'Condition 64% \u2192 100%' },
  { name: 'RESPRAY', price: 400, status: '', fx: 'Change paint (pick a colour)' },
  { name: 'STAGE 2 TUNE', price: 1200, status: 'OWNED', fx: 'Top speed +12%' },
  { name: 'ARMOUR PLATING', price: 3600, status: '', fx: 'Every car takes half damage' },
  { name: 'NITRO KIT', price: 900, status: 'LOCKED \u00b7 LV 6', fx: 'Boost for 3 seconds' },
  { name: 'SUSPENSION', price: 700, status: '', fx: 'Handling +15%' },
  { name: 'BRAKES', price: 500, status: '', fx: 'Braking distance \u221220%' },
  { name: 'WEAPON MOUNT', price: 1500, status: 'LOCKED', fx: 'Mount a gun on the car' },
  { name: 'TURBO', price: 1100, status: 'LOCKED', fx: 'Acceleration +18%' },
  { name: 'NEON KIT', price: 350, status: '', fx: 'Underglow lights' },
];
export const GEAR = [
  { name: 'RATTLER SMG', price: 0, status: 'OWNED' },
  { name: 'TIDEBREAKER', price: 0, status: 'OWNED' },
  { name: 'HARRIER LR', price: 6800, status: '' },
  { name: 'FLARE CHARGES X3', price: 600, status: '' },
  { name: 'AMMO, ALL GUNS', price: 200, status: '' },
  { name: 'BODY ARMOUR', price: 350, status: '' },
];

export const CARS = [
  { name: 'KITE COUPE', cls: 'SPORT', color: 0xe8362a, top: 186, acc: 7.2, armour: 60, handling: 81, cond: 84 },
  { name: 'SOLARA GT', cls: 'SPORT', color: 0xd21f2b, top: 192, acc: 6.8, armour: 58, handling: 84, cond: 100 },
  { name: 'PALMA CABRIO', cls: 'CONVERTIBLE', color: 0xe86a7a, top: 164, acc: 8.1, armour: 45, handling: 76, cond: 100 },
  { name: 'SUNLINE CAB', cls: 'SEDAN', color: 0xf2b705, top: 148, acc: 9.4, armour: 40, handling: 70, cond: 92 },
];
