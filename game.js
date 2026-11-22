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
  ...ANGELA, shirtC: '#fff6fa', sleeveC: '#fff6fa', shortSleeve: false, deco: 'kebaya',
  pantsStyle: 'sarong', dressC: '#4a7fd0', dotC: '#ffd166', dot2C: '#ff8fb1', flower: true,
};
const NIELSEN = {
  seed: 1.7, bw: 8, torso: 8, legs: 8,
  hair: 'short', hairC: '#2a2324', glasses: true, glassC: '#3a2a2a', stache: true,
  shirtC: '#9cc9f0', collarC: '#ffffff', deco: 'collar', belt: true,
  pantsStyle: 'trousers', pantsC: '#3c4a6b', shoeC: '#5a3a26',
};
const NIELSEN_WED = { ...NIELSEN, shirtC: '#ffffff', collarC: '#dfe9f5', bowtie: true, pantsC: '#2e3550' };
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
  hair: 'bob', hairC: '#231b1c', glasses: true, glassC: '#7a3fb0',
  shirtC: '#b99cf2', deco: 'cardigan', pantsStyle: 'skirt', pantsC: '#5d4aa3', shoeC: '#3a2a40', prop: 'book',
};
const SON_N = { // Nielsen's boy
  seed: 3.4, bw: 6, torso: 5, legs: 4,
  hair: 'boy', hairC: '#231b1c', cap: '#3b8fe0',
  shirtC: '#ffb347', deco: 'stripes', stripeC: '#ff8a3d', shortSleeve: true,
  pantsStyle: 'shorts', pantsC: '#4a5a7a', shoeC: '#e2463a',
};

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

  // --- back hair
  if (p.hair === 'long') R(-6, 2, 12, 12 + Math.min(torso, 6), hc);
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
  }
  if (p.cap) { R(-5, -1, 10, 3, p.cap); R(-4, -2, 8, 1, p.cap); R(3, 1, 4, 1, '#2a6fc0'); R(-1, -2, 2, 1, WHITE); }
  if (p.headband) R(-5, 1, 10, 1, p.headband);
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
    R(-4, 3, 4, 1, g); R(-4, 6, 4, 1, g); R(-4, 3, 1, 4, g); R(-1, 3, 1, 4, g);
    R(2, 3, 4, 1, g); R(2, 6, 4, 1, g); R(2, 3, 1, 4, g); R(5, 3, 1, 4, g);
    R(0, 4, 2, 1, g);
    if (((t * 0.9 + p.seed) % 2.6) < 0.22 || o.glint) { R(4, 4, 1, 1, WHITE); R(-2, 4, 1, 1, WHITE); }
  }
  if (p.stache) { R(-1, 7, 4, 1, hc); R(0, 8, 2, 1, MOUTH); }
  else R(0, 8, 2, 1, MOUTH);

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
  { c: '#a8e6c1', d: '#5fbf8a', sym: 'matcha' },
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

// ------------------------------------------------------------------ Singapore scenery
function hdb(x, base, w, h, col, dark) {
  const y = base - h;
  R(x, y, w, h, col);
  R(x, y, w, 3, dark);
  for (let yy = y + 6; yy < base - 11; yy += 5) {
    R(x, yy + 3, w, 1, dark);
    for (let xx = x + 3; xx < x + w - 3; xx += 4) R(xx, yy, 2, 2, (xx * 7 + yy * 3) % 5 === 0 ? '#fff3b0' : '#6f84a0');
  }
  R(x + 2, base - 8, w - 4, 8, 'rgba(0,0,0,0.18)');
  for (let xx = x + 2; xx < x + w - 2; xx += 7) R(xx, base - 8, 2, 8, col);
}
function rainTree(x, base) {
  R(x + 9, base - 18, 4, 18, '#8a5a3a');
  R(x - 4, base - 26, 30, 7, '#5fb35a');
  R(x, base - 30, 22, 5, '#5fb35a');
  R(x + 3, base - 34, 16, 4, '#6fc46a');
  R(x - 4, base - 20, 30, 1, '#4a9a48');
  R(x + 4, base - 31, 3, 1, '#9be08a'); R(x + 13, base - 28, 3, 1, '#9be08a'); R(x - 1, base - 24, 3, 1, '#9be08a');
}
function supertree(x, base, h, trunk, canopy, vine, lights) {
  const top = base - h;
  R(x - 1, top, 3, h, trunk);
  R(x - 2, base - 6, 5, 6, trunk);
  for (let y = top + 3; y < base - 2; y += 3) { R(x - 1, y, 1, 1, vine); R(x + 1, y + 1, 1, 1, vine); }
  for (let i = 0; i < 7; i++) R(x - 2 - i * 2, top - i, 5 + i * 4, 1, canopy);
  for (let i = 0; i < 7; i += 2) R(x - 2 - i * 2, top - i, 1, 1, lights || vine);
  if (lights) for (let i = 1; i < 7; i += 2) R(x + 2 + i * 2, top - i, 1, 1, lights);
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

  BG.hdb = layer(W, H, () => {
    [[4, 34, 62, '#f7c6c6', '#e8a8a8'], [44, 28, 76, '#c8e3f7', '#a3c8e6'], [78, 36, 56, '#f7e7b0', '#e6cf86'],
     [122, 30, 72, '#d4c8f2', '#b6a6e0'], [160, 34, 60, '#bfe8d4', '#98d2b6'], [200, 32, 80, '#f7d2b0', '#e6b48a']]
      .forEach(([x, w, h, c, d]) => hdb(x, 112, w, h, c, d));
  });
  BG.trees = layer(W, H, () => {
    [40, 100, 160, 220].forEach((x) => R(x, 99, 4, 29, '#cfd6dc'));
    [10, 70, 130, 190].forEach((x) => rainTree(x, 128));
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

  BG.garden = layer(W, H, () => {
    sky(['#a9dcff', '#c4e7ff', '#dff1ff', '#ffe6f1', '#ffd6e8'], 0, 132);
    cloud(150, 18); cloud(92, 34); cloud(20, 12);
    // glass domes far away
    for (let dy = 0; dy < 20; dy++) { const w = Math.round(30 * Math.sqrt(1 - (dy / 20) ** 2)); R(120 - w, 132 - dy, w * 2, 1, dy % 4 ? '#d6e6f2' : '#c2d6e6'); }
    for (let dy = 0; dy < 14; dy++) { const w = Math.round(18 * Math.sqrt(1 - (dy / 14) ** 2)); R(158 - w, 132 - dy, w * 2, 1, dy % 4 ? '#dcefe6' : '#c6e0d4'); }
    // supertrees with skyway
    R(26, 74, 36, 2, '#cdb8e6');
    supertree(26, 132, 86, '#8a5bb0', '#a77bd0', '#6cc48f');
    supertree(62, 132, 70, '#7a4fa0', '#9b6fc8', '#6cc48f');
    supertree(200, 132, 92, '#8a5bb0', '#b48ce0', '#6cc48f');
    supertree(228, 132, 64, '#7a4fa0', '#9b6fc8', '#6cc48f');
    R(0, 132, W, 28, '#86d07a');
    R(0, 142, W, 12, '#f0dfb8'); R(0, 142, W, 1, '#d9c595'); R(0, 153, W, 1, '#d9c595');
    const fl = ['#ff7aa8', '#ffe14d', '#ffffff', '#c39bff'];
    for (let i = 0; i < 40; i++) { const x = (i * 37) % W, y = 134 + (i * 13) % 7; R(x, y, 1, 1, fl[i % 4]); }
    for (let i = 0; i < 30; i++) { const x = (i * 53 + 11) % W, y = 155 + (i * 7) % 4; R(x, y, 1, 1, fl[(i + 1) % 4]); }
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

  BG.shophouse = layer(W, H, () => {
    sky(['#8fd3ff', '#a9ddff', '#c6e9ff', '#e4f5ff'], 0, 60);
    const cx = 120, cy = 84;
    for (let y = 0; y < 50; y++) for (let x = 0; x < W; x++) {
      const band = Math.floor((Math.hypot(x - cx, y - cy) - 52) / 4);
      if (band >= 0 && band < 6) R(x, y, 1, 1, RAINBOW[5 - band]);
    }
    cloud(4, 36); cloud(214, 34); cloud(160, 10);
    const units = [['#a6e3c8', '#7cc9a6'], ['#f6b3c8', '#e48aa8'], ['#a9d4f5', '#7fb3e0'], ['#f6e2a0', '#e3c26e']];
    const cream = '#fffaf0';
    units.forEach(([c, cd], u) => {
      const x0 = u * 60;
      R(x0, 46, 60, 5, '#c4563c'); for (let i = 0; i < 60; i += 3) R(x0 + i, 46, 1, 5, '#a8452f');
      R(x0, 51, 60, 1, '#7a2e20');
      R(x0, 52, 60, 44, c);
      R(x0, 52, 60, 2, cream);
      for (let i = 0; i < 15; i++) { R(x0 + i * 4, 55, 4, 4, i % 2 ? '#ffffff' : '#4f8fe0'); R(x0 + i * 4 + 1, 56, 2, 2, i % 2 ? '#e2466f' : '#ffd23f'); }
      R(x0, 59, 60, 1, cream);
      [x0 + 9, x0 + 37].forEach((wx) => {
        R(wx - 1, 63, 16, 27, cream);
        R(wx + 1, 64, 12, 4, '#ffe7a0'); R(wx + 1, 64, 1, 1, cream); R(wx + 12, 64, 1, 1, cream); R(wx + 7, 64, 1, 4, cream);
        R(wx, 69, 14, 20, '#3d8f6a');
        for (let y = 70; y < 88; y += 2) R(wx + 1, y, 12, 1, '#2f7356');
        R(wx + 7, 69, 1, 20, '#24543f');
        R(wx - 2, 89, 18, 2, cream);
      });
      R(x0, 52, 3, 44, cream); R(x0 + 57, 52, 3, 44, cream);
      R(x0, 92, 60, 3, cream); R(x0, 95, 60, 1, '#d9cbb8');
      // five-foot way
      R(x0, 96, 60, 42, cd); R(x0, 96, 60, 3, 'rgba(0,0,0,0.15)');
      R(x0 + 21, 100, 18, 38, '#5a3420');
      R(x0 + 22, 108, 7, 28, '#a8683a'); R(x0 + 31, 108, 7, 28, '#a8683a');
      R(x0 + 24, 112, 3, 3, '#ffcf5a'); R(x0 + 33, 112, 3, 3, '#ffcf5a');
      R(x0 + 22, 121, 16, 1, '#7a4a2a'); R(x0 + 24, 126, 3, 3, '#ffcf5a'); R(x0 + 33, 126, 3, 3, '#ffcf5a');
      [x0 + 7, x0 + 43].forEach((sx) => {
        R(sx, 106, 10, 14, cream); R(sx + 1, 107, 8, 12, '#2f5a4a');
        for (let i = 0; i < 4; i++) R(sx + 2 + i * 2, 107, 1, 12, cream);
      });
      // pillar with peranakan tiles
      R(x0, 96, 5, 42, cream);
      const tc = ['#4f8fe0', '#e2466f', '#5fbf8a', '#ffd23f'];
      for (let y = 118, i = u; y < 136; y += 4, i++) R(x0 + 1, y, 3, 3, tc[i % 4]);
      // lanterns
      [x0 + 14, x0 + 46].forEach((lx) => {
        R(lx + 2, 96, 1, 3, '#3a2a20'); R(lx, 99, 5, 1, '#ffcf5a');
        R(lx, 100, 5, 7, '#e2363a'); R(lx - 1, 101, 7, 5, '#e2363a'); R(lx + 1, 101, 1, 4, '#ff7a6a');
        R(lx, 107, 5, 1, '#ffcf5a'); R(lx + 2, 108, 1, 3, '#ffcf5a');
      });
    });
    R(235, 96, 5, 42, cream);
    // bunting
    const bc = ['#ff7aa8', '#ffe14d', '#8fe3a0', '#8cc8ff', '#c39bff'];
    for (let x = 0, i = 0; x < W; x += 6, i++) { R(x, 97, 6, 1, '#ffffff'); R(x + 1, 98, 4, 1, bc[i % 5]); R(x + 2, 99, 2, 1, bc[i % 5]); }
    // tiled floor
    R(0, 138, W, 22, '#f3e9d8');
    for (let y = 139, r = 0; y < H; y += 6, r++) for (let x = (r % 2) * 6; x < W; x += 12) { R(x, y, 6, 6, '#e7a07a'); R(x + 2, y + 2, 2, 2, '#5a9fd4'); }
    R(0, 138, W, 1, '#c9b89e');
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
const scenes = [
  // 0 ---------------------------------------------------------------- TITLE
  {
    music: null,
    lines: ['♪ Sound on for the full experience! Tap anywhere to begin your quest...'],
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
    },
  },

  // 1 ---------------------------------------------------------------- LEVEL 1
  {
    music: 'adventure', card: ['LEVEL 1', 'LITTLE ADVENTURERS'],
    lines: [
      'Once upon a time, in sunny Singapore, lived a hero named ANGELA.',
      'Long brown hair. Big sparkly eyes. Infinite patience. (Mostly.)',
      'And she never adventured alone. Her party: two brave little sidekicks!',
      { text: 'Her son: muay thai fighter in training. Tight black tee. Serious shorts.', on: (st) => { st.jab = true; pop('KAPOW!', 126, 96, '#e23a3a'); } },
      { text: 'Her daughter: netball superstar. Never, ever drops a pass!', on: (st) => { st.toss = true; pop('NICE CATCH!', 66, 66, '#1a9a8e', 700); } },
    ],
    init(st) { st.scroll = 0; },
    draw(t, dt, st) {
      st.scroll += dt * 26;
      sky(['#8fd3ff', '#a8ddff', '#c3e8ff', '#e0f4ff'], 0, 112);
      R(0, 108, W, 20, '#b4e2a4'); R(0, 108, W, 1, '#c8ecb8');
      cloud(((40 - st.scroll * 0.08) % 280 + 280) % 280 - 30, 12);
      cloud(((180 - st.scroll * 0.08) % 280 + 280) % 280 - 30, 28);
      drawLoop(BG.hdb, st.scroll * 0.25);
      // MRT line
      R(0, 96, W, 4, '#cfd6dc'); R(0, 99, W, 1, '#aab3bb');
      const tx = 300 - ((t * 75) % 600);
      for (let k = 0; k < 3; k++) {
        const cx = tx + k * 30;
        R(cx, 86, 28, 10, '#f4f6f8'); R(cx, 91, 28, 2, '#e2363a');
        for (let w = 3; w < 26; w += 6) R(cx + w, 88, 4, 2, '#5a7a9a');
      }
      R(tx - 3, 88, 3, 8, '#f4f6f8');
      drawLoop(BG.trees, st.scroll * 0.6);
      R(0, 128, W, 6, '#7cc96a'); R(0, 128, W, 1, '#9be08a');
      R(0, 134, W, 26, '#e8d3a8');
      for (let i = -1; i < 14; i++) { const x = i * 20 - (st.scroll % 20); R(x, 139, 8, 2, '#d8bf8f'); R(x + 11, 153, 6, 2, '#d8bf8f'); }
      for (let i = -1; i < 26; i++) { const x = i * 10 - (st.scroll % 10); R(x, 130, 1, 1, i % 3 ? '#ffffff' : '#ff8fb1'); }

      drawPerson(DAU_A, 52, 154, { t, walk: !st.toss, ball: true, toss: st.toss });
      drawPerson(SON_A, 96, 154, { t, walk: true, jab: st.jab });
      drawPerson(ANGELA, 146, 154, { t, walk: true });
      if (Math.random() < dt * 0.8) floatHeart(rand(50, 150), 100);
      drawParts();
    },
  },

  // 2 ---------------------------------------------------------------- LEVEL 2 (matcha)
  {
    music: 'adventure', card: ['LEVEL 2', 'THE MATCHA MOMENT'],
    lines: [
      'Every hero needs a power-up.',
      { text: "Angela's secret weapon? A perfectly whisked bowl of matcha.", on: (st) => { st.speed = 2.2; } },
      { text: 'Whisk whisk whisk whisk whisk...', on: (st) => { st.speed = 5; pop('WHISK!', 140, 96, '#4a9a3a'); pop('WHISK!', 92, 90, '#4a9a3a', 500); } },
      { text: '+100 CALM!  +100 FOCUS!  +100 ZEN!', on: (st) => {
        st.speed = 1.2; st.glow = 1; sfx('jingle');
        pop('+100 CALM', 70, 80, '#4a9a3a'); pop('+100 FOCUS', 160, 74, '#4a9a3a', 350); pop('+100 ZEN', 116, 60, '#ff4f8b', 700);
      } },
    ],
    init(st) { st.speed = 0.8; st.glow = 0; },
    draw(t, dt, st) {
      C.drawImage(BG.room, 0, 0);
      drawBear(BEARS[1], 184, 16, t);
      drawPerson(ANGELA, 108, 128, { t, bob: true });
      // whisk + bowl
      const wx = Math.round(113 + Math.sin(t * st.speed * 6) * 3);
      R(wx + 2, 99, 2, 9, '#d8b878'); R(wx + 2, 99, 2, 1, '#b8985a');
      R(wx, 107, 6, 7, '#e8cc90'); for (let i = 0; i < 6; i += 2) R(wx + i, 108, 1, 6, '#c9a868');
      R(107, 113, 18, 2, '#55697d'); R(108, 115, 16, 4, '#3b4a5a'); R(110, 119, 12, 1, '#3b4a5a');
      R(109, 113, 14, 1, '#7cc35a');
      for (let i = 0; i < 4; i++) if (Math.floor(t * st.speed * 4 + i) % 3 === 0) R(110 + i * 3, 113, 1, 1, '#b8e89a');
      // table
      R(64, 120, 112, 5, '#8a5a3a'); R(64, 120, 112, 1, '#a8724a');
      R(68, 125, 104, 10, '#6e4630'); R(68, 125, 104, 1, '#5a3826');
      R(70, 135, 6, 9, '#5a3826'); R(164, 135, 6, 9, '#5a3826');
      R(150, 117, 7, 3, '#f3efe6'); R(151, 116, 5, 1, '#ffffff');
      // steam
      for (let i = 0; i < 6; i++) {
        const ph = (t * 9 + i * 4) % 22;
        R(112 + i * 2 + Math.round(Math.sin(ph * 0.4 + i) * 1.5), 111 - ph, 1, 1, ph < 16 ? '#ffffff' : '#f3e6da');
      }
      if (st.glow) {
        for (let i = 0; i < 10; i++) {
          const a = t * 2 + i * 0.63, r = 30 + Math.sin(t * 3 + i) * 4;
          if ((i + Math.floor(t * 6)) % 3) R(116 + Math.cos(a) * r, 104 + Math.sin(a) * r * 0.6, 2, 2, i % 2 ? '#8fe36a' : '#fff6a0');
        }
      }
      drawPerson(SON_A, 182, 154, { t, face: -1, bob: true });
      drawPerson(DAU_A, 214, 154, { t, face: -1, ball: true, bob: true });
      drawParts();
    },
  },

  // 3 ---------------------------------------------------------------- LEVEL 3 (encounter)
  {
    music: 'adventure', card: ['LEVEL 3', 'A NEW ENCOUNTER'],
    lines: [
      'One sunny day, out on a stroll through the Gardens...',
      { text: '!!! A KIND STRANGER APPEARS !!!', on: (st, t) => { st.walking = true; st.excl = t; sfx('surprise'); } },
      { text: "It's NIELSEN!  Glasses: ✓  Tiny moustache: ✓  Crisp collared shirt: ✓", on: (st) => { st.nx = Math.min(st.nx, 190); } },
      { text: 'And he had a party of his own: a clever, bespectacled daughter and a cheeky little son!', on: (st) => { st.glint = true; pop('✦', 192, 112, '#7a3fb0'); } },
      { text: 'Six new friends, waving hello. Something sparkly is in the air...', on: (st, t) => { st.wave = true; st.love = t; } },
    ],
    init(st) { st.nx = 290; st.walking = false; st.excl = -9; st.love = -9; },
    draw(t, dt, st) {
      C.drawImage(BG.garden, 0, 0);
      const moving = st.walking && st.nx > 150;
      if (moving) st.nx = Math.max(150, st.nx - dt * 70);
      drawPerson(DAU_A, 24, 154, { t, ball: true, bob: true, wave: st.wave });
      drawPerson(SON_A, 58, 154, { t, bob: true, wave: st.wave });
      drawPerson(ANGELA, 94, 154, { t, bob: true });
      drawPerson(NIELSEN, st.nx, 154, { t, face: -1, walk: moving, bob: !moving });
      drawPerson(DAU_N, st.nx + 34, 154, { t, face: -1, walk: moving, bob: !moving, glint: st.glint && Math.floor(t * 2) % 3 === 0, wave: st.wave && !moving });
      drawPerson(SON_N, st.nx + 64, 154, { t, face: -1, walk: moving, bob: !moving, wave: st.wave && !moving });
      if (t - st.excl < 2.2 && Math.floor((t - st.excl) * 6) % 2 === 0) bmp(EXCL, 88, 78, { K: EYE, W: WHITE, R: '#e23a3a' }, 2);
      if (st.love > 0) {
        bmp(LOVEB, 85, 78 + Math.round(Math.sin(t * 4)), { K: EYE, W: WHITE, R: '#ff4f8b' }, 2);
        bmp(LOVEB, st.nx - 9, 76 + Math.round(Math.sin(t * 4 + 1)), { K: EYE, W: WHITE, R: '#ff4f8b' }, 2);
        if (Math.random() < dt * 2) floatHeart(rand(100, 145), 100);
      }
      drawParts();
    },
  },

  // 4 ---------------------------------------------------------------- LEVEL 4 (love)
  {
    music: 'lullaby', card: ['LEVEL 4', 'DOKI DOKI'],
    lines: [
      'One starry night by the bay, two hearts went... doki doki.',
      { text: 'LOVE LEVEL RISING...', on: (st) => { st.target = 0.55; } },
      { text: 'Then the Cuddle Bears noticed. (The Cuddle Bears ALWAYS notice.)', on: (st) => { st.bears = 1; } },
      { text: '✦ RAINBOW BEAR HUG!!! ✦', on: (st) => { st.beam = true; st.target = 1; sfx('sparkle'); } },
      { text: "LOVE LEVEL: MAX ♥  It's official: Angela & Nielsen!", on: (st) => { st.close = true; st.fw = 0; sfx('jingle'); } },
    ],
    init(st) { st.meter = 0; st.target = 0.12; st.bears = 0; st.by = 0; st.beam = false; st.close = false; st.ax = 98; st.nx = 150; },
    draw(t, dt, st) {
      C.drawImage(BG.night, 0, 0);
      for (let i = 0; i < 14; i++) if (Math.floor(t * 3 + i * 1.7) % 4 === 0) R((i * 71 + 13) % W, (i * 29 + 5) % 90, 1, 1, '#ffffff');
      for (let i = 0; i < 9; i++) R(((i * 31 + t * 8) % W), 124 + (i * 5) % 13, 4 + (i % 3), 1, i % 2 ? '#ffe08a' : '#5a6ab0');
      st.meter = lerp(st.meter, st.target, Math.min(1, dt * 1.6));
      st.by = lerp(st.by, st.bears, Math.min(1, dt * 2));
      if (st.close) { st.ax = lerp(st.ax, 108, dt * 2.5); st.nx = lerp(st.nx, 128, dt * 2.5); }
      const max = st.meter > 0.97;

      drawPerson(DAU_A, 20, 154, { t, ball: true, bob: !max, hop: max, phase: 0 });
      drawPerson(SON_A, 54, 154, { t, bob: !max, hop: max, phase: 1 });
      drawPerson(DAU_N, 186, 154, { t, face: -1, bob: !max, hop: max, phase: 2 });
      drawPerson(SON_N, 218, 154, { t, face: -1, bob: !max, hop: max, phase: 3 });
      drawPerson(ANGELA, st.ax, 154, { t, bob: true });
      drawPerson(NIELSEN, st.nx, 154, { t, face: -1, bob: true });

      // bears on clouds
      const bx = [8, 58, 156, 206];
      if (st.beam) {
        bx.forEach((x, i) => rainbowBeam(x + 13, -60 + st.by * 78 + 24, 118, 76, t + i * 0.2));
        const s = 3 + Math.round((Math.sin(t * 6) + 1) * 0.5);
        bmp(HEART7, 118 - Math.round(3.5 * s), 76 - 3 * s, Math.floor(t * 4) % 2 ? '#ff5a9a' : '#ff8fbf', s);
      }
      bx.forEach((x, i) => {
        const y = -60 + st.by * 78 + Math.round(Math.sin(t * 2 + i) * 2);
        if (st.by > 0.02) drawBear(BEARS[i === 1 ? 4 : i], x, y, t, { cloud: true, wave: !st.beam });
      });
      if (st.meter > 0.08 && Math.random() < dt * (1 + st.meter * 5)) floatHeart(rand(104, 132), 100, pick(['#ff5a9a', '#ff8fbf', '#ffffff']));
      if (st.close) { st.fw -= dt; if (st.fw <= 0) { st.fw = rand(0.4, 0.9); burst(rand(20, 220), rand(10, 50), pick(['#ffe14d', '#ff7aa8', '#8fe3ff', '#c39bff'])); } }
      drawParts();

      // love meter
      const mx = 88, my = 6;
      bmp(HEART7, mx - 10, my, max && Math.floor(t * 6) % 2 ? '#ffffff' : '#ff5a9a');
      R(mx, my, 72, 7, '#ffffff'); R(mx + 1, my + 1, 70, 5, '#2a2050');
      R(mx + 1, my + 1, Math.round(70 * st.meter), 5, max ? RAINBOW[Math.floor(t * 8) % 6] : '#ff5a9a');
      R(mx + 1, my + 1, Math.round(70 * st.meter), 1, '#ffc2dc');
    },
  },

  // 5 ---------------------------------------------------------------- LEVEL 5 (wedding)
  {
    music: 'wedding', card: ['FINAL LEVEL', 'THE BIG DAY'],
    lines: [
      { text: 'Two little parties joined up into one BIG, happy party of six!', on: () => { congrats.classList.add('show'); sfx('jingle'); } },
      { text: 'ACHIEVEMENT UNLOCKED:  ♥ HAPPILY EVER AFTER ♥', on: () => { pop('♥ +1 FAMILY ♥', 116, 84, '#e2466f'); } },
      { text: 'Psst... a letter has arrived for Angela! Tap to open it ✉', on: (st) => { st.env = true; sfx('surprise'); } },
    ],
    end: () => openLetter(),
    init(st) { st.env = false; },
    exit() { congrats.classList.remove('show'); theEnd.classList.remove('show'); },
    draw(t, dt, st) {
      C.drawImage(BG.shophouse, 0, 0);
      if (Math.random() < dt * 14) confetti();
      drawBear(BEARS[1], 70, 73, t, { s: 1 });   // peeking out of the shutters
      drawBear(BEARS[4], 158, 73, t, { s: 1 });
      drawBear(BEARS[3], 4, 60 + Math.round(Math.sin(t * 2) * 2), t, { cloud: true, wave: true });
      drawBear(BEARS[2], 210, 62 + Math.round(Math.sin(t * 2 + 1) * 2), t, { cloud: true, wave: true });

      drawPerson(DAU_A, 26, 155, { t, ball: true, toss: true, bob: true });
      drawPerson(SON_A, 64, 155, { t, hop: true, phase: 1.3 });
      drawPerson(ANGELA_WED, 106, 155, { t, bob: true });
      drawPerson(NIELSEN_WED, 126, 155, { t, face: -1, bob: true });
      drawPerson(DAU_N, 164, 155, { t, face: -1, hop: true, phase: 2.4 });
      drawPerson(SON_N, 200, 155, { t, face: -1, hop: true, phase: 0.4 });
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

// ------------------------------------------------------------------ story controller
let idx = 0, st = {}, sceneT = 0, line = -1;
let typing = null; // { text, start, shown }
let trans = null;  // { phase, t, to }
let cardTimer = null, cardOpen = false, ended = false, letterOpen = false;

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
    cardTimer = setTimeout(closeCard, 1800);
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
  if (line < s.lines.length) {
    let L = s.lines[line];
    if (typeof L === 'string') L = { text: L };
    if (L.on) L.on(st, sceneT);
    typing = { text: L.text, start: performance.now(), shown: -1 };
    dialog.classList.remove('done');
  } else if (s.end) s.end();
  else goTo(idx + 1);
}
function goTo(i) {
  if (trans) return;
  trans = { phase: 'out', t: 0, to: i };
}
function updateTyping(now) {
  if (!typing) return;
  const n = Math.min(typing.text.length, Math.floor((now - typing.start) / 26));
  if (n !== typing.shown) {
    if (n > typing.shown && n % 3 === 0 && n < typing.text.length) sfx('tick');
    typing.shown = n;
    dtext.textContent = typing.text.slice(0, n);
    if (n >= typing.text.length) { dialog.classList.add('done'); }
  }
}
const typingDone = () => !typing || typing.shown >= typing.text.length;

function advance() {
  initAudio();
  if (actx && !song) playSong(scenes[idx].music);
  if (letterOpen || ended || trans) return;
  if (idx === 0) { sfx('blip'); goTo(1); return; }
  if (cardOpen) { closeCard(); return; }
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
window.addEventListener('pointerdown', (e) => {
  if (e.button > 0) return;
  if (e.target.closest('button, .letter-wrap')) return;
  advance();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && letterOpen) { closeLetter(); return; }
  if (letterOpen) return;
  if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
    if (e.target.closest && e.target.closest('button')) return;
    e.preventDefault(); advance();
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

  if (trans) {
    trans.t += dt;
    const D = 0.6;
    let r;
    if (trans.phase === 'out') {
      r = 150 * (1 - trans.t / D);
      if (trans.t >= D) { enterScene(trans.to); trans = { phase: 'in', t: 0 }; r = 0; }
    } else {
      r = 150 * (trans.t / D);
      if (trans.t >= D) { trans = null; beginScene(); }
    }
    if (trans || r < 150) {
      ctx.fillStyle = '#1a1024';
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W / 2, H / 2 + 10, Math.max(0, r), 0, Math.PI * 2, true);
      ctx.fill('evenodd');
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
