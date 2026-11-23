/* Angela's Quest: an 8-bit wedding card.
   Everything is drawn with tiny rectangles on a 240x160 canvas, then scaled up. */
(() => {
'use strict';

const W = 240, H = 160;
const screen = document.getElementById('screen');
const ctx = screen.getContext('2d');
ctx.imageSmoothingEnabled = false;
let C = ctx; // the context we're currently drawing into (swapped while pre-rendering)

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const lerp = (a, b, k) => a + (b - a) * k;

// ------------------------------------------------------------------ drawing helpers
function R(x, y, w, h, c) {
  C.fillStyle = c;
  C.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function bmp(rows, x, y, pal, s = 1) {
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch === '.') continue;
      const col = typeof pal === 'string' ? pal : pal[ch];
      if (col) R(x + i * s, y + j * s, s, s, col);
    }
  }
}
function layer(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const prev = C;
  C = c.getContext('2d');
  C.imageSmoothingEnabled = false;
  fn();
  C = prev;
  return c;
}
function drawLoop(img, off) {
  const o = Math.round(((off % W) + W) % W);
  C.drawImage(img, -o, 0);
  C.drawImage(img, W - o, 0);
}
function sky(cols, y0, y1) {
  const n = cols.length, bh = (y1 - y0) / n;
  for (let i = 0; i < n; i++) R(0, y0 + i * bh, W, Math.ceil(bh) + 1, cols[i]);
  for (let i = 1; i < n; i++) {
    const y = Math.round(y0 + i * bh);
    for (let x = 0; x < W; x += 2) { R(x, y - 1, 1, 1, cols[i]); R(x + 1, y, 1, 1, cols[i - 1]); }
  }
}
function cloud(x, y, c = '#ffffff', sh = '#dcefff', s = 1) {
  R(x + 5 * s, y, 9 * s, 3 * s, c); R(x + 2 * s, y + 2 * s, 17 * s, 3 * s, c); R(x, y + 4 * s, 22 * s, 3 * s, c); R(x + s, y + 7 * s, 20 * s, s, sh);
}

// ------------------------------------------------------------------ little bitmaps
const HEART7 = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const HEART5 = ['.X.X.', 'XXXXX', '.XXX.', '..X..'];
const EXCL = ['.KKKKK.', 'KWWRWWK', 'KWWRWWK', 'KWWRWWK', 'KWWWWWK', 'KWWRWWK', '.KKKKK.', '..KK...', '..K....'];
const LOVEB = ['.KKKKKKK.', 'KWWWWWWWK', 'KWRRWRRWK', 'KWRRRRRWK', 'KWWRRRWWK', 'KWWWRWWWK', '.KKKKKKK.', '..KK.....', '..K......'];
const ENVELOPE = [
  'BBBBBBBBBBBBBBB',
  'BPWWWWWWWWWWWPB',
  'BWPWWWWWWWWWPWB',
  'BWWPWWWWWWWPWWB',
  'BWWWPWWWWWPWWWB',
  'BWWWWPRWRPWWWWB',
  'BWWWWWRRRWWWWWB',
  'BWWWWWWRWWWWWWB',
  'BWWWWWWWWWWWWWB',
  'BBBBBBBBBBBBBBB',
];

// ------------------------------------------------------------------ people
const SKIN = '#f8d5b8', EYE = '#2a1d2e', MOUTH = '#d0607a', BLUSH = '#f7a1b0', WHITE = '#ffffff';

const ANGELA = {
  seed: 0.3, bw: 8, torso: 8, legs: 7,
  hair: 'long', hairC: '#7a4a2a', hairHi: '#a26a44', eyes: 'big',
  shirtC: '#ff9ec4', dressC: '#ff9ec4', hemC: '#ffd1e3', pantsStyle: 'dress', shortSleeve: true, shoeC: '#c8467a',
};
const ANGELA_WED = {
  ...ANGELA, shirtC: '#ffffff', sleeveC: '#ffffff', shortSleeve: true, deco: 'gown', beltC: '#e6e6f2', pantsStyle: 'gown',
  dressC: '#ffffff', hemC: '#eef0fa', sparkleC: '#cfdcff', shoeC: '#ffffff', veil: true, bouquet: true, earrings: true,
};
const NIELSEN = {
  seed: 1.7, bw: 8, torso: 8, legs: 8,
  hair: 'spiky', hairC: '#141414', glasses: true, glassStyle: 'horn', glassC: '#5a3418',
  shirtC: '#9cc9f0', collarC: '#ffffff', deco: 'collar', belt: true,
  pantsStyle: 'trousers', pantsC: '#3c4a6b', shoeC: '#5a3a26',
};

const SON_A = { // Angela's older boy: tight black Nike tee + muay thai shorts
  seed: 2.9, bw: 6, torso: 6, legs: 5,
  hair: 'spiky', hairC: '#2e2220', shirtC: '#161616', deco: 'swoosh', shortSleeve: true,
  pantsStyle: 'muay', pantsC: '#d8263a', bandC: '#ffd23f', shoeC: '#f0f0f0',
};
const DAU_A = { // Angela's girl: sporty netball star
  seed: 0.9, bw: 6, torso: 5, legs: 4,
  hair: 'pony', hairC: '#5a3424', tieC: '#ff5a8a', headband: '#ff5a8a',
  shirtC: '#2ec4b6', deco: 'bib', shortSleeve: true, pantsStyle: 'shorts', pantsC: '#1f3a6b', shoeC: '#ffffff',
};
const DAU_N = { // Nielsen's older bespectacled girl
  seed: 2.2, bw: 6, torso: 6, legs: 5,
  hair: 'long', hairC: '#231b1c', hairHi: '#3a2c2e', glasses: true, glassStyle: 'round', glassC: '#7a3fb0',
  shirtC: '#b99cf2', deco: 'cardigan', pantsStyle: 'skirt', pantsC: '#5d4aa3', shoeC: '#3a2a40', prop: 'book',
};
const SON_N = { // Nielsen's boy
  seed: 3.4, bw: 6, torso: 5, legs: 4,
  hair: 'boy', hairC: '#231b1c', cap: '#3b8fe0',
  shirtC: '#ffb347', deco: 'stripes', stripeC: '#ff8a3d', shortSleeve: true,
  pantsStyle: 'shorts', pantsC: '#4a5a7a', shoeC: '#e2463a',
};

const ROBE = { shirtC: '#ffd1e3', sleeveC: '#ffd1e3', shortSleeve: false, deco: 'robe', pantsStyle: 'dress', dressC: '#ffd1e3', hemC: '#ffffff', shoeC: '#ffffff' };
const GOWN = {
  shirtC: '#1f4fbf', dressC: '#1f4fbf', hemC: '#2f62d6', sparkleC: '#9fc0ff', beltC: '#151515', shortSleeve: true, deco: 'gown',
  pantsStyle: 'gown', shoeC: '#ffd23f', earrings: true, lips: '#c2185b',
};
const ANGELA_WORK = { ...ANGELA, ...GOWN };
const NIELSEN_SUIT = {
  ...NIELSEN, shirtC: '#2e3b63', sleeveC: '#2e3b63', deco: 'suit', tieC: '#e2466f', tieC2: '#ff7aa8', lapelC: '#1e2848',
  belt: false, pantsC: '#2e3b63', shoeC: '#1a1a1a', prop: 'kopi',
};
const NIELSEN_SUIT_NOKOPI = { ...NIELSEN_SUIT, prop: null };
const NIELSEN_WED = { ...NIELSEN_SUIT, prop: null, shirtC: '#1e1e2a', sleeveC: '#1e1e2a', pantsC: '#1e1e2a', lapelC: '#000000' };
const NIELSEN_BIKER = { ...NIELSEN, shirtC: '#1c1c1c', sleeveC: '#1c1c1c', deco: 'biker', belt: true, pantsC: '#35588a', shoeC: '#111111' };
// colleagues and family members
const CW = [
  { seed: 1.1, bw: 8, torso: 8, legs: 7, hair: 'bob', hairC: '#3a2a20', shirtC: '#ffcf6b', pantsStyle: 'trousers', pantsC: '#4a4a5a', shoeC: '#333' },
  { seed: 2.4, bw: 8, torso: 8, legs: 8, hair: 'short', hairC: '#1a1a1a', glasses: true, glassC: '#333', shirtC: '#7fd1ae', collarC: '#ffffff', deco: 'collar', pantsStyle: 'trousers', pantsC: '#3a4a5a', shoeC: '#333' },
  { seed: 3.7, bw: 8, torso: 8, legs: 7, hair: 'pony', hairC: '#8a4a2a', tieC: '#ffd23f', shirtC: '#c3a6ff', pantsStyle: 'trousers', pantsC: '#4a3a6a', shoeC: '#333' },
];
const FAMILY = [
  { seed: 0.5, bw: 8, torso: 8, legs: 7, hair: 'curly', hairC: '#c8402a', hairHi: '#e8684a', shirtC: '#7fc8a9', shortSleeve: true, pantsStyle: 'dress', dressC: '#7fc8a9', hemC: '#a8e0c8', shoeC: '#a85a3a' },
  { seed: 1.6, bw: 8, torso: 8, legs: 8, hair: 'bald', hairC: '#c8c8d0', glasses: true, glassC: '#555', shirtC: '#3b7fd6', collarC: '#ffffff', deco: 'collar', belt: true, pantsStyle: 'trousers', pantsC: '#4a4a5a', shoeC: '#3a2a20' },
  { seed: 2.1, bw: 8, torso: 8, legs: 7, hair: 'bob', hairC: '#2a1d1d', shirtC: '#ff9fb0', shortSleeve: true, pantsStyle: 'dress', dressC: '#ff9fb0', hemC: '#ffc8d4', shoeC: '#c8467a' },
  { seed: 2.8, bw: 8, torso: 8, legs: 8, hair: 'short', hairC: '#222', shirtC: '#f4f4f8', collarC: '#cfd8e6', deco: 'collar', belt: true, pantsStyle: 'trousers', pantsC: '#2e3550', shoeC: '#222' },
  { seed: 3.3, bw: 8, torso: 8, legs: 7, hair: 'pony', hairC: '#4a2a1a', tieC: '#ff5a8a', shirtC: '#c3a6ff', shortSleeve: true, pantsStyle: 'dress', dressC: '#c3a6ff', hemC: '#ddd0ff', shoeC: '#7a3fb0' },
  { seed: 4.2, bw: 8, torso: 8, legs: 8, hair: 'spiky', hairC: '#2a2020', glasses: true, glassC: '#2a6fc0', shirtC: '#e2766a', collarC: '#ffffff', deco: 'collar', belt: true, pantsStyle: 'trousers', pantsC: '#3a3a4a', shoeC: '#222' },
];

function drawPerson(p, x, feetY, o = {}) {
  const t = o.t || 0, s = o.s || 2;
  const { bw, torso, legs } = p;
  const hw = bw / 2;
  const total = 10 + torso + legs + 1;
  const step = o.walk ? Math.floor(t * 7 + p.seed * 3) % 2 : 0;
  let yo = o.walk && step ? -1 : 0;
  if (o.hop) yo -= Math.round(Math.max(0, Math.sin(t * 7 + (o.phase || 0))) * 5);
  if (o.bob) yo += Math.round(Math.sin(t * 2 + p.seed) * 0.6);

  C.save();
  C.translate(Math.round(x), Math.round(feetY + (yo - total) * s));
  C.scale((o.face || 1) < 0 ? -s : s, s);

  const hb = 10, lt = hb + torso;
  const hc = p.hairC;

  if (p.veil) R(-8, -1, 16, 26, 'rgba(255,255,255,0.7)');
  // --- back hair
  if (p.hair === 'long') {
    R(-6, 2, 12, 12 + Math.min(torso, 6), hc);
    if (o.flutter) { const f = Math.floor(t * 14) % 3; R(-8 - f, 4 + f, 2, 6, hc); R(-9 + f, 10, 2, 5 - f, hc); R(-7, 15 + f, 1, 3, hc); }
  }
  if (p.hair === 'pony') {
    R(-8, 1, 3, 3, hc); R(-9, 3, 3, 5, hc); R(-8, 8, 2, 1, hc); R(-6, 1, 1, 2, p.tieC);
  }

  // --- legs & shoes
  const lw = Math.max(2, hw - 1);
  const spread = o.walk ? (step ? 0 : 1) : 0;
  const x1 = -lw - spread, x2 = spread;
  const legC = p.pantsStyle === 'trousers' ? p.pantsC : SKIN;
  R(x1, lt, lw, legs, legC); R(x2, lt, lw, legs, legC);
  R(x1, lt + legs, lw + 1, 1, p.shoeC); R(x2, lt + legs, lw + 1, 1, p.shoeC);
  switch (p.pantsStyle) {
    case 'shorts': R(-hw, lt, bw, 3, p.pantsC); break;
    case 'skirt': R(-hw - 1, lt, bw + 2, 3, p.pantsC); R(-hw - 1, lt + 2, bw + 2, 1, '#4a3a8a'); break;
    case 'muay':
      R(-hw - 1, lt, bw + 2, 3, p.pantsC);
      R(-hw - 1, lt, bw + 2, 1, p.bandC);
      R(-hw - 1, lt + 1, 1, 2, WHITE); R(hw, lt + 1, 1, 2, WHITE);
      R(-1, lt + 1, 2, 1, p.bandC);
      break;
    case 'dress':
      for (let i = 0; i < legs - 2; i++) R(-hw - (i >> 1), lt + i, bw + 2 * (i >> 1), 1, p.dressC);
      R(-hw - ((legs - 3) >> 1), lt + legs - 3, bw + 2 * ((legs - 3) >> 1), 1, p.hemC);
      break;
    case 'gown':
      for (let i = 0; i < legs; i++) R(-hw - (i >> 1), lt + i, bw + 2 * (i >> 1), 1, p.dressC);
      R(-hw - ((legs - 1) >> 1), lt + legs - 1, bw + 2 * ((legs - 1) >> 1), 1, p.hemC);
      if (Math.floor(t * 3) % 2) { R(-2, lt + 2, 1, 1, p.sparkleC); R(2, lt + 4, 1, 1, p.sparkleC); }
      else { R(1, lt + 1, 1, 1, p.sparkleC); R(-3, lt + 5, 1, 1, p.sparkleC); }
      break;
    case 'sarong':
      R(-hw, lt, bw, legs, p.dressC);
      for (let i = 0; i < legs; i += 2) {
        R(-hw + (i % 4 ? 1 : 4), lt + i, 1, 1, p.dotC);
        R(-hw + (i % 4 ? 5 : 2), lt + i + 1, 1, 1, p.dot2C);
      }
      break;
  }
  if (p.belt) R(-hw, lt, bw, 1, '#3a2a20');

  // --- torso
  R(-hw, hb, bw, torso, p.shirtC);
  switch (p.deco) {
    case 'collar': {
      const cc = p.collarC;
      R(-hw + 1, hb, 2, 1, cc); R(hw - 3, hb, 2, 1, cc);
      R(-hw + 2, hb + 1, 1, 1, cc); R(hw - 3, hb + 1, 1, 1, cc);
      R(-1, hb, 2, 1, SKIN);
      for (let i = 3; i < torso - 1; i += 2) R(-1, hb + i, 1, 1, cc);
      if (p.bowtie) { R(-2, hb, 4, 2, '#e2466f'); R(-1, hb, 2, 2, '#b8304f'); R(hw - 3, hb + 2, 2, 2, '#ff7aa8'); }
      break;
    }
    case 'swoosh':
      R(-2, hb + 2, 1, 1, WHITE); R(-1, hb + 3, 1, 1, WHITE); R(0, hb + 2, 1, 1, WHITE); R(1, hb + 1, 1, 1, WHITE);
      break;
    case 'bib':
      R(-2, hb + 1, 4, 3, WHITE); R(-1, hb + 1, 2, 1, '#ff5a8a'); R(-1, hb + 2, 1, 1, '#ff5a8a'); R(-1, hb + 3, 2, 1, '#ff5a8a');
      break;
    case 'cardigan':
      R(-2, hb, 4, 1, WHITE); R(-1, hb + 1, 2, 1, WHITE);
      for (let i = 2; i < torso; i += 2) R(0, hb + i, 1, 1, '#ffe14d');
      break;
    case 'stripes':
      for (let i = 1; i < torso; i += 2) R(-hw, hb + i, bw, 1, p.stripeC);
      break;
    case 'biker':
      R(-2, hb, 4, 1, '#2a2a2a'); R(0, hb + 1, 1, torso - 1, '#9a9a9a'); R(-hw, hb + 3, 2, 1, '#e2702a'); R(hw - 2, hb + 3, 2, 1, '#e2702a');
      break;
    case 'robe':
      R(-2, hb, 1, 4, WHITE); R(1, hb, 1, 4, WHITE); R(-1, hb, 2, 2, SKIN);
      R(-hw, hb + torso - 2, bw, 1, '#ff7aa8'); R(1, hb + torso - 2, 2, 2, '#ff7aa8');
      break;
    case 'gown':
      R(-1, hb, 2, 1, SKIN); R(-hw, hb + torso - 2, bw, 1, p.beltC || '#a83560'); R(-1, hb + torso - 2, 2, 1, '#ffd23f');
      break;
    case 'suit':
      R(-2, hb, 4, 1, WHITE); R(-2, hb + 1, 1, 2, WHITE); R(1, hb + 1, 1, 2, WHITE);
      R(-1, hb, 2, 1, p.tieC); R(-1, hb + 1, 2, 5, p.tieC); R(-1, hb + 2, 2, 1, p.tieC2);
      R(-3, hb, 1, 4, p.lapelC); R(2, hb, 1, 4, p.lapelC);
      R(-1, hb + torso - 2, 1, 1, '#c9b46a');
      R(hw - 2, hb + 1, 1, 1, WHITE);
      break;
    case 'batik':
      for (let i = 1; i < torso; i += 2) for (let j = -hw + ((i >> 1) % 2); j < hw; j += 3) R(j, hb + i, 1, 1, p.batikC);
      R(-1, hb, 2, 1, SKIN);
      break;
    case 'kebaya':
      R(-hw, hb + torso - 1, bw, 1, '#ffd1e3');
      R(-1, hb + 1, 1, 1, '#ffcc33'); R(-1, hb + 3, 1, 1, '#ffcc33'); R(-1, hb + 5, 1, 1, '#ffcc33');
      R(-3, hb + 2, 1, 1, '#ff7aa8'); R(2, hb + 4, 1, 1, '#ff7aa8'); R(1, hb + 1, 1, 1, '#8fd3a8');
      break;
  }

  // --- arms
  const sleeve = p.sleeveC || p.shirtC;
  const arm = (ax, lift) => {
    R(ax, hb + 1, 1, torso - 2, p.shortSleeve ? SKIN : sleeve);
    if (p.shortSleeve) R(ax, hb, 1, 2, p.shirtC);
    R(ax, hb + torso - 1 + lift, 1, 1, SKIN);
  };
  arm(-hw - 1, o.walk && !step ? -1 : 0);
  if (o.jab && Math.floor(t * 5) % 2) {
    R(hw, hb + 2, 3, 1, SKIN);
    R(hw + 3, hb + 1, 3, 3, '#e23a3a'); R(hw + 3, hb + 1, 1, 1, '#ff8a8a');
  } else if (o.wave && Math.floor(t * 4) % 2) {
    R(hw, hb - 3, 1, 4, p.shortSleeve ? SKIN : sleeve); R(hw, hb - 4, 1, 1, SKIN);
  } else {
    arm(hw, o.walk && step ? -1 : 0);
  }

  // --- props in front of body
  if (p.prop === 'kopi' && o.kopi) {
    for (let k = 0; k < o.kopi; k++) {
      const kx = hw - 1 + k * 3 - (o.kopi - 1), ky = hb + torso - 1;
      R(kx + 1, ky, 1, 2, WHITE);
      R(kx, ky + 2, 3, 4, '#a8682f'); R(kx, ky + 2, 3, 1, '#ead6b8'); R(kx, ky + 5, 3, 1, '#8a5020');
    }
  }
  if (p.bouquet) { R(hw - 2, hb + torso - 4, 4, 3, '#ff8fb8'); R(hw - 1, hb + torso - 4, 1, 1, '#ffffff'); R(hw + 1, hb + torso - 3, 1, 1, '#ffe14d'); R(hw - 1, hb + torso - 1, 2, 2, '#4caf50'); }
  if (p.prop === 'book') { R(hw - 2, hb + 3, 4, 4, '#e2564a'); R(hw - 2, hb + 3, 4, 1, '#fff2d8'); R(hw + 1, hb + 3, 1, 4, '#b8382e'); }

  // --- head
  R(-4, 0, 8, 10, SKIN); R(-5, 1, 10, 8, SKIN);

  // --- front hair
  switch (p.hair) {
    case 'long':
      R(-4, -1, 8, 1, hc); R(-5, 0, 10, 3, hc);
      R(-6, 1, 2, 14, hc); R(4, 1, 2, 14, hc);
      R(-4, 3, 3, 1, hc); R(1, 3, 3, 1, hc);
      R(-3, 0, 3, 1, p.hairHi);
      break;
    case 'short':
      R(-4, -1, 8, 1, hc); R(-5, 0, 10, 2, hc); R(-5, 2, 1, 3, hc); R(4, 2, 1, 2, hc); R(-4, 2, 4, 1, hc);
      break;
    case 'spiky':
      R(-5, 0, 10, 3, hc); R(-4, -1, 2, 1, hc); R(-1, -2, 2, 2, hc); R(2, -1, 2, 1, hc);
      R(-5, 3, 1, 2, hc); R(4, 3, 1, 1, hc); R(1, 3, 3, 1, hc);
      break;
    case 'pony':
      R(-4, -1, 8, 1, hc); R(-5, 0, 10, 3, hc); R(-5, 3, 1, 3, hc); R(4, 3, 1, 2, hc);
      R(-4, 3, 2, 1, hc); R(1, 3, 3, 1, hc);
      break;
    case 'bob':
      R(-5, -1, 10, 1, hc); R(-6, 0, 12, 3, hc); R(-6, 3, 2, 6, hc); R(4, 3, 2, 6, hc); R(-4, 3, 8, 1, hc);
      break;
    case 'boy':
      R(-4, -1, 8, 1, hc); R(-5, 0, 10, 3, hc); R(-5, 3, 1, 2, hc); R(4, 3, 1, 1, hc);
      break;
    case 'bun':
      R(-4, -1, 8, 1, hc); R(-5, 0, 10, 3, hc); R(-5, 3, 1, 3, hc); R(4, 3, 1, 3, hc);
      R(-2, -4, 5, 3, hc); R(-1, -5, 3, 1, hc); R(2, -3, 2, 1, '#ffcc33');
      break;
    case 'curly':
      R(-6, -2, 12, 5, hc); R(-7, 0, 2, 6, hc); R(5, 0, 2, 6, hc); R(-5, -3, 3, 1, hc); R(0, -3, 4, 1, hc);
      R(-4, 3, 2, 1, hc); R(2, 3, 2, 1, hc);
      for (let i = -5; i < 5; i += 3) R(i, -1, 1, 1, p.hairHi);
      break;
    case 'bald':
      R(-5, 3, 1, 3, hc); R(4, 3, 1, 3, hc); R(-2, 1, 2, 1, WHITE);
      break;
    case 'towel':
      R(-6, -3, 12, 6, p.towelC); R(-5, -5, 10, 2, p.towelC); R(-3, -7, 6, 2, p.towelC); R(1, -8, 3, 2, p.towelC2);
      R(-6, 1, 12, 1, p.towelC2); R(-4, -3, 1, 4, p.towelC2); R(2, -5, 1, 4, p.towelC2);
      break;
  }
  if (p.cap) { R(-5, -1, 10, 3, p.cap); R(-4, -2, 8, 1, p.cap); R(3, 1, 4, 1, '#2a6fc0'); R(-1, -2, 2, 1, WHITE); }
  if (p.headband) R(-5, 1, 10, 1, p.headband);
  if (p.veil) { R(-6, -1, 12, 1, 'rgba(255,255,255,0.9)'); R(-7, 0, 1, 20, 'rgba(255,255,255,0.8)'); R(6, 0, 1, 20, 'rgba(255,255,255,0.8)'); R(-2, -2, 4, 1, '#dfe8ff'); R(-1, -3, 2, 1, '#ffffff'); }
  if (p.flower) { R(3, -2, 3, 3, '#ff7aa8'); R(4, -1, 1, 1, '#ffe066'); R(2, 0, 1, 1, '#ffcc33'); R(-4, -1, 1, 1, '#ffcc33'); }

  // --- face
  const blink = ((t + p.seed * 2) % 3.7) < 0.13;
  if (p.eyes === 'big') {
    if (blink) { R(-2, 6, 2, 1, EYE); R(2, 6, 2, 1, EYE); }
    else {
      R(-2, 4, 2, 3, EYE); R(2, 4, 2, 3, EYE);
      R(-2, 4, 1, 1, WHITE); R(2, 4, 1, 1, WHITE);
      R(-3, 4, 1, 1, EYE); R(4, 4, 1, 1, EYE);
    }
    R(-4, 7, 1, 1, BLUSH); R(3, 7, 1, 1, BLUSH);
  } else {
    if (blink) { R(-2, 5, 1, 1, EYE); R(3, 5, 1, 1, EYE); }
    else { R(-2, 4, 1, 2, EYE); R(3, 4, 1, 2, EYE); }
    if (!p.glasses) { R(-4, 6, 1, 1, BLUSH); R(4, 6, 1, 1, BLUSH); }
  }
  if (p.glasses) {
    const g = p.glassC;
    if (p.glassStyle === 'round') {
      [-3, 2].forEach((gx) => { R(gx + 1, 3, 2, 1, g); R(gx + 1, 6, 2, 1, g); R(gx, 4, 1, 2, g); R(gx + 3, 4, 1, 2, g); });
      R(1, 4, 1, 1, g);
    } else if (p.glassStyle === 'horn') {
      [-3, 2].forEach((gx) => { R(gx, 3, 4, 1, g); R(gx, 4, 1, 2, g); R(gx + 3, 4, 1, 2, g); R(gx + 1, 6, 2, 1, '#8a6040'); });
      R(1, 4, 1, 1, g);
    } else {
      R(-4, 3, 4, 1, g); R(-4, 6, 4, 1, g); R(-4, 3, 1, 4, g); R(-1, 3, 1, 4, g);
      R(2, 3, 4, 1, g); R(2, 6, 4, 1, g); R(2, 3, 1, 4, g); R(5, 3, 1, 4, g);
      R(0, 4, 2, 1, g);
    }
    if (((t * 0.9 + p.seed) % 2.6) < 0.22 || o.glint) { R(4, 4, 1, 1, WHITE); R(-2, 4, 1, 1, WHITE); }
  }
  if (p.stache) { R(-1, 7, 4, 1, hc); R(0, 8, 2, 1, MOUTH); }
  else R(0, 8, 2, 1, p.lips || MOUTH);
  if (p.earrings) { R(-5, 7, 1, 2, '#ffd23f'); R(4, 7, 1, 2, '#ffd23f'); }
  if (o.shine) { R(-4, 6, 1, 1, WHITE); R(3, 6, 1, 1, WHITE); if (Math.floor(t * 4) % 2) R(1, 5, 1, 1, WHITE); }

  C.restore();

  // netball (held, or tossed up and caught)
  if (o.ball) {
    const f = (o.face || 1);
    const by = o.toss ? -Math.round(Math.abs(Math.sin(t * 3.2)) * 16) : 0;
    const bx = Math.round(x + f * (hw + 1) * s) - (f < 0 ? 4 * s : 0);
    const byy = Math.round(feetY + (yo - total + hb + torso - 4 + by) * s);
    bmp(['.YY.', 'YWYY', 'YYOY', '.YY.'], bx, byy, { Y: '#ffe45c', W: WHITE, O: '#e8b830' }, s);
  }
}

// ------------------------------------------------------------------ cuddle bears (original rainbow bears)
const BEAR = [
  '.CC.......CC.',
  'CDDCCCCCCCDDC',
  'CDCCCCCCCCCDC',
  'CCCCCCCCCCCCC',
  'CCCKCCCCCKCCC',
  'CCCKCCCCCKCCC',
  'CPCCCWWWCCCPC',
  'CCCCWWKWWCCCC',
  '.CCCCWWWCCCC.',
  '..CCCCCCCCC..',
  '.CCWWWWWWWCC.',
  'CCCWWWWWWWCCC',
  'CC.WWWWWWW.CC',
  '..CWWWWWWWC..',
  '..CCCCCCCCC..',
  '..CCC...CCC..',
];
const SYM = {
  heart: { rows: HEART5, pal: { X: '#ff4f8b' } },
  matcha: { rows: ['.s.s.', 'MMMMM', '.MMM.', '..b..'], pal: { s: '#bdbdbd', M: '#5fa84a', b: '#8a5a3a' } },
  rainbow: { rows: ['.RRR.', 'RYYYR', 'YG.GY', 'G...G'], pal: { R: '#ff5a5a', Y: '#ffc93f', G: '#4cc38a' } },
  orchid: { rows: ['.P.P.', 'PPYPP', '.PPP.', '..g..'], pal: { P: '#b35ad6', Y: '#ffd23f', g: '#4caf50' } },
  star: { rows: ['..X..', 'XXXXX', '.XXX.', '.X.X.'], pal: { X: '#ffa000' } },
};
const BEARS = [
  { c: '#ffb3d1', d: '#ff7aa8', sym: 'heart' },
  { c: '#ffc2dc', d: '#ff8fbf', sym: 'matcha' },
  { c: '#a9d6ff', d: '#6aa9e8', sym: 'rainbow' },
  { c: '#d7c1ff', d: '#a68be6', sym: 'orchid' },
  { c: '#ffe58a', d: '#f2b84b', sym: 'star' },
];
function drawBear(b, x, y, t = 0, opts = {}) {
  const s = opts.s || 2;
  x = Math.round(x); y = Math.round(y);
  if (opts.cloud) cloud(x - 5 * s, y + 13 * s, '#ffffff', '#dcefff', s);
  const blink = ((t + x * 0.013) % 3.1) < 0.12;
  if (opts.wave && Math.floor(t * 4) % 2) { R(x + 12 * s, y + 8 * s, s, 3 * s, b.c); R(x + 12 * s, y + 7 * s, s, s, b.d); }
  bmp(BEAR, x, y, { C: b.c, D: b.d, K: blink ? b.c : EYE, W: '#fff7ec', P: '#ff8fb1' }, s);
  if (opts.wave && Math.floor(t * 4) % 2) R(x + 11 * s, y + 11 * s, 2 * s, 2 * s, b.c);
  if (blink) { R(x + 3 * s, y + 5 * s, s, s, EYE); R(x + 9 * s, y + 5 * s, s, s, EYE); }
  const sym = SYM[b.sym];
  bmp(sym.rows, x + 4 * s, y + 10 * s, sym.pal, s);
}

// Churros the bunny (side view, facing right)
const BUNNY = [
  '........EE.EE...',
  '........EP.EP...',
  '........EP.EP...',
  '........EE.EE...',
  '.......BBBBBB...',
  '......BBBBWKBB..',
  '......BBBBKKBBN.',
  '..BBBBBBBBRBBB..',
  '.BBBBBBBBBBBB...',
  'TBBBBBBBBBBB....',
  'TBBBBBCCCBBB....',
  '.BBBBBBBBBB.....',
  '..FF.....FF.....',
];
const BUNNY_PAL = { B: '#8a5a3a', E: '#8a5a3a', P: '#ffb3c6', K: EYE, W: '#ffffff', R: '#ff9fb8', N: '#ff7aa8', T: '#fff3e0', C: '#b5845c', F: '#5e3a22' };
function drawBunny(x, y, t, opts = {}) {
  const s = opts.s || 2, face = opts.face || 1;
  const hop = opts.hop ? Math.round(Math.abs(Math.sin(t * (opts.hopSpeed || 7))) * (opts.hopH || 6)) : 0;
  const rows = face < 0 ? BUNNY.map((r) => [...r].reverse().join('')) : BUNNY;
  const yy = Math.round(y - hop * s);
  if (opts.hop) R(x + 2 * s, y + 13 * s, 10 * s, s, 'rgba(0,0,0,0.15)');
  bmp(rows, Math.round(x), yy, BUNNY_PAL, s);
  if (opts.bow) { const bx = face < 0 ? x + 6 * s : x + 8 * s; R(bx - s, yy + 7 * s, s, 2 * s, '#ff5a9a'); R(bx + s, yy + 7 * s, s, 2 * s, '#ff5a9a'); R(bx, yy + 7 * s, s, s, '#c2185b'); }
}
// a matcha whisk with a face (transition buddy)
const WHISK = [
  '....HH....',
  '....HH....',
  '....hh....',
  '....HH....',
  '....HH....',
  '...HHHH...',
  '..BBBBBB..',
  '.BKBBBBKB.',
  '.BPBBBBPB.',
  '.BBBMMBBB.',
  'B.B.BB.B.B',
  'B.B.BB.B.B',
  'B.B.BB.B.B',
  'B.B.BB.B.B',
  'b.b.bb.b.b',
  '.b.b..b.b.',
];
const WHISK_PAL = { H: '#d8b878', h: '#b8985a', B: '#ecd39a', b: '#c9a868', K: EYE, P: '#ff9fb8', M: '#d0607a' };
const VASELINE = ['.LLLLLL.', 'LLLLLLLL', 'WWWWWWWW', 'WbbbbbbW', 'WWWWWWWW', '.WWWWWW.'];
const VAS_PAL = { L: '#3b6fd6', W: '#f4f8ff', b: '#3b6fd6' };
const DRYER = [
  'DPPPPPPPPNN.',
  'DPPPPPWPPNNN',
  'DPPPPPPPPNNN',
  'DPPPPPPPPNN.',
  '...PPP......',
  '...PWP......',
  '...PPP......',
  '...PPP......',
];
const DRYER_L = DRYER.map((r) => [...r].reverse().join(''));
const DRYER_PAL = { P: '#ff8fb8', D: '#c94f80', N: '#e86a9a', W: '#ffffff' };
const TOWEL = [
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'SSSSSSSSSS',
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'SSSSSSSSSS',
  'TTTTTTTTTT',
  'TTTTTTTTTT',
  'T.T.T.T.T.',
];
const TOWEL_PAL = { T: '#ffb3d1', S: '#ffffff' };
const DRESS = [
  '.....KK.....',
  '......K.....',
  '....KKKK....',
  '..KK....KK..',
  '..GG....GG..',
  '..GGGGGGGG..',
  '..GGGGGGGG..',
  '..GGSGGGGG..',
  '...GGGGGG...',
  '...gggggg...',
  '..GGGGGGGG..',
  '..GGGGGSGG..',
  '.GGGGGGGGGG.',
  '.GGSGGGGGGG.',
  '.GGGGGGGGGG.',
  'GGGGGGGSGGGG',
  'GGGGGGGGGGGG',
  'GGGSGGGGGGGG',
  'GGGGGGGGGGGG',
  'HHHHHHHHHHHH',
];
const DRESS_PAL = { K: '#c9a27a', G: '#1f4fbf', g: '#151515', S: '#9fc0ff', H: '#2f62d6' };
const ARROW = ['.KKKKK.', '.KWWWK.', '.KWWWK.', 'KKWWWKK', 'KWWWWWK', '.KWWWK.', '..KWK..', '...K...'];
function drawBike(x, y, spin, parked) {
  C.save(); C.translate(Math.round(x), Math.round(y)); C.scale(2, 2);
  const wheel = (cx) => {
    for (let a = 0; a < Math.PI * 2; a += 0.25) R(cx + Math.cos(a) * 5, -5 + Math.sin(a) * 5, 1, 1, '#1a1a1a');
    for (let a = 0; a < Math.PI * 2; a += 0.35) R(cx + Math.cos(a) * 4, -5 + Math.sin(a) * 4, 1, 1, '#2a2a2a');
    for (let k = 0; k < 3; k++) { const a = spin * 18 + k * 2.1; R(cx + Math.cos(a) * 2.5, -5 + Math.sin(a) * 2.5, 1, 1, '#bbbbbb'); }
    R(cx - 1, -6, 2, 2, '#cccccc');
  };
  wheel(-9); wheel(10);
  R(-15, -7, 8, 2, '#cfcfcf'); R(-9, -9, 19, 2, '#888888');
  R(-3, -9, 7, 4, '#555555'); R(-2, -8, 5, 2, '#bbbbbb');
  R(0, -13, 9, 4, '#e2702a'); R(1, -13, 6, 1, '#ff9a4a');
  R(-11, -12, 11, 2, '#2a1a10'); R(-15, -11, 5, 2, '#1a1a1a');
  R(10, -15, 1, 10, '#bbbbbb'); R(8, -16, 4, 1, '#222222'); R(11, -12, 2, 2, '#ffe14d');
  if (parked) R(-4, -3, 1, 3, '#777777');
  C.restore();
}
function twinkle(x, y, c) { R(x, y - 1, 1, 3, c); R(x - 1, y, 3, 1, c); }
function meter(x, y, w, v, col, label) {
  R(x, y, w, 7, '#ffffff'); R(x + 1, y + 1, w - 2, 5, '#2a2050');
  R(x + 1, y + 1, Math.round((w - 2) * Math.min(1, v)), 5, col);
  R(x + 1, y + 1, Math.round((w - 2) * Math.min(1, v)), 1, 'rgba(255,255,255,0.5)');
  if (label) bmp(label.rows, x - label.rows[0].length - 3, y, label.pal);
}

// ------------------------------------------------------------------ Singapore scenery
function rainTree(x, base) {
  R(x + 9, base - 18, 4, 18, '#8a5a3a');
  R(x - 4, base - 26, 30, 7, '#5fb35a');
  R(x, base - 30, 22, 5, '#5fb35a');
  R(x + 3, base - 34, 16, 4, '#6fc46a');
  R(x - 4, base - 20, 30, 1, '#4a9a48');
  R(x + 4, base - 31, 3, 1, '#9be08a'); R(x + 13, base - 28, 3, 1, '#9be08a'); R(x - 1, base - 24, 3, 1, '#9be08a');
}
function skyline(col, win) {
  const base = 122;
  // generic towers
  [[70, 10, 40], [82, 8, 55], [92, 12, 34], [148, 10, 48], [160, 9, 62], [171, 12, 40], [224, 14, 50], [4, 12, 30]]
    .forEach(([x, w, h]) => {
      R(x, base - h, w, h, col);
      for (let y = base - h + 3; y < base - 2; y += 4)
        for (let xx = x + 2; xx < x + w - 1; xx += 3) if ((xx * 13 + y * 7) % 4 !== 0) R(xx, y, 1, 1, win);
    });
  // Marina Bay Sands
  [24, 36, 48].forEach((x) => {
    R(x, 76, 8, base - 76, col); R(x - 1, 108, 10, base - 108, col);
    for (let y = 80; y < base - 2; y += 4) R(x + 2, y, 4, 1, win);
  });
  R(19, 72, 44, 3, col); R(63, 73, 5, 1, col); R(63, 72, 2, 1, col);
  // Esplanade "durians"
  [[112, 9, 8], [130, 8, 7]].forEach(([cx, rx, ry]) => {
    for (let dy = 0; dy <= ry; dy++) {
      const w = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2));
      R(cx - w, base - dy, w * 2, 1, col);
      for (let xx = cx - w + 1; xx < cx + w; xx += 2) if ((xx + dy) % 2 === 0) R(xx, base - dy, 1, 1, win);
    }
  });
  // Singapore Flyer
  const fx = 198, fy = 92, fr = 20;
  for (let a = 0; a < Math.PI * 2; a += 0.03) R(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, 1, 1, col);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    for (let s = 3; s < fr; s += 3) R(fx + Math.cos(a) * s, fy + Math.sin(a) * s, 1, 1, col);
    R(fx + Math.cos(a) * fr - 1, fy + Math.sin(a) * fr - 1, 2, 2, win);
  }
  for (let s = 0; s < 30; s++) { R(fx - s * 0.4, fy + s, 2, 1, col); R(fx + s * 0.4, fy + s, 2, 1, col); }
}

// ------------------------------------------------------------------ particles
let parts = [];
function burst(x, y, col, n = 26) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, sp = rand(20, 42);
    parts.push({ k: 'px', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 22, life: rand(0.9, 1.4), age: 0, col });
  }
}
function floatHeart(x, y, col = '#ff5a9a') {
  parts.push({ k: 'heart', x, y, vx: rand(-4, 4), vy: rand(-16, -10), g: 0, life: rand(1.6, 2.4), age: 0, col });
}
function confetti() {
  const cols = ['#ff5a7a', '#ffa64d', '#ffe14d', '#5fd38a', '#5ab4ff', '#c39bff', '#ffffff'];
  parts.push({ k: 'conf', x: rand(0, W), y: -4, vx: rand(-8, 8), vy: rand(18, 34), g: 0, life: 7, age: 0, col: pick(cols), ph: rand(0, 6) });
}
function updateParts(dt) {
  for (const p of parts) {
    p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.k === 'heart') p.x += Math.sin(p.age * 4) * 0.3;
    if (p.k === 'conf') p.x += Math.sin(p.age * 3 + p.ph) * 0.4;
  }
  parts = parts.filter((p) => p.age < p.life && p.y < H + 10);
}
function drawParts() {
  for (const p of parts) {
    const f = 1 - p.age / p.life;
    if (p.k === 'px') { const s = f > 0.6 ? 2 : 1; if (f > 0.15 || Math.random() < 0.5) R(p.x, p.y, s, s, p.col); }
    else if (p.k === 'heart') { if (f > 0.2 || Math.floor(p.age * 12) % 2) bmp(HEART5, Math.round(p.x) - 2, Math.round(p.y) - 2, p.col); }
    else if (p.k === 'conf') { const flip = Math.floor(p.age * 8 + p.ph) % 2; R(p.x, p.y, flip ? 2 : 1, flip ? 1 : 2, p.col); }
  }
}

// rainbow beam made of pixel bands
const RAINBOW = ['#ff5a5a', '#ffa64d', '#ffe14d', '#5fd38a', '#5ab4ff', '#a77bff'];
function rainbowBeam(x0, y0, x1, y1, t) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  for (let s = 0; s < len; s += 0.7) {
    if ((s - t * 90) % 14 < -11 || ((s - t * 90) % 14 > 0 && (s - t * 90) % 14 < 3)) continue;
    const px = x0 + (dx * s) / len, py = y0 + (dy * s) / len;
    for (let k = 0; k < 6; k++) R(px + nx * (k - 2.5) * 1.1, py + ny * (k - 2.5) * 1.1, 1, 1, RAINBOW[k]);
  }
}

// ------------------------------------------------------------------ pre-rendered backgrounds
const BG = {};
function buildBackgrounds() {
  BG.titleSky = layer(W, H, () => {
    sky(['#2b1d5c', '#4a2475', '#7d2f80', '#b9477f', '#ec7a7a', '#ffb38a'], 0, 122);
    R(0, 122, W, 38, '#2a1840');
    skyline('#2a1840', '#ffcf6b');
    for (let y = 126; y < 160; y += 3) for (let x = (y * 7) % 11; x < W; x += 13) R(x, y, 4, 1, '#4a2d6a');
  });

  BG.bedroom = layer(W, H, () => {
    R(0, 0, W, 118, '#f3e6ff');
    for (let y = 8; y < 108; y += 12) for (let x = (y % 24 ? 6 : 12); x < W; x += 12) R(x, y, 1, 1, '#e3cdfa');
    R(0, 108, W, 10, '#e2cdf7'); R(0, 108, W, 1, '#d2b8ee');
    R(0, 118, W, 42, '#e0b98f');
    for (let y = 118; y < H; y += 7) { R(0, y, W, 1, '#c99f74'); for (let x = (y % 14 ? 14 : 40); x < W; x += 52) R(x, y, 1, 7, '#c99f74'); }
    R(66, 142, 118, 16, '#ffc2d9'); R(66, 142, 118, 1, '#ff9fc0'); R(66, 157, 118, 1, '#ff9fc0');
    for (let x = 70; x < 182; x += 8) R(x, 149, 4, 2, '#ffe0ec');
    // window with morning sun
    R(88, 8, 64, 2, '#c9a27a');
    R(94, 12, 52, 44, '#fffaf0');
    R(97, 15, 46, 13, '#ffe7b8'); R(97, 28, 46, 13, '#ffd5c0'); R(97, 41, 46, 12, '#ffe2ee');
    R(114, 38, 12, 8, '#ffd84d'); R(116, 36, 8, 2, '#ffd84d'); R(112, 40, 16, 4, '#ffd84d');
    R(97, 46, 46, 7, '#cfe8c8'); R(97, 46, 46, 1, '#b4dcab');
    R(119, 15, 2, 38, '#fffaf0'); R(97, 33, 46, 2, '#fffaf0');
    R(86, 10, 9, 52, '#ff9fc0'); R(145, 10, 9, 52, '#ff9fc0');
    for (let y = 12; y < 62; y += 4) { R(88, y, 1, 3, '#ff86b0'); R(150, y, 1, 3, '#ff86b0'); }
    R(84, 58, 72, 3, '#fffaf0');
    // hooks for the towel and the dress
    R(24, 52, 8, 2, '#c9a27a'); R(27, 50, 2, 2, '#c9a27a');
    R(68, 34, 4, 2, '#c9a27a');
    // vanity mirror with bulbs
    const ell = (cx, cy, rx, ry, col) => { for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2)); R(cx - w, cy + dy, w * 2, 1, col); } };
    ell(192, 60, 30, 40, '#f2c46d'); ell(192, 60, 28, 38, '#ffe39a'); ell(192, 60, 26, 36, '#e4f3ff');
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      R(192 + Math.cos(a) * 33 - 1, 60 + Math.sin(a) * 43 - 1, 3, 3, '#fff6c0');
    }
    // vanity table
    R(146, 100, 92, 5, '#ffffff'); R(146, 104, 92, 1, '#e8d0f0');
    R(150, 105, 84, 26, '#ffd6e6');
    R(154, 109, 36, 9, '#ffe6ef'); R(194, 109, 36, 9, '#ffe6ef'); R(154, 120, 76, 8, '#ffe6ef');
    R(170, 112, 4, 2, '#f2c46d'); R(210, 112, 4, 2, '#f2c46d'); R(190, 123, 4, 2, '#f2c46d');
    R(152, 131, 4, 19, '#f0b8d0'); R(228, 131, 4, 19, '#f0b8d0');
    // perfume + lipstick (decor)
    R(184, 92, 6, 8, '#c8a6ff'); R(185, 90, 4, 2, '#f2c46d'); R(186, 93, 1, 4, '#e8dcff');
    R(194, 94, 3, 6, '#e2466f'); R(194, 92, 3, 2, '#c2185b');
  });

  BG.office = layer(W, H, () => {
    R(0, 0, W, 118, '#e3ecf6');
    // big windows with the CBD
    R(6, 8, 228, 50, '#ffffff');
    R(9, 11, 222, 44, '#b8e0ff'); R(9, 11, 222, 14, '#a3d6ff');
    cloud(30, 16); cloud(150, 20);
    [[14, 20, 26], [36, 14, 34], [52, 18, 22], [74, 12, 38], [88, 20, 28], [112, 16, 40], [130, 22, 24], [154, 14, 36], [170, 20, 30], [194, 16, 42], [212, 18, 26]]
      .forEach(([x, w, h], i) => {
        const c = i % 2 ? '#8fb3d6' : '#a2c1e0';
        R(x, 55 - h, w, h, c);
        for (let y = 58 - h; y < 53; y += 4) for (let xx = x + 2; xx < x + w - 1; xx += 3) R(xx, y, 1, 2, '#d8ecff');
      });
    for (let x = 6; x <= 234; x += 57) R(x, 8, 3, 50, '#ffffff');
    R(6, 56, 228, 3, '#ffffff');
    // wall decor
    R(112, 66, 16, 16, '#ffffff'); R(113, 67, 14, 14, '#2a2d3a'); R(114, 68, 12, 12, '#fffaf0'); R(119, 70, 1, 5, '#2a2d3a'); R(120, 74, 3, 1, '#2a2d3a');
    R(150, 64, 40, 26, '#ffffff'); R(151, 65, 38, 24, '#f6f9fc');
    R(155, 82, 4, 4, '#ff7aa8'); R(161, 78, 4, 8, '#5ab4ff'); R(167, 74, 4, 12, '#5fd38a'); R(173, 70, 4, 16, '#ffb347');
    R(36, 66, 30, 20, '#ffffff'); R(38, 68, 26, 16, '#ffe9f2'); bmp(['.XX.XX.', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], 47, 72, '#ff7aa8');
    R(0, 112, W, 6, '#cfdbe8');
    R(0, 118, W, 42, '#9fb0c8');
    for (let y = 122; y < H; y += 6) for (let x = (y % 12 ? 0 : 6); x < W; x += 12) R(x, y, 2, 1, '#8ea0ba');
    // plants
    R(4, 96, 10, 16, '#e88a5a'); R(2, 80, 4, 16, '#4caf50'); R(7, 74, 4, 22, '#5fbf5a'); R(12, 82, 4, 14, '#4caf50');
    R(226, 96, 10, 16, '#e88a5a'); R(224, 82, 4, 14, '#4caf50'); R(229, 76, 4, 20, '#5fbf5a'); R(234, 84, 4, 12, '#4caf50');
  });

  BG.room = layer(W, H, () => {
    R(0, 0, W, 112, '#fbe6cf');
    for (let y = 6; y < 92; y += 10) for (let x = (y % 20 ? 4 : 9); x < W; x += 10) R(x, y, 1, 1, '#f1cfae');
    R(0, 92, W, 20, '#e8c49a'); R(0, 92, W, 2, '#d9ac7a');
    for (let x = 6; x < W; x += 16) R(x, 96, 1, 14, '#d9ac7a');
    R(0, 112, W, 48, '#c98b5a');
    for (let y = 112; y < H; y += 8) { R(0, y, W, 1, '#b4774a'); for (let x = (y % 16 ? 10 : 30); x < W; x += 40) R(x, y, 1, 8, '#b4774a'); }
    // window with a view
    R(18, 16, 56, 54, '#fff8ef');
    R(21, 19, 50, 48, '#9fd8ff'); R(21, 52, 50, 15, '#bfe6ff');
    cloud(26, 26); rainTree(44, 68);
    R(45, 19, 2, 48, '#fff8ef'); R(21, 42, 50, 2, '#fff8ef');
    R(14, 70, 64, 4, '#e8d0b0');
    R(57, 62, 11, 8, '#d9774a'); R(56, 62, 13, 2, '#e88a5a');
    R(59, 55, 2, 7, '#4caf50'); R(62, 52, 2, 10, '#5fbf5a'); R(65, 56, 2, 6, '#4caf50'); R(61, 54, 1, 1, '#ff8fb1');
    // shelf with tea tins
    R(148, 48, 76, 3, '#a8683a'); R(150, 51, 3, 4, '#8a5430'); R(219, 51, 3, 4, '#8a5430');
    R(154, 34, 10, 14, '#5fa84a'); R(154, 38, 10, 4, '#fff8ef'); R(156, 39, 6, 2, '#5fa84a'); R(154, 33, 10, 2, '#3d7a32');
    R(168, 38, 8, 10, '#e2466f'); R(168, 37, 8, 2, '#b8304f'); R(170, 41, 4, 3, '#ffe14d');
    R(214, 42, 8, 6, '#f3efe6'); R(215, 41, 6, 1, '#ffffff'); R(222, 43, 1, 3, '#f3efe6');
    // framed heart picture
    R(100, 22, 26, 22, '#a8683a'); R(102, 24, 22, 18, '#ffe9f2'); bmp(HEART7, 106, 28, '#ff7aa8', 2);
    // little noren curtain
    R(150, 64, 70, 2, '#6e4630');
    for (let i = 0; i < 4; i++) { R(152 + i * 17, 66, 15, 18, i % 2 ? '#5fa84a' : '#4a8f3a'); }
    bmp(['.X.', 'XXX', '.X.'], 167, 72, '#fff8ef', 1);
  });

  BG.night = layer(W, H, () => {
    sky(['#0b1030', '#121848', '#1b2160', '#2a2d78', '#3d3a8a'], 0, 122);
    for (let i = 0; i < 70; i++) R((i * 97) % W, (i * 53) % 100, 1, 1, i % 5 ? '#8c93d8' : '#ffffff');
    R(196, 16, 12, 12, '#fff6d8'); R(195, 18, 14, 8, '#fff6d8'); R(200, 18, 3, 3, '#efe2b8'); R(204, 23, 2, 2, '#efe2b8');
    skyline('#151a3d', '#ffe08a');
    R(0, 122, W, 16, '#1d2660');
    R(0, 138, W, 22, '#5b5f8f'); R(0, 138, W, 2, '#7a7eb0');
    for (let x = 4; x < W; x += 24) { R(x, 128, 1, 10, '#3a3f70'); R(x - 1, 127, 3, 1, '#ffe08a'); }
    R(0, 137, W, 1, '#3a3f70');
    for (let y = 144; y < H; y += 5) for (let x = (y % 10 ? 0 : 8); x < W; x += 16) R(x, y, 8, 1, '#525684');
  });

  BG.wedding = layer(W, H, () => {
    sky(['#8fd3ff', '#a9ddff', '#c6e9ff', '#e4f5ff'], 0, 112);
    const cx = 120, cy = 84;
    for (let y = 0; y < 60; y++) for (let x = 0; x < W; x++) {
      const band = Math.floor((Math.hypot(x - cx, y - cy) - 52) / 4);
      if (band >= 0 && band < 6) R(x, y, 1, 1, RAINBOW[5 - band]);
    }
    cloud(4, 40); cloud(212, 36); cloud(160, 12);
    for (let i = 0; i < 9; i++) { const x = i * 28 - 6; R(x, 92, 30, 22, i % 2 ? '#7cc47a' : '#6ab868'); R(x + 4, 86, 22, 6, i % 2 ? '#7cc47a' : '#6ab868'); }
    R(0, 112, W, 48, '#9be08a'); R(0, 112, W, 1, '#b8ec9e');
    for (let i = 0; i < 60; i++) R((i * 37) % W, 114 + (i * 13) % 44, 1, 1, ['#ffffff', '#ffe14d', '#ff9fc0'][i % 3]);
    // aisle runner
    for (let y = 112; y < H; y++) { const w = 12 + (y - 112) * 0.5; R(116 - w, y, w * 2, 1, '#ffd6e4'); }
    for (let y = 116; y < H; y += 6) { const w = 12 + (y - 112) * 0.5; R(116 - w, y, 2, 2, '#ff9fc0'); R(114 + w, y, 2, 2, '#ff9fc0'); }
    // floral arch
    const fl = ['#ff9fc0', '#ffffff', '#ffd1e3', '#ff7aa8'];
    for (let a = Math.PI; a <= Math.PI * 2 + 0.001; a += 0.06) {
      const x = 116 + Math.cos(a) * 34, y = 78 + Math.sin(a) * 26;
      R(x - 1, y - 1, 3, 3, '#f4f4f4');
    }
    R(81, 78, 3, 40, '#f4f4f4'); R(148, 78, 3, 40, '#f4f4f4');
    for (let k = 0; k < 40; k++) {
      const a = Math.PI + (k / 39) * Math.PI, x = 116 + Math.cos(a) * 34, y = 78 + Math.sin(a) * 26;
      R(x - 2 + (k % 3), y - 2 + (k % 2), 2, 2, fl[k % 4]); if (k % 3 === 0) R(x + 1, y + 1, 2, 1, '#5fb35a');
    }
    for (let y = 80; y < 118; y += 4) { R(79 + (y % 8 ? 0 : 3), y, 3, 3, fl[y % 4]); R(147 + (y % 8 ? 3 : 0), y, 3, 3, fl[(y + 1) % 4]); }
    // fairy lights
    for (let x = 0; x < W; x += 4) { const y = 66 + Math.round(Math.abs(Math.sin(x / 38)) * 6); R(x, y, 1, 1, '#ffffff'); if (x % 12 === 0) R(x, y + 1, 2, 2, '#fff2a0'); }
  });
}

// ------------------------------------------------------------------ audio (tiny chiptune synth)
let actx = null, master = null, muted = false;
try { muted = localStorage.getItem('angela-muted') === '1'; } catch (e) { /* ignore */ }

function initAudio() {
  if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
  master = actx.createGain();
  master.gain.value = muted ? 0 : 0.32;
  master.connect(actx.destination);
  setInterval(schedule, 40);
}
function tone(freq, start, dur, type = 'square', vol = 0.15) {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.008);
  g.gain.setValueAtTime(vol, start + dur * 0.6);
  g.gain.linearRampToValueAtTime(0, start + dur);
  o.connect(g); g.connect(master);
  o.start(start); o.stop(start + dur + 0.02);
}
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) {
  if (n === 'R') return null;
  const m = n.match(/^([A-G])([#b]?)(\d)$/);
  return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const seq = (list) => list.map(([n, b]) => [midi(n), b]);
function bassFrom(prog, oct, step) {
  const out = [];
  for (const [r, b] of prog) {
    const lo = midi(r.replace('m', '') + oct);
    for (let k = 0; k < b / step; k++) out.push([k % 2 ? lo + 12 : lo, step]);
  }
  return out;
}
function arpFrom(prog, oct, step = 0.5) {
  const out = [];
  for (const [r, b] of prog) {
    const minor = r.endsWith('m');
    const root = midi(r.replace('m', '') + oct);
    const tones = [root, root + (minor ? 3 : 4), root + 7, root + 12];
    for (let k = 0; k < b / step; k++) out.push([tones[k % 4], step]);
  }
  return out;
}

const PROG_ADV = [['C', 4], ['F', 4], ['Dm', 2], ['G', 2], ['C', 4], ['C', 4], ['F', 4], ['Dm', 2], ['G', 2], ['C', 4]];
const PROG_LUL = [['C', 3], ['Em', 3], ['F', 3], ['C', 3], ['F', 3], ['C', 3], ['G', 3], ['C', 3]];
const PROG_WED = [['C', 4], ['C', 4], ['C', 4], ['G', 2], ['C', 2], ['C', 2], ['F', 2], ['C', 2], ['G', 2], ['C', 4], ['G', 2], ['C', 2], ['C', 4]];
const T3 = 1 / 3;
const SONGS = {
  adventure: {
    bpm: 138,
    tracks: [
      { type: 'square', vol: 0.11, gate: 0.8, notes: seq([
        ['E5', .5], ['G5', .5], ['C6', 1], ['B5', .5], ['A5', .5], ['G5', 1],
        ['A5', .5], ['F5', .5], ['A5', 1], ['G5', .5], ['E5', .5], ['C5', 1],
        ['D5', .5], ['E5', .5], ['F5', 1], ['E5', .5], ['D5', .5], ['G5', 1],
        ['E5', .5], ['D5', .5], ['C5', 1], ['R', 2],
        ['E5', .5], ['G5', .5], ['C6', 1], ['D6', .5], ['C6', .5], ['A5', 1],
        ['F5', .5], ['A5', .5], ['C6', 1], ['B5', .5], ['A5', .5], ['G5', 1],
        ['A5', .5], ['G5', .5], ['F5', .5], ['E5', .5], ['D5', 1], ['G4', 1],
        ['C5', 2], ['R', 2],
      ]) },
      { type: 'triangle', vol: 0.32, gate: 0.7, notes: bassFrom(PROG_ADV, 2, 0.5) },
      { type: 'square', vol: 0.025, gate: 0.5, notes: arpFrom(PROG_ADV, 4, 0.25) },
    ],
  },
  lullaby: {
    bpm: 92,
    tracks: [
      { type: 'triangle', vol: 0.3, gate: 0.9, notes: seq([
        ['E5', 2], ['G5', 1], ['C6', 2], ['B5', 1], ['A5', 2], ['G5', 1], ['E5', 3],
        ['F5', 2], ['A5', 1], ['G5', 2], ['E5', 1], ['D5', 2], ['B4', 1], ['C5', 3],
      ]) },
      { type: 'triangle', vol: 0.22, gate: 0.8, notes: bassFrom(PROG_LUL, 2, 1) },
      { type: 'sine', vol: 0.06, gate: 0.6, notes: arpFrom(PROG_LUL, 5, 0.5) },
    ],
  },
  wedding: { // chiptune fanfare + "Bridal Chorus" (Wagner, public domain), cute-ified
    bpm: 104,
    tracks: [
      { type: 'square', vol: 0.11, gate: 0.85, notes: seq([
        ['G4', T3], ['G4', T3], ['G4', T3], ['C5', 1], ['G4', T3], ['G4', T3], ['G4', T3], ['E5', 1],
        ['G4', T3], ['G4', T3], ['G4', T3], ['G5', 2], ['R', 1],
        ['G4', 1], ['C5', .75], ['C5', .25], ['C5', 2],
        ['G4', 1], ['D5', .75], ['B4', .25], ['C5', 2],
        ['G4', 1], ['C5', .75], ['F5', .25], ['F5', 1], ['E5', .5], ['D5', .5],
        ['C5', .5], ['B4', .5], ['C5', .5], ['D5', .5], ['G4', 2],
        ['G4', 1], ['C5', .75], ['C5', .25], ['C5', 2],
        ['G4', 1], ['D5', .75], ['B4', .25], ['C5', 1], ['E5', .5], ['G5', .5],
        ['C6', 1], ['G5', .5], ['E5', .5], ['C5', 2],
      ]) },
      { type: 'triangle', vol: 0.32, gate: 0.6, notes: bassFrom(PROG_WED, 2, 1) },
      { type: 'square', vol: 0.03, gate: 0.4, notes: arpFrom(PROG_WED, 5, 0.25) },
    ],
  },
};
let song = null, trackPos = [];
function playSong(name) {
  const s = SONGS[name] || null;
  if (song === s) return;
  song = s;
  if (actx && s) { const t0 = actx.currentTime + 0.08; trackPos = s.tracks.map(() => ({ i: 0, time: t0 })); }
}
function schedule() {
  if (!song || !actx) return;
  if (!trackPos.length) { const t0 = actx.currentTime + 0.08; trackPos = song.tracks.map(() => ({ i: 0, time: t0 })); }
  if (trackPos.some((p) => p.time < actx.currentTime - 0.1)) { // tab was asleep: restart cleanly
    const t0 = actx.currentTime + 0.08; trackPos = song.tracks.map(() => ({ i: 0, time: t0 }));
  }
  const spb = 60 / song.bpm, horizon = actx.currentTime + 0.25;
  song.tracks.forEach((tr, k) => {
    const p = trackPos[k];
    while (p.time < horizon) {
      const [m, b] = tr.notes[p.i];
      const dur = b * spb;
      if (m != null) tone(mtof(m), p.time, dur * tr.gate, tr.type, tr.vol);
      p.time += dur;
      p.i = (p.i + 1) % tr.notes.length;
    }
  });
}
function sfx(kind) {
  if (!actx) return;
  const t = actx.currentTime + 0.01;
  if (kind === 'blip') tone(988, t, 0.05, 'square', 0.08);
  else if (kind === 'tick') tone(1568, t, 0.018, 'square', 0.025);
  else if (kind === 'jingle') [72, 76, 79, 84, 88].forEach((m, i) => tone(mtof(m), t + i * 0.07, 0.12, 'square', 0.09));
  else if (kind === 'sparkle') [84, 91, 96, 91, 96, 100].forEach((m, i) => tone(mtof(m), t + i * 0.05, 0.08, 'triangle', 0.15));
  else if (kind === 'surprise') [76, 81, 88].forEach((m, i) => tone(mtof(m), t + i * 0.06, 0.08, 'square', 0.1));
}
const muteBtn = $('mute');
function setMuted(m) {
  muted = m;
  muteBtn.classList.toggle('off', m);
  if (master) master.gain.value = m ? 0 : 0.32;
  try { localStorage.setItem('angela-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
}
setMuted(muted);
muteBtn.addEventListener('click', (e) => { e.stopPropagation(); initAudio(); setMuted(!muted); });
document.addEventListener('visibilitychange', () => {
  if (!actx) return;
  if (document.hidden) actx.suspend(); else actx.resume();
});

// ------------------------------------------------------------------ DOM bits
const dialog = $('dialog'), dtext = $('dtext');
const titleOv = $('titleOv'), card = $('card'), congrats = $('congrats'), theEnd = $('theEnd');
const pops = $('pops'), letterWrap = $('letterWrap');

// split the congrats title into wavy letters
(() => {
  const el = $('congratsText');
  let i = 0;
  el.innerHTML = el.innerHTML.split('<br>').map((line) =>
    [...line].map((ch) => `<span style="--i:${i++}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')).join('<br>');
})();

function pop(text, x, y, color = '#ff4f8b', delay = 0) {
  setTimeout(() => {
    const el = document.createElement('div');
    el.className = 'pop';
    el.textContent = text;
    el.style.left = (x / W * 100) + '%';
    el.style.top = (y / H * 100) + '%';
    el.style.color = color;
    pops.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }, delay);
}

// ------------------------------------------------------------------ scenes
function angelaMorning(st) {
  const p = { ...ANGELA, ...(st.outfit === 'gown' ? GOWN : ROBE) };
  if (st.hair === 'towel') { p.hair = 'towel'; p.towelC = '#ffb3d1'; p.towelC2 = '#ffffff'; }
  else if (st.hair === 'wet') { p.hairC = '#4a2c1c'; p.hairHi = '#5a3624'; }
  return p;
}
function kopiDesk(cx, hasKopi, t) {
  R(cx + 8, 106, 15, 11, '#2a2d3a'); R(cx + 9, 107, 13, 9, Math.floor(t * 2 + cx) % 5 ? '#8fd3ff' : '#a8e0ff');
  for (let i = 0; i < 3; i++) R(cx + 10, 108 + i * 2, 4 + ((i * 7 + Math.floor(t * 3)) % 7), 1, '#4f8fe0');
  R(cx + 14, 117, 3, 5, '#555a6a');
  R(cx - 24, 122, 48, 4, '#c9a27a'); R(cx - 24, 122, 48, 1, '#dcbb94');
  R(cx - 22, 126, 44, 14, '#a88058'); R(cx - 22, 126, 44, 1, '#8a6440');
  R(cx - 20, 140, 4, 10, '#8a6440'); R(cx + 16, 140, 4, 10, '#8a6440');
  if (hasKopi) {
    R(cx - 19, 113, 6, 9, '#a8682f'); R(cx - 19, 113, 6, 2, '#ead6b8'); R(cx - 17, 110, 1, 3, WHITE); R(cx - 13, 116, 1, 3, WHITE);
  }
}

const scenes = [
  // 0 ---------------------------------------------------------------- TITLE
  {
    music: null,
    lines: ['♪ Sound on for the full experience! Tap anywhere to begin...'],
    init(st) { titleOv.classList.add('show'); st.fw = 0; },
    exit() { titleOv.classList.remove('show'); },
    draw(t, dt, st) {
      C.drawImage(BG.titleSky, 0, 0);
      st.fw -= dt;
      if (st.fw <= 0) { st.fw = rand(0.5, 1.1); burst(rand(30, 210), rand(14, 70), pick(['#ffe14d', '#ff7aa8', '#8fe3ff', '#c39bff', '#8fe3a0'])); }
      drawParts();
      for (let x = 0; x < W; x += 9) R(x + Math.round(Math.sin(t * 2 + x) * 2), 128 + (x % 5) * 5, 5, 1, '#c86a8a');
      drawPerson(ANGELA, 84, 154, { t, wave: true });
      drawBear(BEARS[0], 112, 100 + Math.round(Math.sin(t * 2) * 2), t, { cloud: true, wave: true });
      drawBunny(150, 128, t, { hop: true, hopSpeed: 4 });
    },
  },

  // 1 ---------------------------------------------------------------- MORNING GLOW-UP (interactive)
  {
    music: 'adventure', card: ['07:00 AM', 'GLOW-UP TIME'], trans: 'bunny',
    lines: [
      'Fresh out of the shower... time for Angela to get ready for work!',
      { text: 'Step 1: wrap up that wet hair. Tap the TOWEL!', target: 'towel', label: 'TOWEL',
        done: (st) => { st.hair = 'towel'; st.towelGone = true; pop('SNUG!', 118, 92, '#ff5a9a'); sfx('jingle'); } },
      { text: 'Step 2: the secret skincare weapon... Tap the VASELINE!', target: 'vaseline', label: 'VASELINE',
        done: (st, t) => { st.shine = true; st.glowT = t; pop('+100 GLOW', 118, 90, '#3b6fd6'); sfx('sparkle'); } },
      { text: 'Step 3: towel off, time to blow-dry! Tap the HAIRDRYER (keep tapping!)', target: 'dryer', label: 'HAIRDRYER', taps: 6,
        onTap: (st, n) => {
          st.hair = 'wet'; st.drying = true; st.dryT = 0.5; st.dryTarget = n / 6;
          pop(pick(['WHOOSH!', 'VRRRR!', 'FWOOSH!']), rand(96, 140), rand(78, 96), '#ff5a9a');
        },
        done: (st) => { st.hair = 'dry'; st.drying = false; st.dryerBack = true; pop('SO FLUFFY!', 118, 84, '#c2185b'); sfx('jingle'); } },
      { text: 'Last step: tap the DRESS!', target: 'dress', label: 'DRESS',
        done: (st, t) => { st.spin = t; sfx('sparkle'); } },
      { text: 'Ta-da! All glammed up and ready for work! ✨', on: () => pop('★ GORGEOUS ★', 118, 80, '#c2185b') },
    ],
    hot(st) {
      return {
        towel: { x: 18, y: 54, w: 20, h: 26 },
        vaseline: { x: 158, y: 88, w: 16, h: 12 },
        dryer: st.drying ? { x: 134, y: 98, w: 24, h: 16, alt: { x: 206, y: 84, w: 24, h: 16 } } : { x: 206, y: 84, w: 24, h: 16 },
        dress: { x: 58, y: 36, w: 24, h: 46 },
      };
    },
    init(st) { st.hair = 'wet'; st.outfit = 'robe'; st.dry = 0; st.dryTarget = 0; st.spin = -9; },
    draw(t, dt, st) {
      C.drawImage(BG.bedroom, 0, 0);
      st.dry = lerp(st.dry, st.dryTarget, Math.min(1, dt * 6));
      if (st.dryT > 0) st.dryT -= dt;
      const spinning = st.spin > 0 && t - st.spin < 0.9;
      if (st.spin > 0 && t - st.spin > 0.45) st.outfit = 'gown';
      const ang = angelaMorning(st);

      // reflection in the mirror
      C.save(); C.beginPath(); C.ellipse(192, 60, 26, 36, 0, 0, Math.PI * 2); C.clip();
      drawPerson(ang, 196, 112, { t, face: -1, shine: st.shine });
      R(166, 24, 52, 72, 'rgba(228,243,255,0.35)');
      for (let i = 0; i < 3; i++) R(172 + i * 4 + ((t * 6) % 40), 30 + i * 3, 2, 50, 'rgba(255,255,255,0.35)');
      C.restore();

      // items
      if (!st.towelGone) { bmp(TOWEL, 18, 54, TOWEL_PAL, 2); }
      bmp(VASELINE, 158, 88, VAS_PAL, 2);
      if (!st.drying && !st.dryerBack) bmp(DRYER, 206, 84, DRYER_PAL, 2);
      if (st.dryerBack) bmp(DRYER, 206, 84, DRYER_PAL, 2);
      if (st.outfit !== 'gown') bmp(DRESS, 58, 36, DRESS_PAL, 2);
      else R(68, 34, 4, 2, '#c9a27a');

      // Angela
      const face = spinning ? (Math.floor((t - st.spin) * 14) % 2 ? -1 : 1) : 1;
      drawPerson(ang, 118, 154, { t, face, bob: !st.drying, shine: st.shine, flutter: st.drying && st.dryT > 0 });

      if (st.drying) {
        const jig = st.dryT > 0 ? Math.round(Math.sin(t * 40)) : 0;
        bmp(DRYER_L, 134 + jig, 98, DRYER_PAL, 2);
        if (st.dryT > 0) for (let i = 0; i < 7; i++) {
          const ax = 132 - ((t * 120 + i * 9) % 26), ay = 100 + (i * 5) % 12;
          R(ax, ay, 3, 1, i % 2 ? '#ffffff' : '#bfe6ff');
        }
        meter(100, 84, 40, st.dry, '#ff8fb8');
        bmp(['.B.', 'BBB', 'BBB', '.B.'], 93, 85, '#5ab4ff');
      }
      if (st.hair === 'wet' && !st.drying && Math.random() < dt * 3)
        parts.push({ k: 'px', x: rand(110, 128), y: 130, vx: 0, vy: 10, g: 60, life: 0.5, age: 0, col: '#8fd3ff' });
      if (st.shine && t - st.glowT < 1.2) for (let i = 0; i < 6; i++) twinkle(118 + Math.cos(t * 5 + i) * 16, 112 + Math.sin(t * 5 + i) * 10, '#ffffff');
      if (spinning) {
        const k = (t - st.spin) / 0.9;
        for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * 3; twinkle(118 + Math.cos(a) * (10 + k * 34), 126 + Math.sin(a) * (8 + k * 26), RAINBOW[i % 6]); }
        if (k > 0.4 && k < 0.6) R(0, 0, W, H, 'rgba(255,255,255,0.6)');
      }
      if (st.outfit === 'gown' && !spinning && Math.floor(t * 3) % 2 === 0) {
        twinkle(100 + ((t * 37) % 40), 104 + ((t * 53) % 44), '#fff6a0');
        twinkle(110 + ((t * 61) % 36), 100 + ((t * 29) % 50), '#ffffff');
      }
      drawParts();
    },
  },

  // 2 ---------------------------------------------------------------- EVENING MATCHA (kids around, Churros hopping)
  {
    music: 'adventure', card: ['06:30 PM', "MATCHA O'CLOCK"], trans: 'whisk',
    lines: [
      'Home sweet home after a long day at work!',
      'Time for her favourite power-up...',
      { text: 'Tap the WHISK to whisk up the matcha! (Whisk whisk whisk!)', target: 'whisk', label: 'WHISK', taps: 8,
        onTap: (st, n) => { st.speed = Math.min(8, st.speed + 1.6); st.froth = n / 8; pop('WHISK!', n % 2 ? 140 : 92, 92 - (n % 3) * 6, '#4a9a3a'); },
        done: (st) => {
          st.glow = 1; sfx('jingle');
          pop('+100 CALM', 70, 80, '#4a9a3a'); pop('+100 FOCUS', 164, 74, '#4a9a3a', 350); pop('+100 ZEN', 116, 60, '#ff4f8b', 700);
        } },
      '+100 CALM!  +100 FOCUS!  +100 ZEN!  Perfectly frothy. ♥',
    ],
    hot() { return { whisk: { x: 102, y: 96, w: 26, h: 24 } }; },
    init(st) { st.speed = 0.8; st.glow = 0; st.froth = 0; st.fr = 0; },
    draw(t, dt, st) {
      C.drawImage(BG.room, 0, 0);
      st.speed = Math.max(st.glow ? 1.2 : 0.8, st.speed - dt * 1.5);
      st.fr = lerp(st.fr, st.froth, Math.min(1, dt * 6));
      drawBear(BEARS[1], 184, 16, t);
      drawPerson(ANGELA_WORK, 108, 128, { t, bob: true });
      const wx = Math.round(113 + Math.sin(t * st.speed * 6) * 3);
      R(wx + 2, 99, 2, 9, '#d8b878'); R(wx + 2, 99, 2, 1, '#b8985a');
      R(wx, 107, 6, 7, '#e8cc90'); for (let i = 0; i < 6; i += 2) R(wx + i, 108, 1, 6, '#c9a868');
      R(107, 113, 18, 2, '#55697d'); R(108, 115, 16, 4, '#3b4a5a'); R(110, 119, 12, 1, '#3b4a5a');
      R(109, 113, 14, 1, st.fr > 0.5 ? '#a8dc7a' : '#7cc35a');
      for (let i = 0; i < 4; i++) if (Math.floor(t * st.speed * 4 + i) % 3 === 0) R(110 + i * 3, 113, 1, 1, '#d8f5b0');
      if (st.fr > 0.3) for (let i = 0; i < 5; i++) R(110 + ((i * 5 + Math.floor(t * 8)) % 13), 112, 1, 1, '#eaffd0');
      R(64, 120, 112, 5, '#8a5a3a'); R(64, 120, 112, 1, '#a8724a');
      R(68, 125, 104, 10, '#6e4630'); R(68, 125, 104, 1, '#5a3826');
      R(70, 135, 6, 9, '#5a3826'); R(164, 135, 6, 9, '#5a3826');
      R(150, 117, 7, 3, '#f3efe6'); R(151, 116, 5, 1, '#ffffff');
      for (let i = 0; i < 6; i++) {
        const ph = (t * 9 + i * 4) % 22;
        R(112 + i * 2 + Math.round(Math.sin(ph * 0.4 + i) * 1.5), 111 - ph, 1, 1, ph < 16 ? '#ffffff' : '#f3e6da');
      }
      if (st.froth > 0 && !st.glow) meter(98, 86, 40, st.fr, '#7cc35a');
      if (st.glow) {
        for (let i = 0; i < 10; i++) {
          const a = t * 2 + i * 0.63, r = 30 + Math.sin(t * 3 + i) * 4;
          if ((i + Math.floor(t * 6)) % 3) R(116 + Math.cos(a) * r, 104 + Math.sin(a) * r * 0.6, 2, 2, i % 2 ? '#8fe36a' : '#fff6a0');
        }
      }
      // the kids, just doing their thing
      drawPerson(SON_A, 182, 154, { t, face: -1, jab: Math.floor(t / 1.6) % 2 === 0, bob: true });
      drawPerson(DAU_A, 214, 154, { t, face: -1, ball: true, toss: true });
      const bx = 34 + Math.sin(t * 0.7) * 26;
      drawBunny(bx, 128, t, { hop: true, face: Math.cos(t * 0.7) >= 0 ? 1 : -1 });
      drawParts();
    },
  },

  // 3 ---------------------------------------------------------------- THE KOPI RUN
  {
    music: 'adventure', card: ['09:00 AM', 'THE KOPI RUN'], trans: 'bear',
    lines: [
      'Meanwhile, another busy morning at the office...',
      { text: 'In came NIELSEN, dressed smart, with kopi for everyone!', on: (st) => { st.queue.push({ x: 228, d: 3 }, { x: 168, d: 2 }, { x: 108, d: 1 }); } },
      { text: 'And a kopi gao for Angela.', on: (st) => { st.queue.push({ x: 52, d: 0 }); } },
      { text: 'Doki doki!', on: (st, t) => { st.love = t; sfx('jingle'); } },
    ],
    init(st) { st.nx = 290; st.queue = []; st.pause = 0; st.kopi = 4; st.cups = [false, false, false, false]; st.excl = -9; st.love = -9; st.happy = [-9, -9, -9, -9]; },
    draw(t, dt, st) {
      C.drawImage(BG.office, 0, 0);
      let moving = false;
      if (st.queue.length) {
        const q = st.queue[0];
        if (st.pause > 0) { st.pause -= dt; if (st.pause <= 0) st.queue.shift(); }
        else if (Math.abs(st.nx - q.x) > 1) { st.nx += Math.sign(q.x - st.nx) * Math.min(Math.abs(q.x - st.nx), dt * 75); moving = true; }
        else {
          st.pause = q.d === 0 ? 0.01 : 0.6;
          st.cups[q.d] = true; st.kopi--; st.happy[q.d] = t; sfx('blip');
          pop(q.d === 0 ? '♥ KOPI GAO ♥' : '+1 KOPI!', [30, 90, 150, 210][q.d], 96, q.d === 0 ? '#ff4f8b' : '#a8682f');
          if (q.d === 0) { st.excl = t; sfx('surprise'); }
        }
      }
      const cx = [34, 94, 154, 214];
      drawPerson(ANGELA_WORK, cx[0] - 4, 140, { t, bob: true });
      CW.forEach((p, i) => drawPerson(p, cx[i + 1] - 4, 140, { t, bob: true, wave: t - st.happy[i + 1] < 1.6 }));
      cx.forEach((c, i) => kopiDesk(c, st.cups[i], t));
      const atAngela = st.cups[0];
      drawPerson(st.kopi > 0 ? NIELSEN_SUIT : NIELSEN_SUIT_NOKOPI, st.nx, 156, { t, face: -1, walk: moving, bob: !moving, kopi: st.kopi });
      if (t - st.excl < 2 && Math.floor((t - st.excl) * 6) % 2 === 0) bmp(EXCL, 24, 64, { K: EYE, W: WHITE, R: '#e23a3a' }, 2);
      if (st.love > 0) {
        bmp(LOVEB, 22, 64 + Math.round(Math.sin(t * 4)), { K: EYE, W: WHITE, R: '#ff4f8b' }, 2);
        bmp(LOVEB, st.nx - 4, 78 + Math.round(Math.sin(t * 4 + 1)), { K: EYE, W: WHITE, R: '#ff4f8b' }, 2);
        if (Math.random() < dt * 3) floatHeart(rand(24, 60), 96);
      }
      if (atAngela && st.love < 0 && Math.random() < dt) floatHeart(rand(24, 56), 96);
      drawParts();
    },
  },

  // 4 ---------------------------------------------------------------- DOKI DOKI -> RIDE INTO THE SUNSET
  {
    music: 'lullaby', card: ['AND THEN...', 'DOKI DOKI'], trans: 'hearts',
    lines: [
      'Kopi dates turned into weekend rides...',
      { text: 'LOVE LEVEL RISING...', on: (st) => { st.target = 0.55; } },
      { text: "LOVE LEVEL: MAX ♥  It's official: Angela & Nielsen!", on: (st) => { st.beam = true; st.target = 1; sfx('sparkle'); } },
      { text: '...and off they rode into the sunset! ♥', on: (st, t) => { st.ride = t; sfx('jingle'); } },
    ],
    init(st) { st.meter = 0; st.target = 0.12; st.beam = false; st.ride = 0; st.bx = 118; st.v = 0; },
    draw(t, dt, st) {
      C.drawImage(BG.titleSky, 0, 0);
      R(0, 146, W, 14, '#3a2550'); for (let x = (t * 60) % 16 - 16; x < W; x += 16) R(x, 152, 8, 1, '#c86a8a');
      st.meter = lerp(st.meter, st.target, Math.min(1, dt * 1.6));
      const max = st.meter > 0.97;
      if (!st.ride) {
        drawPerson(ANGELA_WORK, 100 + st.meter * 8, 150, { t, bob: true });
        drawPerson(NIELSEN_BIKER, 140 - st.meter * 8, 150, { t, face: -1, bob: true });
        drawBike(176, 150, 0, true);
      } else {
        const rt = t - st.ride;
        if (rt < 0.5) st.bx = lerp(176, 118, rt / 0.5);
        else if (rt > 1.2) { st.v += dt * 150; st.bx += st.v * dt; if (Math.random() < dt * 20) parts.push({ k: 'px', x: st.bx - 30, y: 144, vx: -30, vy: -6, g: 0, life: 0.6, age: 0, col: '#d8d0e0' }); }
        if (st.bx < W + 60) {
          drawPerson(ANGELA_WORK, st.bx - 10, 146, { t, flutter: rt > 1.2 });
          drawPerson(NIELSEN_BIKER, st.bx + 4, 146, { t });
          drawBike(st.bx, 150, rt > 1.2 ? t : 0);
          if (rt > 1.2 && Math.random() < dt * 6) floatHeart(st.bx - 20, 110);
        }
      }
      if (st.beam && !st.ride) {
        const s = 3 + Math.round((Math.sin(t * 6) + 1) * 0.5);
        bmp(HEART7, 120 - Math.round(3.5 * s), 76 - 3 * s, Math.floor(t * 4) % 2 ? '#ff5a9a' : '#ff8fbf', s);
        if (Math.random() < dt * 12) parts.push({ k: 'heart', x: rand(96, 144), y: 104, vx: rand(-30, 30), vy: rand(-40, -20), g: 0, life: 1.6, age: 0, col: pick(['#ff5a9a', '#ff8fbf', '#ffffff']) });
      }
      if (st.meter > 0.08 && !st.ride && Math.random() < dt * (1 + st.meter * 4)) floatHeart(rand(104, 136), 104, pick(['#ff5a9a', '#ff8fbf']));
      drawParts();
      if (!st.ride) {
        const mx = 88, my = 6;
        bmp(HEART7, mx - 10, my, max && Math.floor(t * 6) % 2 ? '#ffffff' : '#ff5a9a');
        R(mx, my, 72, 7, '#ffffff'); R(mx + 1, my + 1, 70, 5, '#2a2050');
        R(mx + 1, my + 1, Math.round(70 * st.meter), 5, max ? RAINBOW[Math.floor(t * 8) % 6] : '#ff5a9a');
      }
    },
  },

  // 5 ---------------------------------------------------------------- THE BIG DAY
  {
    music: 'wedding', card: ['★ ★ ★', 'THE BIG DAY'], trans: 'bunny',
    lines: [
      { text: 'Two families became one BIG, happy family! (Plus Churros, of course.)', on: () => { congrats.classList.add('show'); sfx('jingle'); } },
      { text: 'ACHIEVEMENT UNLOCKED:  ♥ HAPPILY EVER AFTER ♥', on: () => { pop('♥ +1 FAMILY ♥', 116, 84, '#e2466f'); } },
      { text: 'Psst... a letter has arrived for Angela! Tap to open it ✉', on: (st) => { st.env = true; sfx('surprise'); } },
    ],
    end: () => openLetter(),
    init(st) { st.env = false; },
    exit() { congrats.classList.remove('show'); theEnd.classList.remove('show'); },
    draw(t, dt, st) {
      C.drawImage(BG.wedding, 0, 0);
      if (Math.random() < dt * 14) confetti();
      drawBear(BEARS[1], 64, 58 + Math.round(Math.sin(t * 3) * 1), t, { s: 1 });
      drawBear(BEARS[4], 156, 58 + Math.round(Math.sin(t * 3 + 1) * 1), t, { s: 1 });
      drawBear(BEARS[3], 6, 56 + Math.round(Math.sin(t * 2) * 2), t, { s: 1, cloud: true, wave: true });
      drawBear(BEARS[2], 222, 58 + Math.round(Math.sin(t * 2 + 1) * 2), t, { s: 1, cloud: true, wave: true });
      // extended family in the back row
      const back = [12, 44, 84, 148, 186, 222];
      FAMILY.forEach((p, i) => drawPerson(p, back[i], 141, { t, face: i < 3 ? 1 : -1, bob: true, wave: (i === 1 || i === 4) }));
      // the new family of six (+ Churros)
      drawPerson(DAU_A, 26, 155, { t, ball: true, toss: true, bob: true });
      drawPerson(SON_A, 64, 155, { t, hop: true, phase: 1.3 });
      drawPerson(ANGELA_WED, 106, 155, { t, bob: true });
      drawPerson(NIELSEN_WED, 126, 155, { t, face: -1, bob: true });
      drawPerson(DAU_N, 164, 155, { t, face: -1, hop: true, phase: 2.4 });
      drawPerson(SON_N, 200, 155, { t, face: -1, hop: true, phase: 0.4 });
      drawBunny(76, 132, t, { hop: true, hopSpeed: 5, hopH: 4, bow: true });
      if (Math.random() < dt * 2.5) floatHeart(rand(100, 132), 104);
      if (st.env) {
        const ey = 66 + Math.round(Math.sin(t * 3) * 2);
        bmp(ENVELOPE, 101, ey, { B: '#8a5a6a', W: '#fff8f0', P: '#e6b8c8', R: '#ff4f8b' }, 2);
        if (Math.floor(t * 5) % 2) { R(96, ey - 3, 2, 2, '#ffe14d'); R(134, ey + 6, 2, 2, '#ffe14d'); } else { R(132, ey - 4, 2, 2, '#ffffff'); R(97, ey + 16, 2, 2, '#ffffff'); }
      }
      drawParts();
    },
  },
];

// ------------------------------------------------------------------ cute transitions
const TRANS = {
  bunny: { bg: '#ffe3c8', fg: '#ffc79a', motif: ['..X.X..', '..X.X..', '.XXXXX.', '.XXXXX.', '..XXX..'] },
  whisk: { bg: '#dcf2c8', fg: '#b4e08f', motif: ['.XXX.', 'XXXXX', 'XXXXX', '.XXX.'] },
  bear: { bg: '#e3d8ff', fg: '#c8b6ff', motif: ['..X..', 'XXXXX', '.XXX.', '.X.X.'] },
  hearts: { bg: '#ffd6e6', fg: '#ffb3cf', motif: HEART5 },
};
function curtain(x0, x1, k) {
  if (x1 <= x0) return;
  R(x0, 0, x1 - x0, H, k.bg);
  for (let j = 0, y = 6; y < H; j++, y += 20) {
    for (let x = (j % 2) * 12 - 4; x < W + 12; x += 24) {
      if (x >= x0 && x + 7 <= x1) bmp(k.motif, x, y, k.fg);
    }
  }
}
function mascot(kind, ex, t) {
  if (kind === 'bunny') {
    drawBunny(ex - 40, 98, t, { s: 3, hop: true, hopSpeed: 9, hopH: 7 });
  } else if (kind === 'whisk') {
    const y = 40 - Math.round(Math.abs(Math.sin(t * 8)) * 14);
    bmp(WHISK, ex - 30, y, WHISK_PAL, 4);
    for (let i = 0; i < 5; i++) R(ex - 40 - i * 9, y + 50 + ((i * 7) % 12), 3, 3, i % 2 ? '#7cc35a' : '#a8dc7a');
  } else if (kind === 'bear') {
    const y = 52 + Math.round(Math.sin(t * 6) * 5);
    for (let k = 0; k < 6; k++) R(ex - 120, y + 10 + k * 3, 100, 3, RAINBOW[k]);
    drawBear(BEARS[(Math.floor(t) % 5)], ex - 26, y, t, { s: 3, wave: true });
  } else {
    const s = 6 + Math.round(Math.sin(t * 10));
    bmp(HEART7, ex - 7 * s, 80 - 3 * s, '#ff5a9a', s);
    for (let i = 0; i < 6; i++) bmp(HEART5, ex - 60 - i * 14, 30 + ((i * 37) % 100), '#ffffff');
  }
}

// ------------------------------------------------------------------ story controller
let idx = 0, st = {}, sceneT = 0, line = -1;
let typing = null; // { text, start, shown }
let trans = null;  // { phase, t, to, kind }
let cardTimer = null, cardOpen = false, ended = false, letterOpen = false, lastHint = 0;

function enterScene(i) {
  if (scenes[idx] && scenes[idx].exit) scenes[idx].exit();
  idx = i; st = {}; sceneT = 0; line = -1; parts = []; pops.innerHTML = '';
  typing = null; dtext.textContent = ''; dialog.classList.remove('done');
  const s = scenes[i];
  if (s.init) s.init(st);
  if (actx) playSong(s.music);
}
function beginScene() {
  const s = scenes[idx];
  if (s.card) {
    $('cardLvl').textContent = s.card[0];
    $('cardName').textContent = s.card[1];
    card.classList.add('show'); cardOpen = true;
    sfx('jingle');
    cardTimer = setTimeout(closeCard, 1900);
  } else nextLine();
}
function closeCard() {
  clearTimeout(cardTimer);
  if (!cardOpen) return;
  cardOpen = false; card.classList.remove('show');
  nextLine();
}
function nextLine() {
  const s = scenes[idx];
  line++;
  st.wait = null;
  if (line < s.lines.length) {
    let L = s.lines[line];
    if (typeof L === 'string') L = { text: L };
    if (L.on) L.on(st, sceneT);
    if (L.target) st.wait = { L, n: 0, need: L.taps || 1, done: false };
    typing = { text: L.text, start: performance.now(), shown: -1 };
    dialog.classList.remove('done');
  } else if (s.end) s.end();
  else goTo(idx + 1);
}
function goTo(i) {
  if (trans) return;
  trans = { phase: 'out', t: 0, to: i, kind: scenes[i].trans || 'hearts' };
  titleOv.classList.remove('show');
}
function updateTyping(now) {
  if (!typing) return;
  const n = Math.min(typing.text.length, Math.floor((now - typing.start) / 26));
  if (n !== typing.shown) {
    if (n > typing.shown && n % 3 === 0 && n < typing.text.length) sfx('tick');
    typing.shown = n;
    dtext.textContent = typing.text.slice(0, n);
    if (n >= typing.text.length && !st.wait) dialog.classList.add('done');
  }
}
const typingDone = () => !typing || typing.shown >= typing.text.length;

function hitTarget(pos) {
  if (!pos || !st.wait) return false;
  const h = scenes[idx].hot(st)[st.wait.L.target];
  const pad = 9;
  const inside = (r) => r && pos.x >= r.x - pad && pos.x <= r.x + r.w + pad && pos.y >= r.y - pad && pos.y <= r.y + r.h + pad;
  return inside(h) || inside(h.alt);
}
function tapTarget() {
  const w = st.wait;
  w.n++;
  sfx('blip');
  if (w.L.onTap) w.L.onTap(st, w.n, sceneT);
  if (w.n >= w.need) {
    w.done = true;
    if (w.L.done) w.L.done(st, sceneT);
    const myState = st;
    setTimeout(() => { if (st === myState && st.wait === w) nextLine(); }, w.L.delay || 1300);
  }
}
function advance(pos, viaKey) {
  initAudio();
  if (actx && !song) playSong(scenes[idx].music);
  if (letterOpen || ended || trans) return;
  if (idx === 0) { sfx('blip'); goTo(1); return; }
  if (cardOpen) { closeCard(); return; }
  if (st.wait) {
    if (st.wait.done) return;
    if (viaKey || hitTarget(pos)) { if (!typingDone()) typing.start = -1e9; tapTarget(); return; }
    if (!typingDone()) { typing.start = -1e9; return; }
    if (performance.now() - lastHint > 900) {
      lastHint = performance.now();
      const h = scenes[idx].hot(st)[st.wait.L.target];
      pop(`TAP THE ${st.wait.L.label}!`, Math.min(200, Math.max(40, h.x + h.w / 2)), Math.max(16, h.y - 18), '#c2185b');
    }
    return;
  }
  if (!typingDone()) { typing.start = -1e9; return; }
  sfx('blip');
  nextLine();
}

// ------------------------------------------------------------------ letter
function openLetter() {
  letterOpen = true;
  letterWrap.classList.add('open');
  sfx('sparkle');
  letterWrap.querySelector('.letter').focus({ preventScroll: true });
}
function closeLetter() {
  if (!letterOpen) return;
  letterOpen = false;
  letterWrap.classList.remove('open');
  ended = true;
  theEnd.classList.add('show');
  dtext.textContent = 'Massive congratulations, Angela & Nielsen! ♥';
  dialog.classList.remove('done');
}
$('closeLetter').addEventListener('click', (e) => { e.stopPropagation(); closeLetter(); });
letterWrap.addEventListener('pointerdown', (e) => { if (e.target === letterWrap) closeLetter(); });
$('reread').addEventListener('click', (e) => { e.stopPropagation(); theEnd.classList.remove('show'); ended = false; openLetter(); });
$('replay').addEventListener('click', (e) => {
  e.stopPropagation();
  ended = false; theEnd.classList.remove('show');
  goTo(1);
});

// ------------------------------------------------------------------ input
function canvasPos(e) {
  const r = screen.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
window.addEventListener('pointerdown', (e) => {
  if (e.button > 0) return;
  if (e.target.closest('button, .letter-wrap')) return;
  advance(canvasPos(e), false);
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && letterOpen) { closeLetter(); return; }
  if (letterOpen) return;
  if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
    if (e.target.closest && e.target.closest('button')) return;
    e.preventDefault(); advance(null, true);
  }
});

// ------------------------------------------------------------------ main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  sceneT += dt;
  C = ctx;
  updateParts(dt);
  scenes[idx].draw(sceneT, dt, st);

  // "tap here" pointer for interactive steps
  if (st.wait && !st.wait.done && typingDone() && !cardOpen && !trans) {
    const h = scenes[idx].hot(st)[st.wait.L.target];
    if (Math.floor(sceneT * 3) % 2) {
      const c = '#ffffff';
      R(h.x - 3, h.y - 3, h.w + 6, 1, c); R(h.x - 3, h.y + h.h + 2, h.w + 6, 1, c);
      R(h.x - 3, h.y - 3, 1, h.h + 6, c); R(h.x + h.w + 2, h.y - 3, 1, h.h + 6, c);
    }
    const ay = h.y - 20 - Math.round(Math.abs(Math.sin(sceneT * 5)) * 4);
    bmp(ARROW, Math.round(h.x + h.w / 2 - 7), ay, { K: EYE, W: '#ffe14d' }, 2);
  }

  if (trans) {
    trans.t += dt;
    const D = 0.9;
    const p = Math.min(1, trans.t / D);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const edge = -40 + e * (W + 80);
    const k = TRANS[trans.kind];
    if (trans.phase === 'out') {
      curtain(-10, edge, k);
      mascot(trans.kind, edge, sceneT);
      if (p >= 1) { const kind = trans.kind; enterScene(trans.to); trans = { phase: 'in', t: 0, kind }; curtain(-10, W + 10, k); }
    } else {
      curtain(edge, W + 10, k);
      mascot(trans.kind, edge, sceneT);
      if (p >= 1) { trans = null; beginScene(); }
    }
  }
  updateTyping(now);
  requestAnimationFrame(frame);
}

buildBackgrounds();
enterScene(0);
beginScene();
requestAnimationFrame(frame);
})();
