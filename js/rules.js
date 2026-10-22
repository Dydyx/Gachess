/*
 * Moteur de règles : échecs classiques, pièces « Commun » et archétypes.
 * Utilisable dans la page et dans un Web Worker (aucune dépendance au DOM).
 *
 * Géométrie :
 *   - plateau principal : cadre fixe 10×10 (colonnes z,a..h,i ; rangées 0..9). Seul le cœur a1..h8
 *     existe au départ ; les Géomanciens peuvent détruire ou créer des cases (tableau `ex`).
 *   - plan secondaire des Outremondes : 8×8 (cases 100..163), mêmes coordonnées a1..h8 que le cœur.
 *   case   = rang * 10 + colonne (plateau principal) ; 100 + (rang - 1) * 8 + (colonne - 1) (plan)
 *   pièce  = type | (couleur << 7)  (0 = case vide)
 *   coup   = from | to << 8 | promo << 16 | flag << 23  +  (extra + 1) × 2^28  (extra : case secondaire)
 */
(function (G) {
  'use strict';

  const WHITE = 0, BLACK = 1;
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6, BI = 7, RE = 8, VO = 9, LO = 10, CH = 11, SO = 12;
  // Archétypes : 6 pièces chacun, dans l'ordre Pion, Cavalier, Fou, Tour, Dame, Roi
  const VIREPAS = 13, SYLPHE = 14, MIROITIER = 15, TRAVERSE = 16, VAGABONDE = 17, PASSEBRUME = 18;
  const PAVOIS = 19, ESCORTEUR = 20, TISSEUR = 21, BASTION = 22, EGIDE = 23, CASTELLAN = 24;
  const MORDANT = 25, HARPON = 26, PERCEVOILE = 27, FRACASSEUR = 28, VENDETTA = 29, DUELARQUE = 30;
  const ECLAIREUR = 31, ESTAFETTE = 32, AURORAL = 33, BELIER = 34, MENEUSE = 35, PORTE = 36;
  const CENDRE = 37, RAPPELANT = 38, PSALMISTE = 39, RELIQUAIRE = 40, ANAMNESE = 41, LEGATAIRE = 42;
  const LUMIGNON = 43, SATELLITE = 44, HELIOPHANTE = 45, OBELISQUE = 46, AUREOLE = 47, ZENARQUE = 48;
  const SILLONNEUR = 49, RUNAMBULE = 50, SIGILLAIRE = 51, GRAVEBORNE = 52, CARTOMANCIENNE = 53, CLEARQUE = 54;
  const GOULOT = 55, CROQUELUNE = 56, MANDIBULE = 57, GOINFROI = 58, DEVORACLE = 59, GASTRARQUE = 60;
  const SAPEUR = 61, TERRASSIER = 62, ARPENTEUR = 63, BATISSEUSE = 64, TELLURIQUE = 65, DEMIURGE = 66;
  const FUGUEUR = 67, PASSEMONDE = 68, REFRACTEUR = 69, ARCHE = 70, UBIQUISTE = 71, EXILARQUE = 72;
  const BALANCIER = 73, ECHAPPEMENT = 74, GNOMON = 75, ROUAGE = 76, PENDULE = 77, CHRONARQUE = 78;
  const NTYPES = 78, NARCH = 11;

  // Glyphes des Palimpsestes (type de glyphe = famille de la pièce qui le trace)
  const G_ELAN = 1, G_TREMPLIN = 2, G_MUE = 3, G_ENTRAVE = 4, G_PASSAGE = 5, G_SILENCE = 6;
  const GLYPH_NAMES = [null, 'Élan', 'Tremplin', 'Mue', 'Entrave', 'Passage', 'Silence'];
  const G_ARMED = 64;

  const FLAG_DOUBLE = 1, FLAG_EP = 2, FLAG_CK = 3, FLAG_CQ = 4,
    FLAG_SWAP = 5, FLAG_FOLLOW = 6, FLAG_BELIER = 7, FLAG_MENEUSE = 8, FLAG_RES = 9,
    FLAG_TRACE = 10, FLAG_GLYPH = 11, FLAG_ABSORB = 12, FLAG_APO = 13, FLAG_BONUS = 14,
    FLAG_DESTROY = 15, FLAG_CREATE = 16, FLAG_COLLAPSE = 17, FLAG_QUAKE = 18,
    FLAG_OPEN = 19, FLAG_SHIFT = 20, FLAG_ECHO = 21, FLAG_ROT = 22;

  const KEYS = [null, 'pion', 'cavalier', 'fou', 'tour', 'dame', 'roi',
    'biaiseur', 'rempart', 'voltigeur', 'louvoyeur', 'chimere', 'souverain',
    'virepas', 'sylphe', 'miroitier', 'traverse', 'vagabonde', 'passebrume',
    'pavois', 'escorteur', 'tisseur', 'bastion', 'egide', 'castellan',
    'mordant', 'harpon', 'percevoile', 'fracasseur', 'vendetta', 'duelarque',
    'eclaireur', 'estafette', 'auroral', 'belier', 'meneuse', 'porte-enseigne',
    'cendre', 'rappelant', 'psalmiste', 'reliquaire', 'anamnese', 'legataire',
    'lumignon', 'satellite', 'heliophante', 'obelisque', 'aureole', 'zenarque',
    'sillonneur', 'runambule', 'sigillaire', 'graveborne', 'cartomancienne', 'clearque',
    'goulot', 'croquelune', 'mandibule', 'goinfroi', 'devoracle', 'gastrarque',
    'sapeur', 'terrassier', 'arpenteur', 'batisseuse', 'tellurique', 'demiurge',
    'fugueur', 'passemonde', 'refracteur', 'arche', 'ubiquiste', 'exilarque',
    'balancier', 'echappement', 'gnomon', 'rouage', 'pendule', 'chronarque'];
  const NAMES = [null, 'Pion', 'Cavalier', 'Fou', 'Tour', 'Dame', 'Roi',
    'Biaiseur', 'Rempart', 'Voltigeur', 'Louvoyeur', 'Chimère', 'Souverain',
    'Virepas', 'Sylphe', 'Miroitier', 'Traverse', 'Vagabonde', 'Passebrume',
    'Pavois', 'Escorteur', 'Tisseur', 'Bastion', 'Égide', 'Castellan',
    'Mordant', 'Harpon', 'Percevoile', 'Fracasseur', 'Vendetta', 'Duelarque',
    'Éclaireur', 'Estafette', 'Auroral', 'Bélier', 'Meneuse', 'Porte-enseigne',
    'Cendre', 'Rappelant', 'Psalmiste', 'Reliquaire', 'Anamnèse', 'Légataire',
    'Lumignon', 'Satellite', 'Héliophante', 'Obélisque', 'Auréole', 'Zénarque',
    'Sillonneur', 'Runambule', 'Sigillaire', 'Graveborne', 'Cartomancienne', 'Cléarque',
    'Goulot', 'Croquelune', 'Mandibule', 'Goinfroi', 'Dévoracle', 'Gastrarque',
    'Sapeur', 'Terrassier', 'Arpenteur', 'Bâtisseuse', 'Tellurique', 'Démiurge',
    'Fugueur', 'Passemonde', 'Réfracteur', 'Arche', 'Ubiquiste', 'Exilarque',
    'Balancier', 'Échappement', 'Gnomon', 'Rouage', 'Pendule', 'Chronarque'];
  const ARCH_NAMES = ['Commun', 'Errants', 'Veilleurs', 'Ravageurs', 'Pionniers', 'Rémanents',
    'Héliarques', 'Palimpsestes', 'Voraces', 'Géomanciens', 'Outremondes', 'Horlogers'];

  const FAM = new Uint8Array(NTYPES + 1), MOVE = new Uint8Array(NTYPES + 1), ARCH = new Uint8Array(NTYPES + 1);
  for (let t = 1; t <= 6; t++) { FAM[t] = t; MOVE[t] = t; }
  [[BI, P], [RE, R], [VO, N], [LO, B], [CH, Q], [SO, K]].forEach(([t, f]) => { FAM[t] = f; MOVE[t] = t; });
  const SLOT_ORDER = [P, N, B, R, Q, K];
  for (let a = 0; a < NARCH; a++) {
    for (let i = 0; i < 6; i++) {
      const t = 13 + a * 6 + i;
      FAM[t] = SLOT_ORDER[i]; MOVE[t] = SLOT_ORDER[i]; ARCH[t] = a + 1;
    }
  }
  const archPiece = (a, fam) => 13 + (a - 1) * 6 + SLOT_ORDER.indexOf(fam);
  const COMMUN_ALT = { 1: BI, 2: VO, 3: LO, 4: RE, 5: CH, 6: SO };

  const VALUES = new Int16Array(NTYPES + 1);
  [0, 100, 320, 330, 500, 900, 0, 95, 450, 170, 550, 620, 0].forEach((v, i) => { VALUES[i] = v; });
  const BONUS = { 1: 15, 2: 40, 3: 40, 4: 40, 5: 60, 6: 0 };
  for (let t = 13; t <= NTYPES; t++) VALUES[t] = VALUES[FAM[t]] + BONUS[FAM[t]];

  const PROMOS = [];
  PROMOS[P] = [Q, N, R, B];
  PROMOS[BI] = [Q, N, R, B, CH, VO, RE, LO];
  for (let a = 1; a <= NARCH; a++) PROMOS[archPiece(a, P)] = [Q, N, R, B, archPiece(a, Q), archPiece(a, N), archPiece(a, R), archPiece(a, B)];

  const KEY_TO_TYPE = {};
  KEYS.forEach((k, i) => { if (k) KEY_TO_TYPE[k] = i; });
  const UCI_PROMO = { 2: 'n', 3: 'b', 4: 'r', 5: 'q' };
  const FEN_LETTER = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };

  // ---------- Géométrie ----------
  const NMAIN = 100, NCELLS = 164;
  const CELL_B = new Uint8Array(NCELLS), CELL_F = new Int8Array(NCELLS), CELL_R = new Int8Array(NCELLS);
  for (let i = 0; i < NCELLS; i++) {
    if (i < NMAIN) { CELL_B[i] = 0; CELL_F[i] = i % 10; CELL_R[i] = Math.floor(i / 10); }
    else { CELL_B[i] = 1; CELL_F[i] = (i - NMAIN) % 8 + 1; CELL_R[i] = Math.floor((i - NMAIN) / 8) + 1; }
  }
  const cellIdx = (bd, f, r) => bd === 0
    ? ((f >= 0 && f < 10 && r >= 0 && r < 10) ? r * 10 + f : -1)
    : ((f >= 1 && f <= 8 && r >= 1 && r <= 8) ? NMAIN + (r - 1) * 8 + (f - 1) : -1);
  const DEFAULT_EX = new Uint8Array(NCELLS);
  for (let r = 1; r <= 8; r++) for (let f = 1; f <= 8; f++) DEFAULT_EX[r * 10 + f] = 1;
  for (let i = NMAIN; i < NCELLS; i++) DEFAULT_EX[i] = 1;
  const isCore = s => s < NMAIN && CELL_F[s] >= 1 && CELL_F[s] <= 8 && CELL_R[s] >= 1 && CELL_R[s] <= 8;

  const FILES = 'abcdefgh', MAIN_FILES = 'zabcdefghi';
  const sqName = s => (s >= NMAIN ? 'π' : '') + MAIN_FILES[CELL_F[s]] + CELL_R[s];
  const sqFromName = n => {
    if (typeof n !== 'string') return -1;
    if (n[0] === 'π') {
      const f = FILES.indexOf(n[1]), r = +n.slice(2) - 1;
      return cellIdx(1, MAIN_FILES.indexOf(n[1]), +n.slice(2));
    }
    if (n.length !== 2) return -1;
    const f = MAIN_FILES.indexOf(n[0]), r = n.charCodeAt(1) - 48;
    return (f < 0 || r < 0 || r > 9) ? -1 : r * 10 + f;
  };

  const CLASSIC_SETUP = {
    a1: 'tour', b1: 'cavalier', c1: 'fou', d1: 'dame', e1: 'roi', f1: 'fou', g1: 'cavalier', h1: 'tour',
    a2: 'pion', b2: 'pion', c2: 'pion', d2: 'pion', e2: 'pion', f2: 'pion', g2: 'pion', h2: 'pion'
  };
  const SETUP_SQUARES = Object.keys(CLASSIC_SETUP);
  const allowedFor = sq => {
    const c = CLASSIC_SETUP[sq];
    if (!c) return [];
    const fam = KEY_TO_TYPE[c];
    const list = [c, KEYS[COMMUN_ALT[fam]]];
    for (let a = 1; a <= NARCH; a++) list.push(KEYS[archPiece(a, fam)]);
    return list;
  };
  const archOfKey = key => ARCH[KEY_TO_TYPE[key]] || 0;
  const setupArchetypes = setup => {
    const s = new Set();
    for (const sq of SETUP_SQUARES) { const a = archOfKey(setup[sq]); if (a) s.add(a); }
    return [...s];
  };

  // Directions : 0..3 orthogonales, 4..7 diagonales
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ALL8 = ORTH.concat(DIAG);
  // Couronne dans le sens horaire (vue des Blancs) : N, NE, E, SE, S, SO, O, NO
  const RING_CW = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
  const STEP = ALL8.map(([df, dr]) => {
    const t = new Int16Array(NCELLS);
    for (let s = 0; s < NCELLS; s++) t[s] = cellIdx(CELL_B[s], CELL_F[s] + df, CELL_R[s] + dr);
    return t;
  });
  function table(offs) {
    const t = [];
    for (let s = 0; s < NCELLS; s++) {
      const l = [];
      for (const [df, dr] of offs) {
        const x = cellIdx(CELL_B[s], CELL_F[s] + df, CELL_R[s] + dr);
        if (x >= 0) l.push(x);
      }
      t.push(l);
    }
    return t;
  }
  const KNIGHT = table([[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]);
  const KING = table(ALL8);
  const ALFIL = table([[2, 2], [2, -2], [-2, 2], [-2, -2]]);
  const LONGLEAP = table([[1, 3], [3, 1], [3, -1], [1, -3], [-1, -3], [-3, -1], [-3, 1], [-1, 3]]);
  const NEAR2 = table([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
    [2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [2, -2], [-2, 2], [-2, -2]]);

  // Correspondance plateau principal ↔ plan secondaire
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // Case de même coordonnée sur l'autre plateau (-1 hors du cœur 8×8)
  const counterpart = s => cellIdx(CELL_B[s] ? 0 : 1, CELL_F[s], CELL_R[s]);
  const PLAN_PLIES = 8; // durée d'ouverture du plan (4 tours de chaque camp)

  // ---------- Zobrist ----------
  let seed = 0x2545F491;
  function rnd() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) | 0;
  }
  const rndArr = n => { const a = new Int32Array(n); for (let i = 0; i < n; i++) a[i] = rnd(); return a; };
  const Z1 = rndArr(256 * NCELLS), Z2 = rndArr(256 * NCELLS);
  const ZC1 = rndArr(16), ZC2 = rndArr(16);
  const ZE1 = rndArr(16), ZE2 = rndArr(16);
  const ZT1 = rnd(), ZT2 = rnd();
  const ZI1 = rndArr(6), ZI2 = rndArr(6);
  const immKey1 = (im, left) => im < 0 ? 0 : ZI1[im * 3 + left];
  const immKey2 = (im, left) => im < 0 ? 0 : ZI2[im * 3 + left];
  const ZG1 = rndArr(128 * NCELLS), ZG2 = rndArr(128 * NCELLS);
  const ZX1 = rndArr(NCELLS), ZX2 = rndArr(NCELLS);
  const ZP1 = rndArr(PLAN_PLIES + 1), ZP2 = rndArr(PLAN_PLIES + 1);

  const CASTLE_MASK = new Uint8Array(NCELLS).fill(15);
  CASTLE_MASK[11] = 15 & ~2; CASTLE_MASK[18] = 15 & ~1; CASTLE_MASK[15] = 15 & ~3;
  CASTLE_MASK[81] = 15 & ~8; CASTLE_MASK[88] = 15 & ~4; CASTLE_MASK[85] = 15 & ~12;

  const EXTRA_UNIT = 268435456; // 2^28
  const moveFrom = m => m & 255;
  const moveTo = m => (m >> 8) & 255;
  const movePromo = m => (m >> 16) & 127;
  const moveFlag = m => (m >> 23) & 31;
  const moveExtra = m => Math.floor(m / EXTRA_UNIT) - 1;
  const mkMove = (from, to, promo, flag, extra) =>
    (from | (to << 8) | ((promo || 0) << 16) | ((flag || 0) << 23)) + ((extra === undefined || extra < 0) ? 0 : (extra + 1) * EXTRA_UNIT);

  const pColor = p => p >> 7;
  const pType = p => p & 127;
  const isRoyal = t => FAM[t] === K;
  const isPawn = t => FAM[t] === P;
  const castleRook = t => FAM[t] === R;
  const COMPLEX = new Uint8Array(NTYPES + 1);
  [PERCEVOILE, FRACASSEUR, HARPON, VENDETTA, ZENARQUE, ECHAPPEMENT, BALANCIER].forEach(t => { COMPLEX[t] = 1; });
  const VORACE = t => t >= GOULOT && t <= GASTRARQUE;
  const PALIMPSESTE = t => t >= SILLONNEUR && t <= CLEARQUE;
  const SHIFTERS = new Set([FUGUEUR, PASSEMONDE, UBIQUISTE]);

  class Position {
    constructor() {
      this.b = new Uint8Array(NCELLS);
      this.ids = new Uint8Array(NCELLS).fill(255);
      this.ex = DEFAULT_EX.slice();
      this.turn = WHITE;
      this.castle = 0;
      this.ep = -1;
      this.half = 0;
      this.full = 1;
      this.kings = [-1, -1];
      this.cx = [0, 0];
      this.h1 = 0; this.h2 = 0;
      this.undo = [];
      this.hist1 = []; this.hist2 = [];
      // Cendres (indexés par leur case de départ) : 0 vivant, 1 capturé, 2 revenu, 3 capturé définitivement
      this.cState = new Uint8Array(NCELLS);
      this.cCap = new Int16Array(NCELLS).fill(-1);
      // Palimpsestes : glyphe par case (type | propriétaire << 3 | G_ARMED), pièce piégée par une Entrave
      this.glyph = new Uint8Array(NCELLS);
      this.gTrap = new Int16Array(NCELLS).fill(-1);
      this.gCount = 0;
      // Voraces (indexés par identifiant de pièce) : famille héritée, bonus de digestion restant
      this.vInh = new Uint8Array(NCELLS);
      this.vBonus = new Uint8Array(NCELLS);
      this.anyInh = 0;
      // Pièce qui doit rejouer immédiatement (Dévoracle, Zénarque après l'Apothéose)
      this.forced = -1;
      // Héliarques : camp sous Apothéose et nombre de ses tours encore couverts
      this.immune = -1;
      this.immuneLeft = 0;
      // Outremondes : demi-coups restants avant la fermeture du plan, case de retour par pièce
      this.planTimer = 0;
      this.home = new Int16Array(NCELLS).fill(-1);
      this._mark = new Uint32Array(NCELLS);
      this._stamp = 0;
    }

    // Case existante aux coordonnées données (sinon -1)
    at(bd, f, r) { const j = cellIdx(bd, f, r); return j >= 0 && this.ex[j] ? j : -1; }
    go(s, df, dr) { return this.at(CELL_B[s], CELL_F[s] + df, CELL_R[s] + dr); }

    static fromSetups(setupW, setupB) {
      const pos = new Position();
      const place = (setup, color) => {
        for (const sqn of SETUP_SQUARES) {
          const key = (setup && setup[sqn]) || CLASSIC_SETUP[sqn];
          let s = sqFromName(sqn);
          if (color === BLACK) s = (9 - CELL_R[s]) * 10 + CELL_F[s];
          pos.b[s] = KEY_TO_TYPE[key] | (color << 7);
          pos.ids[s] = s;
        }
      };
      place(setupW, WHITE);
      place(setupB, BLACK);
      pos._recount();
      const b = pos.b;
      const ok = (s, c, pred) => b[s] && pColor(b[s]) === c && pred(pType(b[s]));
      if (ok(15, WHITE, isRoyal)) {
        if (ok(18, WHITE, castleRook)) pos.castle |= 1;
        if (ok(11, WHITE, castleRook)) pos.castle |= 2;
      }
      if (ok(85, BLACK, isRoyal)) {
        if (ok(88, BLACK, castleRook)) pos.castle |= 4;
        if (ok(81, BLACK, castleRook)) pos.castle |= 8;
      }
      pos.computeHash();
      return pos;
    }

    static fromFEN(fen) {
      const pos = new Position();
      const [placement, turn, cs, ep, half, full] = fen.trim().split(/\s+/);
      let r = 8, f = 1;
      const types = { p: P, n: N, b: B, r: R, q: Q, k: K };
      for (const ch of placement) {
        if (ch === '/') { r--; f = 1; }
        else if (/\d/.test(ch)) f += +ch;
        else {
          const lower = ch.toLowerCase(), s = r * 10 + f;
          pos.b[s] = types[lower] | ((ch === lower ? BLACK : WHITE) << 7);
          pos.ids[s] = s;
          f++;
        }
      }
      pos.turn = turn === 'b' ? BLACK : WHITE;
      if (cs && cs !== '-') {
        if (cs.includes('K')) pos.castle |= 1;
        if (cs.includes('Q')) pos.castle |= 2;
        if (cs.includes('k')) pos.castle |= 4;
        if (cs.includes('q')) pos.castle |= 8;
      }
      pos.ep = ep && ep !== '-' ? sqFromName(ep) : -1;
      pos.half = +half || 0;
      pos.full = +full || 1;
      pos._recount();
      pos.computeHash();
      return pos;
    }

    _recount() {
      this.cx = [0, 0];
      for (let s = 0; s < NCELLS; s++) {
        const p = this.b[s];
        if (!p) continue;
        if (isRoyal(pType(p))) this.kings[pColor(p)] = s;
        if (COMPLEX[pType(p)]) this.cx[pColor(p)]++;
      }
    }

    clone() {
      const p = new Position();
      p.b.set(this.b); p.ids.set(this.ids); p.ex.set(this.ex);
      p.turn = this.turn; p.castle = this.castle; p.ep = this.ep;
      p.half = this.half; p.full = this.full; p.kings = this.kings.slice(); p.cx = this.cx.slice();
      p.h1 = this.h1; p.h2 = this.h2;
      p.hist1 = this.hist1.slice(); p.hist2 = this.hist2.slice();
      p.undo = this.undo.slice();
      p.cState.set(this.cState); p.cCap.set(this.cCap);
      p.glyph.set(this.glyph); p.gTrap.set(this.gTrap); p.gCount = this.gCount;
      p.vInh.set(this.vInh); p.vBonus.set(this.vBonus); p.anyInh = this.anyInh;
      p.forced = this.forced; p.immune = this.immune; p.immuneLeft = this.immuneLeft;
      p.planTimer = this.planTimer; p.home.set(this.home);
      return p;
    }

    computeHash() {
      let h1 = 0, h2 = 0;
      for (let s = 0; s < NCELLS; s++) {
        const p = this.b[s];
        if (p) { h1 ^= Z1[p * NCELLS + s]; h2 ^= Z2[p * NCELLS + s]; }
        const g = this.glyph[s];
        if (g) { h1 ^= ZG1[g * NCELLS + s]; h2 ^= ZG2[g * NCELLS + s]; }
        if (this.ex[s] !== DEFAULT_EX[s]) { h1 ^= ZX1[s]; h2 ^= ZX2[s]; }
      }
      h1 ^= ZC1[this.castle]; h2 ^= ZC2[this.castle];
      if (this.ep >= 0) { h1 ^= ZE1[CELL_F[this.ep]]; h2 ^= ZE2[CELL_F[this.ep]]; }
      if (this.turn === BLACK) { h1 ^= ZT1; h2 ^= ZT2; }
      h1 ^= immKey1(this.immune, this.immuneLeft); h2 ^= immKey2(this.immune, this.immuneLeft);
      h1 ^= ZP1[this.planTimer]; h2 ^= ZP2[this.planTimer];
      this.h1 = h1; this.h2 = h2;
    }

    // ---------- Attaques ----------
    isAttacked(sq, c) {
      const b = this.b, ex = this.ex, bd = CELL_B[sq], f = CELL_F[sq], r = CELL_R[sq];
      const fwd = c === WHITE ? 1 : -1;
      let p, x;
      x = this.at(bd, f - 1, r - fwd);
      if (x >= 0 && (p = b[x]) && pColor(p) === c && MOVE[pType(p)] === P) return true;
      x = this.at(bd, f + 1, r - fwd);
      if (x >= 0 && (p = b[x]) && pColor(p) === c && MOVE[pType(p)] === P) return true;
      x = this.at(bd, f, r - fwd);
      if (x >= 0 && (p = b[x]) && pColor(p) === c && pType(p) === BI) return true;
      let l = KNIGHT[sq];
      for (let i = 0; i < l.length; i++) { p = b[l[i]]; if (p && pColor(p) === c && MOVE[pType(p)] === N) return true; }
      l = KING[sq];
      for (let i = 0; i < l.length; i++) {
        p = b[l[i]];
        if (p && pColor(p) === c && (MOVE[pType(p)] === K || pType(p) === SO)) return true;
      }
      l = ALFIL[sq];
      for (let i = 0; i < l.length; i++) {
        p = b[l[i]];
        if (p && pColor(p) === c && (pType(p) === VO || pType(p) === CH)) return true;
      }
      for (let d = 4; d < 8; d++) {
        const st = STEP[d];
        x = st[sq];
        while (x >= 0 && ex[x]) {
          p = b[x];
          if (p) {
            const m = MOVE[pType(p)];
            if (pColor(p) === c && (m === B || m === Q)) return true;
            break;
          }
          x = st[x];
        }
      }
      for (let d = 0; d < 4; d++) {
        const st = STEP[d];
        let dist = 1, obs = 0;
        x = st[sq];
        while (x >= 0 && ex[x]) {
          p = b[x];
          if (p) {
            if (pColor(p) === c) {
              const t = pType(p), m = MOVE[t];
              if (obs === 0 && (m === R || m === Q)) return true;
              if (dist <= 3 && (t === RE || t === CH)) return true;
            }
            obs++;
          }
          if (obs >= 2 || (obs >= 1 && dist >= 3)) break;
          x = st[x]; dist++;
        }
      }
      const lo = LO | (c << 7);
      if (this._loReach(sq, lo)) return true;
      for (let d = 0; d < 4; d++) {
        const m = STEP[d][sq];
        if (m < 0 || !ex[m] || b[m]) continue;
        if (this._loReach(m, lo)) return true;
      }
      if (this.gCount && this._glyphAttack(sq, c)) return true;
      // Prises spéciales : génération directe
      if (this.cx[c] || this.anyInh) {
        const out = [];
        for (let s = 0; s < NCELLS; s++) {
          p = b[s];
          if (!p || pColor(p) !== c || (!COMPLEX[pType(p)] && !this.vInh[this.ids[s]])) continue;
          out.length = 0;
          this.genPiece(s, out, true, true);
          for (const m of out) {
            const fl = moveFlag(m);
            if (moveTo(m) === sq && b[sq] && fl !== FLAG_ECHO) return true;
            if ((fl === FLAG_FOLLOW || fl === FLAG_ECHO) && moveExtra(m) === sq) return true;
          }
        }
      }
      return false;
    }

    _glyphAttack(sq, c) {
      const b = this.b;
      for (let g = 0; g < NCELLS; g++) {
        const code = this.glyph[g];
        if (!code || ((code >> 3) & 1) !== c || !b[g] || pColor(b[g]) !== c || CELL_B[g] !== CELL_B[sq]) continue;
        const gt = code & 7;
        if (gt === G_TREMPLIN && KNIGHT[g].includes(sq)) return true;
        if (gt === G_MUE) {
          const df = CELL_F[sq] - CELL_F[g], dr = CELL_R[sq] - CELL_R[g];
          if (df && Math.abs(df) === Math.abs(dr) && Math.abs(df) <= 3 && this._clearBetween(g, sq)) return true;
        }
      }
      return false;
    }

    _loReach(sq, lo) {
      const b = this.b, ex = this.ex;
      for (let d = 4; d < 8; d++) {
        const x1 = STEP[d][sq];
        if (x1 < 0 || !ex[x1]) continue;
        if (b[x1] === lo) return true;
        if (b[x1]) continue;
        const x2 = STEP[d][x1];
        if (x2 >= 0 && ex[x2] && b[x2] === lo) return true;
      }
      return false;
    }

    inCheck(c = this.turn) {
      const k = this.kings[c];
      return k >= 0 && this.isAttacked(k, c ^ 1);
    }

    // ---------- Génération ----------
    gen(out, caps) {
      const c = this.turn;
      if (this.forced >= 0) {
        for (let s = 0; s < NCELLS; s++) {
          if (this.b[s] && pColor(this.b[s]) === c && this.ids[s] === this.forced) {
            const n = out.length;
            this.genPiece(s, out, caps, false);
            if (out.length > n || caps) return out;
          }
        }
      }
      for (let s = 0; s < NCELLS; s++) {
        const p = this.b[s];
        if (p && pColor(p) === c && !this.isFrozen(s)) this.genPiece(s, out, caps, false);
      }
      if (!caps) this.genResurrections(out);
      return out;
    }

    /* Coups d'une pièce. caps : seulement les prises ; atk : appel depuis isAttacked
       (aucun coup non capturant, aucun appel récursif à isAttacked). */
    genPiece(s, out, caps, atk) {
      const start = out.length, b = this.b, p = b[s], t = pType(p), c = pColor(p);
      const mute = this.isSilenced(s);
      this._mute = mute;
      this._genPiece(s, out, caps, atk);
      const quiet = caps || atk;
      if (!mute) {
        if (t === ZENARQUE) {
          this._genZenJump(s, out, quiet);
          if (this.immune === c) this._genZenQueen(s, out, quiet, start);
          this._genCourt(s, out, quiet, atk);
        }
        else if (PALIMPSESTE(t) && !quiet) this._genTrace(s, out);
        else if (VORACE(t)) this._genVorace(s, out, caps, atk);
        else if (ARCH[t] === 9) this._genGeo(s, out, caps, atk, start);
        else if (ARCH[t] === 10) { if (!quiet) this._genOutre(s, out); }
        else if (ARCH[t] === 11) this._genClock(s, out, caps, atk, start);
      }
      if (this.vInh[this.ids[s]]) this._genInherited(s, out, caps, atk, start);
      if (!quiet && this.glyph[s]) this._genGlyphMoves(s, out);
      if (!atk) {
        // un roi n'est jamais capturé (utile sous Apothéose ou au retour du plan)
        let w = start;
        for (let i = start; i < out.length; i++) {
          const m = out[i], q = b[moveTo(m)], fl = moveFlag(m);
          if (q && pColor(q) !== c && FAM[pType(q)] === K && fl !== FLAG_SWAP && fl !== FLAG_ECHO && fl !== FLAG_OPEN) continue;
          if (fl === FLAG_FOLLOW || fl === FLAG_ECHO) {
            const x = moveExtra(m);
            if (x >= 0 && b[x] && pColor(b[x]) !== c && FAM[pType(b[x])] === K) continue;
          }
          out[w++] = m;
        }
        out.length = w;
      }
      return out;
    }

    _genPiece(s, out, caps, atk) {
      const b = this.b, ex = this.ex, p = b[s], t = pType(p), c = pColor(p);
      const bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s];
      const fwd = c === WHITE ? 1 : -1;
      const main = bd === 0;
      const lastRank = c === WHITE ? 8 : 1, startRank = c === WHITE ? 2 : 7;
      const quiet = caps || atk;
      const at = (ff, rr) => this.at(bd, ff, rr);
      const own = q => q && pColor(q) === c;
      const enemy = q => q && pColor(q) !== c;
      const start = out.length;
      const add = to => {
        const q = b[to];
        if (!q) { if (!quiet) out.push(s | (to << 8)); return true; }
        if (pColor(q) !== c) out.push(s | (to << 8));
        return false;
      };
      const addPromos = (to, flag) => {
        const list = PROMOS[t] || PROMOS[P];
        for (let i = 0; i < list.length; i++) {
          out.push(mkMove(s, to, list[i], flag || 0));
          if (caps) break;
        }
      };
      const slide = (d0, d1) => {
        for (let d = d0; d < d1; d++) {
          let x = STEP[d][s];
          while (x >= 0 && ex[x]) {
            if (!add(x)) break;
            x = STEP[d][x];
          }
        }
      };
      const leaps = l => { for (let i = 0; i < l.length; i++) if (ex[l[i]]) add(l[i]); };
      const quietLeaps = l => { if (!quiet) for (let i = 0; i < l.length; i++) if (ex[l[i]] && !b[l[i]]) out.push(s | (l[i] << 8)); };
      const swap = to => { if (!quiet) out.push(mkMove(s, to, 0, FLAG_SWAP)); };
      const rempart = () => {
        for (let d = 0; d < 4; d++) {
          let x = s, obs = 0;
          for (let k = 1; k <= 3; k++) {
            x = STEP[d][x];
            if (x < 0 || !ex[x]) break;
            const q = b[x];
            if (!q) { if (!quiet) out.push(s | (x << 8)); }
            else {
              if (pColor(q) !== c) out.push(s | (x << 8));
              if (++obs >= 2) break;
            }
          }
        }
      };
      const castling = () => {
        if (quiet || s !== (c === WHITE ? 15 : 85)) return;
        const rb = c === WHITE ? 10 : 80, kf = c === WHITE ? 1 : 4, qf = c === WHITE ? 2 : 8, e = c ^ 1;
        const rookOk = q => q && pColor(q) === c && castleRook(pType(q));
        const free = x => ex[x] && !b[x];
        if ((this.castle & kf) && free(rb + 6) && free(rb + 7) && rookOk(b[rb + 8]) &&
          !this.isAttacked(s, e) && !this.isAttacked(rb + 6, e) && !this.isAttacked(rb + 7, e)) {
          out.push(mkMove(s, rb + 7, 0, FLAG_CK));
        }
        if ((this.castle & qf) && free(rb + 2) && free(rb + 3) && free(rb + 4) && rookOk(b[rb + 1]) &&
          !this.isAttacked(s, e) && !this.isAttacked(rb + 4, e) && !this.isAttacked(rb + 3, e)) {
          out.push(mkMove(s, rb + 3, 0, FLAG_CQ));
        }
      };

      // ----- marche de base -----
      switch (MOVE[t]) {
        case P: {
          const r2 = r + fwd, t1 = at(f, r2);
          if (t1 >= 0 && !b[t1]) {
            if (r2 === lastRank) { if (!atk) addPromos(t1); }
            else if (!quiet) {
              out.push(s | (t1 << 8));
              const t2 = at(f, r2 + fwd);
              if (r === startRank && t !== ECLAIREUR && t2 >= 0 && !b[t2]) out.push(mkMove(s, t2, 0, FLAG_DOUBLE));
            }
          }
          for (let df = -1; df <= 1; df += 2) {
            const tt = at(f + df, r2);
            if (tt < 0) continue;
            if (enemy(b[tt])) {
              if (r2 === lastRank) addPromos(tt); else out.push(s | (tt << 8));
            } else if (tt === this.ep) out.push(mkMove(s, tt, 0, FLAG_EP));
          }
          break;
        }
        case BI: {
          const r2 = r + fwd;
          for (let df = -1; df <= 1; df += 2) {
            const tt = at(f + df, r2);
            if (tt >= 0 && !b[tt] && !atk) {
              if (r2 === lastRank) addPromos(tt); else if (!caps) out.push(s | (tt << 8));
            }
          }
          const t1 = at(f, r2);
          if (t1 >= 0 && enemy(b[t1])) { if (r2 === lastRank) addPromos(t1); else out.push(s | (t1 << 8)); }
          break;
        }
        case N: leaps(KNIGHT[s]); break;
        case B: slide(4, 8); break;
        case R: slide(0, 4); break;
        case Q: slide(0, 8); break;
        case K: leaps(KING[s]); castling(); break;
        case SO: {
          leaps(KING[s]);
          if (!quiet) {
            const x = at(f, r - 2 * fwd);
            if (x >= 0 && !b[x]) out.push(s | (x << 8));
          }
          castling();
          break;
        }
        case VO: leaps(ALFIL[s]); break;
        case RE: rempart(); break;
        case CH: rempart(); leaps(ALFIL[s]); break;
        case LO: {
          const stamp = ++this._stamp, mark = this._mark;
          for (let d = 4; d < 8; d++) {
            let x = s;
            for (let k = 1; k <= 2; k++) {
              x = STEP[d][x];
              if (x < 0 || !ex[x]) break;
              const q = b[x];
              if (q) {
                if (pColor(q) !== c && mark[x] !== stamp) { mark[x] = stamp; out.push(s | (x << 8)); }
                break;
              }
              if (mark[x] !== stamp) { mark[x] = stamp; if (!quiet) out.push(s | (x << 8)); }
              for (let o = 0; o < 4; o++) {
                const t3 = STEP[o][x];
                if (t3 < 0 || !ex[t3] || t3 === s || mark[t3] === stamp) continue;
                const q3 = b[t3];
                if (!q3) { mark[t3] = stamp; if (!quiet) out.push(s | (t3 << 8)); }
                else if (pColor(q3) !== c) { mark[t3] = stamp; out.push(s | (t3 << 8)); }
              }
            }
          }
          break;
        }
      }
      if (t <= SO || this._mute) return out;

      // ----- pouvoirs des archétypes -----
      const ray = (dirs, max, visit) => {
        for (const [df, dr] of dirs) {
          for (let k = 1; k <= max; k++) {
            const x = at(f + df * k, r + dr * k);
            if (x < 0) break;
            if (visit(x, k) === false) break;
          }
        }
      };
      const follow = (extraOk, capturesOnly) => {
        const end = out.length;
        for (let i = start; i < end; i++) {
          const m = out[i];
          if (moveFlag(m)) continue;
          const x = moveTo(m);
          if (!enemy(b[x])) continue;
          for (const y of extraOk(x)) {
            if (!ex[y]) continue;
            const q = y === s ? 0 : b[y];
            if (capturesOnly) { if (q && pColor(q) !== c) out.push(mkMove(s, x, 0, FLAG_FOLLOW, y)); }
            else if (!q && !quiet) out.push(mkMove(s, x, 0, FLAG_FOLLOW, y));
          }
        }
      };
      switch (t) {
        // Errants
        case VIREPAS: {
          if (quiet) break;
          const r2 = r + fwd;
          for (let df = -1; df <= 1; df += 2) {
            const tt = at(f + df, r2);
            if (tt >= 0 && !b[tt]) { if (r2 === lastRank) addPromos(tt); else out.push(s | (tt << 8)); }
          }
          break;
        }
        case SYLPHE: quietLeaps(LONGLEAP[s]); break;
        case MIROITIER: quietLeaps(KING[s].filter(x => CELL_F[x] === f || CELL_R[x] === r)); break;
        case TRAVERSE: {
          if (quiet) break;
          for (const dr of [1, -1]) {
            let rr = r + dr, x;
            while ((x = at(f, rr)) >= 0 && !b[x]) rr += dr;
            if (x < 0) continue;
            const q = b[x];
            if (!own(q) || FAM[pType(q)] !== N) continue;
            for (let j = 1; j <= 2; j++) {
              const y = at(f, rr + dr * j);
              if (y < 0 || b[y]) break;
              out.push(s | (y << 8));
            }
          }
          break;
        }
        case VAGABONDE: follow(x => NEAR2[x], false); break;
        case PASSEBRUME: {
          if (quiet) break;
          for (const df of [2, -2]) {
            const mid = at(f + df / 2, r), to = at(f + df, r);
            if (mid < 0 || to < 0 || b[mid] || b[to]) continue;
            if (out.some(m => moveTo(m) === to && moveFrom(m) === s)) continue;
            if (this.isAttacked(mid, c ^ 1) || this.isAttacked(to, c ^ 1)) continue;
            out.push(s | (to << 8));
          }
          break;
        }
        // Veilleurs
        case PAVOIS: {
          const bk = at(f, r - fwd);
          if (bk >= 0 && own(b[bk]) && !isPawn(pType(b[bk])) && !isRoyal(pType(b[bk]))) swap(bk);
          break;
        }
        case ESCORTEUR: for (const x of KNIGHT[s]) if (ex[x] && own(b[x]) && FAM[pType(b[x])] === B) swap(x); break;
        case TISSEUR: ray(DIAG, 3, x => {
          const q = b[x];
          if (!q) return true;
          if (own(q) && FAM[pType(q)] === N) swap(x);
          return false;
        }); break;
        case BASTION: ray([[0, fwd]], 3, x => {
          const q = b[x];
          if (!q) return true;
          if (own(q) && isPawn(pType(q))) swap(x);
          return false;
        }); break;
        case EGIDE: ray(ALL8, 2, x => {
          const q = b[x];
          if (!q) return true;
          const fm = FAM[pType(q)];
          if (own(q) && (fm === R || fm === B || fm === N)) swap(x);
          return false;
        }); break;
        case CASTELLAN: if (r !== lastRank) for (const x of KING[s]) if (ex[x] && own(b[x]) && isPawn(pType(b[x]))) swap(x); break;
        // Ravageurs
        case MORDANT: for (const df of [-1, 1]) {
          const x = at(f + df, r);
          if (x >= 0 && enemy(b[x]) && isPawn(pType(b[x]))) out.push(s | (x << 8));
        } break;
        case HARPON: follow(x => LONGLEAP[x], true); break;
        case PERCEVOILE: this._pierce(s, out, DIAG, 4, P); break;
        case FRACASSEUR: this._pierce(s, out, ORTH, 3, N); break;
        case VENDETTA: follow(x => KNIGHT[x], true); break;
        case DUELARQUE: follow(x => KNIGHT[x], false); break;
        // Pionniers
        case ECLAIREUR: {
          if (quiet) break;
          const t1 = at(f, r + fwd), t2 = at(f, r + 2 * fwd);
          if (t1 < 0 || t2 < 0 || b[t1] || b[t2]) break;
          if (r + fwd === lastRank) break; // ne dépasse pas la dernière rangée
          if (r + 2 * fwd === lastRank) addPromos(t2); else out.push(mkMove(s, t2, 0, FLAG_DOUBLE));
          break;
        }
        case ESTAFETTE: {
          if (quiet) break;
          for (const df of [-1, 1]) {
            const x = at(f + df, r + 3 * fwd);
            if (x >= 0 && !b[x]) out.push(s | (x << 8));
          }
          break;
        }
        case AURORAL: if (!quiet) ray([[0, fwd]], 2, x => { if (b[x]) return false; out.push(s | (x << 8)); return true; }); break;
        case BELIER: {
          if (quiet) break;
          const x = at(f, r + fwd), y = at(f, r + 2 * fwd);
          if (x < 0 || y < 0 || !own(b[x]) || !isPawn(pType(b[x])) || b[y]) break;
          if (CELL_R[y] === lastRank) for (const pr of PROMOS[pType(b[x])]) out.push(mkMove(s, x, pr, FLAG_BELIER));
          else out.push(mkMove(s, x, 0, FLAG_BELIER));
          break;
        }
        case MENEUSE: {
          if (quiet) break;
          const side = [];
          for (const df of [-1, 1]) {
            const x = at(f + df, r), y = at(f + df, r + fwd);
            if (x < 0 || y < 0 || !own(b[x]) || !isPawn(pType(b[x])) || b[y]) continue;
            side.push(x);
          }
          const promosFor = x => (CELL_R[x] + fwd) === lastRank ? PROMOS[pType(b[x])] : null;
          for (const x of side) {
            const pl = promosFor(x);
            if (pl) for (const pr of pl) out.push(mkMove(s, x, pr, FLAG_MENEUSE));
            else out.push(mkMove(s, x, 0, FLAG_MENEUSE));
          }
          if (side.length === 2) {
            for (const [x, y] of [[side[0], side[1]], [side[1], side[0]]]) {
              const pa = promosFor(x), pb = promosFor(y);
              const pl = pa && pb ? pa.filter(v => pb.includes(v)) : (pa || pb);
              if (pl) for (const pr of pl) out.push(mkMove(s, x, pr, FLAG_MENEUSE, y));
              else out.push(mkMove(s, x, 0, FLAG_MENEUSE, y));
            }
          }
          break;
        }
        case PORTE: {
          if (quiet) break;
          const x = at(f, r + fwd), y = at(f, r + 2 * fwd);
          if (x < 0 || y < 0 || b[x] || b[y]) break;
          if (this.isAttacked(x, c ^ 1) || this.isAttacked(y, c ^ 1)) break;
          out.push(s | (y << 8));
          break;
        }
      }
      return out;
    }

    _pierce(s, out, dirs, max, fam) {
      const b = this.b, c = pColor(b[s]), bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s];
      for (const [df, dr] of dirs) {
        let jumped = 0;
        for (let k = 1; k <= max; k++) {
          const x = this.at(bd, f + df * k, r + dr * k);
          if (x < 0) break;
          const q = b[x];
          if (!q) continue;
          if (pColor(q) === c && FAM[pType(q)] === fam && !jumped) { jumped = 1; continue; }
          if (pColor(q) !== c && jumped) out.push(s | (x << 8));
          break;
        }
      }
    }

    // ---------- Palimpsestes ----------
    glyphOwner(sq) { return (this.glyph[sq] >> 3) & 1; }
    glyphType(sq) { return this.glyph[sq] & 7; }
    glyphCount(c) {
      let n = 0;
      for (let s = 0; s < NCELLS; s++) if (this.glyph[s] && this.glyphOwner(s) === c) n++;
      return n;
    }
    isSilenced(s) {
      const g = this.glyph[s], p = this.b[s];
      return !!g && !!p && (g & 7) === G_SILENCE && ((g >> 3) & 1) !== pColor(p) && FAM[pType(p)] !== K;
    }
    isFrozen(s) {
      const g = this.glyph[s], p = this.b[s];
      return !!g && !!p && (g & 7) === G_ENTRAVE && !!(g & G_ARMED) && ((g >> 3) & 1) !== pColor(p) && this.gTrap[s] === this.ids[s];
    }
    _setGlyph(rec, sq, code, trap) {
      const old = this.glyph[sq];
      rec.gl.push(sq, old, this.gTrap[sq]);
      if (!old && code) this.gCount++;
      if (old && !code) this.gCount--;
      if (old) { this.h1 ^= ZG1[old * NCELLS + sq]; this.h2 ^= ZG2[old * NCELLS + sq]; }
      this.glyph[sq] = code;
      this.gTrap[sq] = trap === undefined ? -1 : trap;
      if (code) { this.h1 ^= ZG1[code * NCELLS + sq]; this.h2 ^= ZG2[code * NCELLS + sq]; }
    }
    _setVorace(rec, id, inh, bonus) {
      rec.vs.push(id, this.vInh[id], this.vBonus[id]);
      if (!this.vInh[id] && inh) this.anyInh++;
      if (this.vInh[id] && !inh) this.anyInh--;
      this.vInh[id] = inh;
      this.vBonus[id] = bonus;
    }

    _genTrace(s, out) {
      const b = this.b, c = pColor(b[s]);
      const mine = [];
      for (let x = 0; x < NCELLS; x++) if (this.glyph[x] && this.glyphOwner(x) === c) mine.push(x);
      for (let d = 0; d < 8; d++) {
        let x = s;
        for (let k = 1; k <= 2; k++) {
          x = STEP[d][x];
          if (x < 0 || !this.ex[x] || b[x]) break;
          if (this.glyph[x]) continue;
          if (mine.length >= 3) for (const g of mine) out.push(mkMove(s, x, 0, FLAG_TRACE, g));
          else out.push(mkMove(s, x, 0, FLAG_TRACE));
        }
      }
    }

    _genGlyphMoves(s, out) {
      const b = this.b, ex = this.ex, p = b[s], t = pType(p), c = pColor(p), g = this.glyph[s];
      if (((g >> 3) & 1) !== c) return;
      const gt = g & 7, bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s];
      const lastRank = c === WHITE ? 8 : 1, fwd = c === WHITE ? 1 : -1;
      const push = x => {
        if (isPawn(t) && CELL_R[x] === lastRank) for (const pr of PROMOS[t] || PROMOS[P]) out.push(mkMove(s, x, pr, FLAG_GLYPH));
        else out.push(mkMove(s, x, 0, FLAG_GLYPH));
      };
      if (gt === G_ELAN && isPawn(t)) {
        const x1 = this.at(bd, f, r + fwd), x2 = this.at(bd, f, r + 2 * fwd);
        if (x1 >= 0 && x2 >= 0 && !b[x1] && !b[x2]) push(x2);
      } else if (gt === G_TREMPLIN) {
        for (const x of KNIGHT[s]) if (ex[x] && (!b[x] || pColor(b[x]) !== c)) push(x);
      } else if (gt === G_MUE) {
        for (let d = 4; d < 8; d++) {
          let x = s;
          for (let k = 1; k <= 3; k++) {
            x = STEP[d][x];
            if (x < 0 || !ex[x]) break;
            if (b[x]) { if (pColor(b[x]) !== c) push(x); break; }
            push(x);
          }
        }
      } else if (gt === G_PASSAGE) {
        for (let x = 0; x < NCELLS; x++) if (x !== s && this.glyph[x] && this.glyphOwner(x) === c && !b[x] && ex[x]) push(x);
      }
    }

    // ---------- Héliarques ----------
    _clearBetween(a, z) {
      const bd = CELL_B[a];
      const df = Math.sign(CELL_F[z] - CELL_F[a]), dr = Math.sign(CELL_R[z] - CELL_R[a]);
      let f = CELL_F[a] + df, r = CELL_R[a] + dr;
      while (f !== CELL_F[z] || r !== CELL_R[z]) {
        const x = this.at(bd, f, r);
        if (x < 0 || this.b[x]) return false;
        f += df; r += dr;
      }
      return true;
    }
    court(c = this.turn) {
      const res = { k: this.kings[c], types: new Set(), sqs: [] };
      const k = res.k, b = this.b;
      if (k < 0 || pType(b[k]) !== ZENARQUE) return res;
      const fwd = c === WHITE ? 1 : -1, kf = CELL_F[k], kr = CELL_R[k];
      for (let s = 0; s < NCELLS; s++) {
        const p = b[s];
        if (!p || pColor(p) !== c || CELL_B[s] !== CELL_B[k]) continue;
        const t = pType(p);
        if (t < LUMIGNON || t > AUREOLE || this.isSilenced(s)) continue;
        const df = CELL_F[s] - kf, behind = (kr - CELL_R[s]) * fwd, adf = Math.abs(df);
        if (behind < 1 || behind > 3 || adf > 3) continue;
        let ok = false;
        if (t === LUMIGNON) ok = df === 0 && behind === 1;
        else if (t === SATELLITE) ok = (adf === 1 && behind === 2) || (adf === 2 && behind === 1);
        else {
          const diag = adf === behind, file = df === 0;
          ok = (t === HELIOPHANTE ? diag : t === OBELISQUE ? file : (diag || file)) && this._clearBetween(s, k);
        }
        if (ok) { res.types.add(t); res.sqs.push(s); }
      }
      return res;
    }
    apotheosisActive(c) { return this.immune === c; }

    _genZenJump(s, out, quiet) {
      const b = this.b, c = pColor(b[s]);
      for (let d = 0; d < 8; d++) {
        const mid = STEP[d][s];
        if (mid < 0 || !this.ex[mid]) continue;
        const x = STEP[d][mid];
        if (x < 0 || !this.ex[x]) continue;
        const mp = b[mid], q = b[x];
        if (!mp || pColor(mp) !== c || !isPawn(pType(mp))) continue;
        if (!q) { if (!quiet) out.push(s | (x << 8)); }
        else if (pColor(q) !== c) out.push(s | (x << 8));
      }
    }
    _genZenQueen(s, out, quiet, start) {
      const b = this.b, c = pColor(b[s]);
      const have = new Set();
      for (let i = start; i < out.length; i++) if (moveFrom(out[i]) === s) have.add(moveTo(out[i]));
      for (let d = 0; d < 8; d++) {
        let x = STEP[d][s];
        while (x >= 0 && this.ex[x]) {
          const q = b[x];
          if (!q) { if (!quiet && !have.has(x)) out.push(s | (x << 8)); }
          else { if (pColor(q) !== c && !have.has(x)) out.push(s | (x << 8)); break; }
          x = STEP[d][x];
        }
      }
    }
    _genCourt(s, out, quiet, atk) {
      const ct = this.court(pColor(this.b[s]));
      if (!ct.types.size) return;
      const b = this.b, c = pColor(b[s]), e = c ^ 1, bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s], fwd = c === WHITE ? 1 : -1;
      const at = (ff, rr) => this.at(bd, ff, rr);
      if (ct.types.has(LUMIGNON) && !quiet) {
        for (const df of [-1, 0, 1]) {
          const mid = at(f + df, r + fwd), dst = at(f + 2 * df, r + 2 * fwd);
          if (mid < 0 || dst < 0 || b[mid] || b[dst] || this.isAttacked(mid, e)) continue;
          out.push(s | (dst << 8));
        }
      }
      if (ct.types.has(SATELLITE) && !quiet) for (const x of KNIGHT[s]) if (this.ex[x] && !b[x]) out.push(s | (x << 8));
      const strike = dirs => {
        for (const [df, dr] of dirs) {
          const mid = at(f + df, r + dr), dst = at(f + 2 * df, r + 2 * dr);
          if (mid < 0 || dst < 0 || b[mid] || !b[dst] || pColor(b[dst]) === c) continue;
          if (!atk && this.isAttacked(mid, e)) continue;
          out.push(s | (dst << 8));
        }
      };
      if (ct.types.has(HELIOPHANTE)) strike(DIAG);
      if (ct.types.has(OBELISQUE)) strike(ORTH);
      if (quiet) return;
      for (const x of ct.sqs) if (pType(b[x]) === AUREOLE) out.push(mkMove(s, x, 0, FLAG_SWAP));
      if (ct.types.size >= 3 && this.immune !== c) out.push(mkMove(s, s, 0, FLAG_APO));
    }

    // ---------- Voraces ----------
    _genVorace(s, out, caps, atk) {
      const b = this.b, ex = this.ex, p = b[s], t = pType(p), c = pColor(p), id = this.ids[s];
      const bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s];
      const quiet = caps || atk, fwd = c === WHITE ? 1 : -1, lastRank = c === WHITE ? 8 : 1;
      const at = (ff, rr) => this.at(bd, ff, rr);
      if (!this.vInh[id]) {
        if (quiet) return;
        const victimOk = x => { const q = b[x]; return q && pColor(q) === c && FAM[pType(q)] !== K && !this.vInh[this.ids[x]]; };
        const absorb = x => { if (x >= 0 && ex[x] && victimOk(x)) out.push(mkMove(s, x, 0, FLAG_ABSORB)); };
        const fam = FAM[t];
        if (fam === P) { for (const df of [-1, 1]) { const x = at(f + df, r + fwd); if (x >= 0 && CELL_R[x] !== lastRank) absorb(x); } }
        else if (fam === N) KNIGHT[s].forEach(absorb);
        else if (fam === K) KING[s].forEach(absorb);
        else {
          const d0 = fam === R ? 0 : fam === B ? 4 : 0, d1 = fam === R ? 4 : 8;
          for (let d = d0; d < d1; d++) {
            let x = STEP[d][s];
            while (x >= 0 && ex[x]) {
              if (b[x]) { absorb(x); break; }
              x = STEP[d][x];
            }
          }
        }
        return;
      }
      if (t === GOULOT) {
        const x = at(f, r + fwd);
        if (x >= 0 && b[x] && pColor(b[x]) !== c) {
          if (CELL_R[x] === lastRank) for (const pr of (caps ? [Q] : PROMOS[t])) out.push(mkMove(s, x, pr));
          else out.push(s | (x << 8));
        }
      }
      if (!this.vBonus[id]) return;
      if (t === MANDIBULE && !quiet) {
        for (const [df, dr] of ORTH) { const x = at(f + df, r + dr); if (x >= 0 && !b[x]) out.push(mkMove(s, x, 0, FLAG_BONUS)); }
      } else if (t === GASTRARQUE && !quiet) {
        const x = at(f, r - 2 * fwd);
        if (x >= 0 && !b[x]) out.push(mkMove(s, x, 0, FLAG_BONUS));
      } else if (t === GOINFROI) {
        for (let d = 0; d < 4; d++) {
          let x = STEP[d][s], jumped = false;
          while (x >= 0 && ex[x]) {
            const q = b[x];
            if (!q) { if (jumped && !quiet) out.push(mkMove(s, x, 0, FLAG_BONUS)); }
            else if (pColor(q) === c) { if (jumped) break; jumped = true; }
            else { if (jumped) out.push(mkMove(s, x, 0, FLAG_BONUS)); break; }
            x = STEP[d][x];
          }
        }
      }
    }

    _genInherited(s, out, caps, atk, start) {
      const b = this.b, ex = this.ex, p = b[s], t = pType(p), c = pColor(p);
      const bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s];
      const fam = this.vInh[this.ids[s]], quiet = caps || atk, e = c ^ 1;
      const fwd = c === WHITE ? 1 : -1, lastRank = c === WHITE ? 8 : 1, startRank = c === WHITE ? 2 : 7;
      const royal = FAM[t] === K, pawn = isPawn(t);
      const have = new Set();
      for (let i = start; i < out.length; i++) if (moveFrom(out[i]) === s && !moveFlag(out[i])) have.add(moveTo(out[i]));
      const push = (x, cap) => {
        if (have.has(x) || (!cap && quiet)) return;
        have.add(x);
        if (pawn && CELL_R[x] === lastRank) { for (const pr of (caps ? [Q] : PROMOS[t])) out.push(mkMove(s, x, pr)); }
        else out.push(s | (x << 8));
      };
      const at = (ff, rr) => this.at(bd, ff, rr);
      const safe = x => atk || !royal || !this.isAttacked(x, e);
      if (fam === P) {
        const x1 = at(f, r + fwd);
        if (x1 >= 0 && !b[x1]) {
          push(x1, false);
          const x2 = at(f, r + 2 * fwd);
          if (r === startRank && x2 >= 0 && !b[x2]) push(x2, false);
        }
        for (const df of [-1, 1]) { const x = at(f + df, r + fwd); if (x >= 0 && b[x] && pColor(b[x]) !== c) push(x, true); }
      } else if (fam === N || fam === K) {
        for (const x of (fam === N ? KNIGHT[s] : KING[s])) {
          if (!ex[x]) continue;
          if (!b[x]) push(x, false); else if (pColor(b[x]) !== c) push(x, true);
        }
      } else {
        const d0 = fam === B ? 4 : 0, d1 = fam === R ? 4 : 8;
        for (let d = d0; d < d1; d++) {
          let x = STEP[d][s];
          while (x >= 0 && ex[x]) {
            if (!safe(x)) break;
            if (!b[x]) push(x, false);
            else { if (pColor(b[x]) !== c) push(x, true); break; }
            x = STEP[d][x];
          }
        }
      }
    }

    // ---------- Géomanciens : destruction et création de cases ----------
    _genGeo(s, out, caps, atk, start) {
      const b = this.b, ex = this.ex, t = pType(b[s]), c = pColor(b[s]);
      if (CELL_B[s] !== 0) return; // le terrain du plan est inaltérable
      const quiet = caps || atk;
      if (t === TERRASSIER) {
        // chaque coup de cavalier peut faire s'effondrer la case de départ
        const end = out.length;
        for (let i = start; i < end; i++) {
          const m = out[i];
          if (moveFlag(m) || moveFrom(m) !== s) continue;
          if (quiet && !b[moveTo(m)]) continue;
          out.push(mkMove(s, moveTo(m), 0, FLAG_COLLAPSE, s));
        }
      } else if (t === TELLURIQUE) {
        // après une prise, peut faire s'effondrer une case vide voisine de l'arrivée
        if (quiet) return;
        const end = out.length;
        for (let i = start; i < end; i++) {
          const m = out[i];
          if (moveFlag(m) || moveFrom(m) !== s) continue;
          const x = moveTo(m);
          if (!b[x] || pColor(b[x]) === c) continue;
          for (const y of KING[x]) if (y < NMAIN && ex[y] && (!b[y] || y === s)) out.push(mkMove(s, x, 0, FLAG_QUAKE, y));
        }
      } else if (!quiet && (t === ARPENTEUR || t === BATISSEUSE)) {
        // crée la première case manquante au bout d'une ligne dégagée
        const d0 = t === ARPENTEUR ? 4 : 0, d1 = t === ARPENTEUR ? 8 : 4;
        for (let d = d0; d < d1; d++) {
          let x = STEP[d][s];
          while (x >= 0 && ex[x] && !b[x]) x = STEP[d][x];
          if (x >= 0 && x < NMAIN && !ex[x]) out.push(mkMove(s, x, 0, FLAG_CREATE));
        }
      } else if (!quiet && t === DEMIURGE) {
        for (const x of KING[s]) if (x < NMAIN && !ex[x]) out.push(mkMove(s, x, 0, FLAG_CREATE));
      }
    }

    // ---------- Outremondes : le plan secondaire ----------
    planOpen() { return this.planTimer > 0; }
    planPieces() {
      const l = [];
      for (let x = NMAIN; x < NCELLS; x++) if (this.b[x]) l.push(x);
      return l;
    }
    // Case libre la plus proche (distance de Tchebychev) sur le plateau bd
    _nearestFree(bd, f0, r0, taken, okFn) {
      const size = 10;
      for (let d = 0; d < size; d++) {
        for (let dr = -d; dr <= d; dr++) {
          for (let df = -d; df <= d; df++) {
            if (Math.max(Math.abs(df), Math.abs(dr)) !== d) continue;
            const x = this.at(bd, f0 + df, r0 + dr);
            if (x < 0 || this.b[x] || (taken && taken.has(x)) || (okFn && !okFn(x))) continue;
            return x;
          }
        }
      }
      return -1;
    }
    _genOutre(s, out) {
      const b = this.b, t = pType(b[s]), c = pColor(b[s]);
      if (SHIFTERS.has(t)) {
        // la pièce garde sa case : elle passe sur la même coordonnée de l'autre plateau, si elle est libre
        const x = counterpart(s);
        if (x >= 0 && this.ex[x] && !b[x]) out.push(mkMove(s, x, 0, FLAG_SHIFT));
      }
      if (this.planOpen() || this.planPieces().length || s >= NMAIN) return;
      const target = x => { const q = b[x]; return q && pColor(q) !== c && FAM[pType(q)] !== K; };
      if (t === REFRACTEUR || t === ARCHE) {
        const d0 = t === ARCHE ? 0 : 4, d1 = t === ARCHE ? 4 : 8;
        for (let d = d0; d < d1; d++) {
          let x = STEP[d][s];
          while (x >= 0 && this.ex[x] && !b[x]) x = STEP[d][x];
          if (x >= 0 && this.ex[x] && target(x)) out.push(mkMove(s, x, 0, FLAG_OPEN));
        }
      } else if (t === EXILARQUE) {
        const allies = KING[s].filter(y => this.ex[y] && b[y] && pColor(b[y]) === c && FAM[pType(b[y])] !== K);
        for (let d = 0; d < 8; d++) {
          let x = s;
          for (let k = 1; k <= 2; k++) {
            x = STEP[d][x];
            if (x < 0 || !this.ex[x]) break;
            if (!b[x]) continue;
            if (target(x)) {
              out.push(mkMove(s, x, 0, FLAG_OPEN));
              for (const y of allies) out.push(mkMove(s, x, 0, FLAG_OPEN, y));
            }
            break;
          }
        }
      }
    }
    _toPlan(rec, x, taken) {
      const p = this.b[x], id = this.ids[x];
      const dst = this._nearestFree(1, clamp(CELL_F[x], 1, 8), clamp(CELL_R[x], 1, 8), taken);
      if (dst < 0) return;
      taken.add(dst);
      rec.hm.push(id, this.home[id]);
      this.home[id] = x;
      this._set(rec, x, 0, 255);
      this._set(rec, dst, p, id);
    }
    _returnAll(rec) {
      for (const x of this.planPieces()) {
        const p = this.b[x], id = this.ids[x], t = pType(p);
        let h = this.home[id];
        if (h < 0) h = counterpart(x);
        const okFn = y => !isPawn(t) || (CELL_R[y] !== 1 && CELL_R[y] !== 8);
        const dst = this.ex[h] && !this.b[h] && okFn(h) ? h : this._nearestFree(0, CELL_F[h], CELL_R[h], null, okFn);
        rec.hm.push(id, this.home[id]);
        this.home[id] = -1;
        this._set(rec, x, 0, 255);
        if (dst >= 0) this._set(rec, dst, p, id);
      }
    }

    // ---------- Horlogers : symétries et rotations ----------
    _ring(s) {
      const l = [];
      for (const [df, dr] of RING_CW) { const x = this.go(s, df, dr); if (x >= 0) l.push(x); }
      return l;
    }
    _rotOk(s, cw) {
      const b = this.b, ring = this._ring(s);
      if (ring.length < 2) return false;
      // l'anneau peut être entièrement occupé, mais la rotation doit changer quelque chose
      let same = true;
      for (const x of ring) { const q = b[x]; if (q && FAM[pType(q)] === K) return false; if (q !== b[ring[0]]) same = false; }
      if (same) return false;
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const q = b[ring[i]];
        if (!q || !isPawn(pType(q))) continue;
        const dst = ring[(i + (cw ? 1 : n - 1)) % n];
        if (dst < NMAIN && CELL_R[dst] === (pColor(q) === WHITE ? 8 : 1)) return false;
      }
      return true;
    }
    _genClock(s, out, caps, atk, start) {
      const b = this.b, ex = this.ex, t = pType(b[s]), c = pColor(b[s]);
      const bd = CELL_B[s], f = CELL_F[s], r = CELL_R[s], fwd = c === WHITE ? 1 : -1;
      const quiet = caps || atk;
      const enemy = q => q && pColor(q) !== c;
      if (t === BALANCIER) {
        // prise en diagonale arrière, reflet de sa prise habituelle
        for (const df of [-1, 1]) {
          const x = this.at(bd, f + df, r - fwd);
          if (x >= 0 && enemy(b[x])) out.push(s | (x << 8));
        }
      } else if (t === ECHAPPEMENT) {
        // Écho : après un saut sans prise A→B, capture à distance la case symétrique de A par rapport à B
        for (const y of KNIGHT[s]) {
          if (!ex[y] || b[y]) continue;
          const x = this.at(bd, 2 * CELL_F[y] - f, 2 * CELL_R[y] - r);
          if (x >= 0 && x !== s && enemy(b[x])) out.push(mkMove(s, y, 0, FLAG_ECHO, x));
        }
      } else if (t === GNOMON && !quiet) {
        // réflexion sur l'axe vertical ou horizontal du plateau
        const mx = 9;
        for (const x of [this.at(bd, mx - f, r), this.at(bd, f, mx - r)]) {
          if (x >= 0 && x !== s && !b[x]) out.push(s | (x << 8));
        }
      } else if ((t === ROUAGE || t === PENDULE) && !quiet) {
        if (this._rotOk(s, true)) out.push(mkMove(s, s, 0, FLAG_ROT));
        if (t === PENDULE && this._rotOk(s, false)) out.push(mkMove(s, s, 0, FLAG_ROT, s));
      } else if (t === CHRONARQUE && !quiet) {
        // échange avec une alliée symétrique par rapport à l'axe vertical ou horizontal
        for (const x of [this.at(bd, 9 - f, r), this.at(bd, f, 9 - r)]) {
          if (x < 0 || x === s || !b[x] || pColor(b[x]) !== c || FAM[pType(b[x])] === K) continue;
          if (isPawn(pType(b[x])) && (r === 1 || r === 8)) continue; // un pion n'arrive pas sur une rangée extrême
          out.push(mkMove(s, x, 0, FLAG_SWAP));
        }
      }
    }

    // ---------- Rémanents ----------
    _deadCendres(c) {
      const res = [];
      const rank = c === WHITE ? 2 : 7;
      for (let f = 1; f <= 8; f++) {
        const id = rank * 10 + f;
        if (this.cState[id] === 1 && !this.b[id] && this.ex[id]) res.push(id);
      }
      return res;
    }
    resurrectionSources(c = this.turn) {
      const dead = this._deadCendres(c);
      if (!dead.length) return [];
      const b = this.b, sources = [];
      const len = this.undo.length;
      const prev = len >= 2 ? this.undo[len - 2] : null;
      const prevOk = prev && prev.m >= 0 && prev.color === c;
      if (prevOk && prev.final >= 0) {
        const q = b[prev.final];
        const t = prev.type;
        if (q && pType(q) === t && pColor(q) === c && this.ids[prev.final] === prev.id && prev.capTypes.length) {
          const ok = (t === RAPPELANT && prev.capTypes.some(isPawn)) ||
            (t === PSALMISTE && prev.capTypes.some(x => FAM[x] === B || FAM[x] === N)) ||
            (t === ANAMNESE && prev.capTypes.some(x => !isPawn(x)));
          if (ok) sources.push([prev.final, dead]);
        }
      }
      let hasQueen = false;
      for (let s = 0; s < NCELLS; s++) { const q = b[s]; if (q && pColor(q) === c && FAM[pType(q)] === Q) hasQueen = true; }
      for (let s = 0; s < NMAIN; s++) {
        const q = b[s];
        if (!q || pColor(q) !== c) continue;
        const t = pType(q);
        if (t === RELIQUAIRE && (c === WHITE ? CELL_R[s] >= 5 : CELL_R[s] <= 4)) sources.push([s, dead]);
        if (t === LEGATAIRE && !hasQueen) sources.push([s, dead]);
      }
      if (prevOk) {
        for (const id of dead) {
          if (this.cCap[id] >= 0 && prev.capIds.includes(this.cCap[id])) sources.push([id, [id]]);
        }
      }
      return sources;
    }
    genResurrections(out) {
      const seen = new Set();
      for (const [src, list] of this.resurrectionSources()) {
        for (const id of list) {
          const key = src * 256 + id;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(mkMove(src, id, 0, FLAG_RES));
        }
      }
    }

    // ---------- Jouer / annuler ----------
    _set(rec, sq, piece, id) {
      const b = this.b, old = b[sq];
      rec.ch.push(sq, old, this.ids[sq]);
      if (old) {
        this.h1 ^= Z1[old * NCELLS + sq]; this.h2 ^= Z2[old * NCELLS + sq];
        if (COMPLEX[pType(old)]) this.cx[pColor(old)]--;
      }
      b[sq] = piece;
      this.ids[sq] = piece ? id : 255;
      if (piece) {
        this.h1 ^= Z1[piece * NCELLS + sq]; this.h2 ^= Z2[piece * NCELLS + sq];
        if (COMPLEX[pType(piece)]) this.cx[pColor(piece)]++;
        if (isRoyal(pType(piece))) this.kings[pColor(piece)] = sq;
      }
    }
    _setEx(rec, sq, v) {
      if (this.ex[sq] === v) return;
      rec.xs.push(sq, this.ex[sq]);
      this.ex[sq] = v;
      this.h1 ^= ZX1[sq]; this.h2 ^= ZX2[sq];
      if (!v && this.glyph[sq]) this._setGlyph(rec, sq, 0);
    }
    _capture(rec, sq, capturerId) {
      const q = this.b[sq];
      rec.caps.push(q);
      rec.capTypes.push(pType(q));
      rec.capIds.push(this.ids[sq]);
      if (pType(q) === CENDRE) {
        const id = this.ids[sq], st = this.cState[id];
        rec.sc.push(id, st, this.cCap[id]);
        this.cState[id] = st === 0 ? 1 : st === 2 ? 3 : st;
        this.cCap[id] = capturerId;
      }
      this._set(rec, sq, 0, 255);
    }

    make(m) {
      const b = this.b, from = moveFrom(m), to = moveTo(m), promo = movePromo(m), flag = moveFlag(m);
      const extra = moveExtra(m);
      const c = this.turn, p = b[from], id = this.ids[from], t = pType(p);
      const rec = {
        m, color: c, type: t, id, final: -1, caps: [], capTypes: [], capIds: [], ch: [], sc: [], gl: [], vs: [], xs: [], hm: [],
        castle: this.castle, ep: this.ep, half: this.half, h1: this.h1, h2: this.h2, k0: this.kings[0], k1: this.kings[1],
        forced: this.forced, toggled: true, sac: 0, immune: this.immune, immuneLeft: this.immuneLeft, planTimer: this.planTimer,
        returned: false, preSafe: true
      };
      const release = [];
      if (this.gCount) {
        for (let x = 0; x < NCELLS; x++) {
          const g = this.glyph[x];
          if (g && (g & 7) === G_ENTRAVE && (g & G_ARMED) && ((g >> 3) & 1) !== c) release.push(x);
        }
      }
      this.undo.push(rec);
      this.hist1.push(this.h1); this.hist2.push(this.h2);
      if (this.ep >= 0) { this.h1 ^= ZE1[CELL_F[this.ep]]; this.h2 ^= ZE2[CELL_F[this.ep]]; }
      this.h1 ^= ZC1[this.castle]; this.h2 ^= ZC2[this.castle];
      this.h1 ^= ZP1[this.planTimer]; this.h2 ^= ZP2[this.planTimer];
      const fwd = c === WHITE ? 1 : -1;
      const promoRank = c === WHITE ? 8 : 1;
      let pawnMove = isPawn(t);

      switch (flag) {
        case FLAG_SWAP: {
          const a = b[to], aid = this.ids[to];
          this._set(rec, to, p, id);
          this._set(rec, from, a, aid);
          rec.final = to;
          break;
        }
        case FLAG_BELIER: {
          const pw = b[to], pid = this.ids[to];
          this._set(rec, this.go(to, 0, fwd), promo ? promo | (c << 7) : pw, pid);
          this._set(rec, to, p, id);
          this._set(rec, from, 0, 255);
          rec.final = to;
          pawnMove = true;
          break;
        }
        case FLAG_MENEUSE: {
          for (const x of extra >= 0 ? [to, extra] : [to]) {
            const pw = b[x], pid = this.ids[x], y = this.go(x, 0, fwd);
            const promoting = CELL_B[y] === 0 && CELL_R[y] === promoRank;
            this._set(rec, y, promoting && promo ? promo | (c << 7) : pw, pid);
            this._set(rec, x, 0, 255);
          }
          rec.final = from;
          pawnMove = true;
          break;
        }
        case FLAG_TRACE: {
          if (extra >= 0) this._setGlyph(rec, extra, 0);
          this._setGlyph(rec, to, FAM[t] | (c << 3));
          rec.final = from;
          break;
        }
        case FLAG_APO:
          rec.final = from;
          this.immune = c;
          this.immuneLeft = 2;
          rec.toggled = false;
          break;
        case FLAG_ABSORB: {
          rec.sac = b[to];
          this._set(rec, to, p, id);
          this._set(rec, from, 0, 255);
          this._setVorace(rec, id, FAM[pType(rec.sac)], 1);
          rec.final = to;
          pawnMove = true;
          if (t === DEVORACLE) rec.toggled = false;
          break;
        }
        case FLAG_RES: {
          const rs = this.cState[to];
          rec.sc.push(to, rs, this.cCap[to]);
          this.cState[to] = 2;
          this._set(rec, to, CENDRE | (c << 7), to);
          rec.final = from === to ? to : from;
          rec.type = from === to ? CENDRE : t;
          pawnMove = true;
          break;
        }
        case FLAG_DESTROY: this._setEx(rec, to, 0); rec.final = from; break;
        case FLAG_CREATE: this._setEx(rec, to, 1); rec.final = from; pawnMove = true; break;
        case FLAG_OPEN: {
          const taken = new Set();
          const movers = [];
          if (!isRoyal(t)) movers.push(from);
          movers.push(to);
          if (extra >= 0) movers.push(extra);
          for (const x of movers) this._toPlan(rec, x, taken);
          this.planTimer = PLAN_PLIES;
          pawnMove = true;
          break;
        }
        case FLAG_ROT: {
          const cw = extra < 0, ring = this._ring(from), n = ring.length;
          const content = ring.map(x => [b[x], this.ids[x]]);
          for (let i = 0; i < n; i++) {
            const [q, qid] = content[i];
            const dst = ring[(i + (cw ? 1 : n - 1)) % n];
            this._set(rec, dst, q, qid);
          }
          for (const x of ring) this.castle &= CASTLE_MASK[x];
          rec.final = from;
          break;
        }
        default: {
          let capSq = to;
          if (flag === FLAG_EP) capSq = this.go(to, 0, -fwd);
          if (flag !== FLAG_ECHO && b[capSq]) this._capture(rec, capSq, id);
          this._set(rec, from, 0, 255);
          this._set(rec, to, promo ? promo | (c << 7) : p, id);
          rec.final = to;
          if (flag === FLAG_CK || flag === FLAG_CQ) {
            const rb = c === WHITE ? 10 : 80;
            const rf = flag === FLAG_CK ? rb + 8 : rb + 1, rt = flag === FLAG_CK ? rb + 6 : rb + 4;
            const rp = b[rf], rid = this.ids[rf];
            this._set(rec, rf, 0, 255);
            this._set(rec, rt, rp, rid);
          } else if (flag === FLAG_FOLLOW && extra >= 0) {
            if (b[extra]) this._capture(rec, extra, id);
            this._set(rec, to, 0, 255);
            this._set(rec, extra, p, id);
            rec.final = extra;
          } else if (flag === FLAG_ECHO && extra >= 0 && b[extra]) {
            this._capture(rec, extra, id);
          } else if (flag === FLAG_COLLAPSE) {
            this._setEx(rec, from, 0);
          } else if (flag === FLAG_QUAKE && extra >= 0 && !b[extra]) {
            this._setEx(rec, extra, 0);
          } else if (flag === FLAG_SHIFT) {
            rec.hm.push(id, this.home[id]);
            this.home[id] = to >= NMAIN ? (this.home[id] >= 0 ? this.home[id] : from) : -1;
            if (to >= NMAIN && !this.planTimer) this.planTimer = PLAN_PLIES;
          }
          if (flag === FLAG_GLYPH) {
            if ((this.glyph[from] & 7) === G_PASSAGE && this.glyph[to]) this._setGlyph(rec, to, 0);
            this._setGlyph(rec, from, 0);
          }
          if (flag === FLAG_BONUS) this._setVorace(rec, id, this.vInh[id], 0);
          if (promo && this.vInh[id]) this._setVorace(rec, id, 0, 0);
          // Sapeur : après une prise, sa case de départ s'effondre
          if (t === SAPEUR && rec.caps.length && from < NMAIN && !b[from]) this._setEx(rec, from, 0);
        }
      }

      // Silence : le glyphe disparaît au départ de la pièce réduite au silence
      const chg = rec.ch;
      for (let i = 0; i < chg.length; i += 3) {
        const x = chg[i], g = this.glyph[x], old = chg[i + 1];
        if (g && (g & 7) === G_SILENCE && old && pColor(old) !== ((g >> 3) & 1) && this.ids[x] !== chg[i + 2]) this._setGlyph(rec, x, 0);
      }
      if (rec.final >= 0 && flag !== FLAG_TRACE && flag !== FLAG_APO && flag !== FLAG_RES && flag !== FLAG_MENEUSE &&
        flag !== FLAG_ROT && flag !== FLAG_DESTROY && flag !== FLAG_CREATE) {
        const x = rec.final, g = this.glyph[x], q = b[x];
        if (g && q && (g & 7) === G_ENTRAVE && !(g & G_ARMED) && ((g >> 3) & 1) !== c && FAM[pType(q)] !== K) {
          this._setGlyph(rec, x, g | G_ARMED, this.ids[x]);
        }
      }
      for (const x of release) if (this.glyph[x]) this._setGlyph(rec, x, 0);

      this.castle &= CASTLE_MASK[from] & CASTLE_MASK[to];
      if (extra >= 0) this.castle &= CASTLE_MASK[extra];
      this.ep = -1;
      if (flag === FLAG_DOUBLE) {
        const capable = q => q && pColor(q) !== c && MOVE[pType(q)] === P;
        const l = this.go(to, -1, 0), rgt = this.go(to, 1, 0);
        if ((l >= 0 && capable(b[l])) || (rgt >= 0 && capable(b[rgt]))) this.ep = this.go(to, 0, -fwd);
      }
      this.half = (pawnMove || rec.caps.length) ? 0 : this.half + 1;

      // Plan secondaire : décompte, fermeture anticipée s'il est vide, retour des pièces
      if (rec.toggled && rec.planTimer > 0 && this.planTimer > 0) this.planTimer--;
      if (this.planTimer > 0 && !this.planPieces().length) this.planTimer = 0;
      if (this.planTimer === 0 && rec.planTimer > 0 && this.planPieces().length) {
        rec.preSafe = this.immune === c || !this.isAttacked(this.kings[c], c ^ 1);
        rec.returned = true;
        this._returnAll(rec);
      }

      if (this.ep >= 0) { this.h1 ^= ZE1[CELL_F[this.ep]]; this.h2 ^= ZE2[CELL_F[this.ep]]; }
      this.h1 ^= ZC1[this.castle]; this.h2 ^= ZC2[this.castle];
      this.h1 ^= ZP1[this.planTimer]; this.h2 ^= ZP2[this.planTimer];
      if (rec.toggled) {
        if (c === BLACK) this.full++;
        this.turn = c ^ 1;
        this.h1 ^= ZT1; this.h2 ^= ZT2;
        this.forced = -1;
        if (this.immune === this.turn && --this.immuneLeft <= 0) { this.immune = -1; this.immuneLeft = 0; }
      } else {
        this.forced = id;
      }
      if (rec.immune !== this.immune || rec.immuneLeft !== this.immuneLeft) {
        this.h1 ^= immKey1(rec.immune, rec.immuneLeft) ^ immKey1(this.immune, this.immuneLeft);
        this.h2 ^= immKey2(rec.immune, rec.immuneLeft) ^ immKey2(this.immune, this.immuneLeft);
      }
      return rec;
    }

    unmake() {
      const rec = this.undo.pop();
      const ch = rec.ch, b = this.b;
      for (let i = ch.length - 3; i >= 0; i -= 3) {
        const sq = ch[i], cur = b[sq], old = ch[i + 1];
        if (cur && COMPLEX[pType(cur)]) this.cx[pColor(cur)]--;
        if (old && COMPLEX[pType(old)]) this.cx[pColor(old)]++;
        b[sq] = old;
        this.ids[sq] = ch[i + 2];
      }
      const sc = rec.sc;
      for (let i = sc.length - 3; i >= 0; i -= 3) { this.cState[sc[i]] = sc[i + 1]; this.cCap[sc[i]] = sc[i + 2]; }
      const gl = rec.gl;
      for (let i = gl.length - 3; i >= 0; i -= 3) {
        const cur = this.glyph[gl[i]], old = gl[i + 1];
        if (cur && !old) this.gCount--;
        if (!cur && old) this.gCount++;
        this.glyph[gl[i]] = old; this.gTrap[gl[i]] = gl[i + 2];
      }
      const vs = rec.vs;
      for (let i = vs.length - 3; i >= 0; i -= 3) {
        const id = vs[i];
        if (this.vInh[id] && !vs[i + 1]) this.anyInh--;
        if (!this.vInh[id] && vs[i + 1]) this.anyInh++;
        this.vInh[id] = vs[i + 1]; this.vBonus[id] = vs[i + 2];
      }
      const xs = rec.xs;
      for (let i = xs.length - 2; i >= 0; i -= 2) this.ex[xs[i]] = xs[i + 1];
      const hm = rec.hm;
      for (let i = hm.length - 2; i >= 0; i -= 2) this.home[hm[i]] = hm[i + 1];
      this.turn = rec.color;
      this.forced = rec.forced;
      this.immune = rec.immune;
      this.immuneLeft = rec.immuneLeft;
      this.planTimer = rec.planTimer;
      if (rec.toggled && rec.color === BLACK) this.full--;
      this.castle = rec.castle; this.ep = rec.ep; this.half = rec.half;
      this.h1 = rec.h1; this.h2 = rec.h2;
      this.kings[0] = rec.k0; this.kings[1] = rec.k1;
      this.hist1.pop(); this.hist2.pop();
    }

    makeNull() {
      this.undo.push({ m: -1, color: this.turn, ch: [], sc: [], caps: [], capTypes: [], capIds: [], forced: this.forced,
        castle: this.castle, ep: this.ep, half: this.half, h1: this.h1, h2: this.h2, k0: this.kings[0], k1: this.kings[1] });
      this.forced = -1;
      this.hist1.push(this.h1); this.hist2.push(this.h2);
      if (this.ep >= 0) { this.h1 ^= ZE1[CELL_F[this.ep]]; this.h2 ^= ZE2[CELL_F[this.ep]]; }
      this.ep = -1;
      this.half++;
      this.turn ^= 1;
      this.h1 ^= ZT1; this.h2 ^= ZT2;
    }
    unmakeNull() {
      const u = this.undo.pop();
      this.turn ^= 1;
      this.forced = u.forced;
      this.castle = u.castle; this.ep = u.ep; this.half = u.half;
      this.h1 = u.h1; this.h2 = u.h2;
      this.hist1.pop(); this.hist2.pop();
    }

    legal() {
      const out = [], res = [], c = this.turn;
      this.gen(out, false);
      for (let i = 0; i < out.length; i++) {
        this.make(out[i]);
        if (this.safeAfter(out[i], c)) res.push(out[i]);
        this.unmake();
      }
      return res;
    }

    // Après make(m) joué par c : le coup est-il légal ?
    safeAfter(m, c) {
      if (moveFlag(m) === FLAG_APO || this.immune === c) return true;
      const u = this.undo[this.undo.length - 1];
      if (u && u.returned) return u.preSafe; // le retour du plan ne rend pas un coup illégal
      return !this.isAttacked(this.kings[c], c ^ 1);
    }

    isCapture(m) {
      const b = this.b, to = moveTo(m), flag = moveFlag(m), c = this.turn;
      if (flag === FLAG_EP) return true;
      if (flag === FLAG_SWAP || flag === FLAG_BELIER || flag === FLAG_MENEUSE || flag === FLAG_RES ||
        flag === FLAG_TRACE || flag === FLAG_APO || flag === FLAG_ABSORB || flag === FLAG_DESTROY ||
        flag === FLAG_CREATE || flag === FLAG_OPEN || flag === FLAG_SHIFT || flag === FLAG_ROT) return false;
      if (flag === FLAG_ECHO) { const x = moveExtra(m); return x >= 0 && !!b[x] && pColor(b[x]) !== c; }
      const q = b[to];
      if (q && pColor(q) !== c) return true;
      if (flag === FLAG_FOLLOW) { const x = moveExtra(m); return x >= 0 && !!b[x] && pColor(b[x]) !== c; }
      return false;
    }

    // ---------- Fin de partie ----------
    repetitions() {
      let n = 1;
      const len = this.hist1.length, stop = Math.max(0, len - this.half);
      for (let i = len - 2; i >= stop; i -= 2) {
        if (this.hist1[i] === this.h1 && this.hist2[i] === this.h2) n++;
      }
      return n;
    }

    insufficientMaterial() {
      const minors = [];
      for (let s = 0; s < NCELLS; s++) {
        const p = this.b[s];
        if (!p) continue;
        const t = pType(p);
        if (isRoyal(t)) continue;
        if ((t === N || t === B) && s < NMAIN) minors.push({ t, s });
        else return false;
      }
      if (minors.length <= 1) return true;
      if (minors.every(m => m.t === B)) {
        const col = m => (CELL_F[m.s] + CELL_R[m.s]) & 1;
        return minors.every(m => col(m) === col(minors[0]));
      }
      return false;
    }

    status(legalMoves) {
      const moves = legalMoves || this.legal();
      if (!moves.length) {
        if (this.inCheck()) return { over: true, result: this.turn === WHITE ? '0-1' : '1-0', reason: 'checkmate' };
        return { over: true, result: '1/2-1/2', reason: 'stalemate' };
      }
      if (this.insufficientMaterial()) return { over: true, result: '1/2-1/2', reason: 'material' };
      if (this.half >= 100) return { over: true, result: '1/2-1/2', reason: 'fifty' };
      if (this.repetitions() >= 3) return { over: true, result: '1/2-1/2', reason: 'repetition' };
      return { over: false };
    }

    // ---------- Notation : { piece, body, promo, suffix } ----------
    san(m, legalMoves) {
      const b = this.b, from = moveFrom(m), to = moveTo(m), promo = movePromo(m), flag = moveFlag(m);
      const extra = moveExtra(m);
      const p = b[from], t = pType(p);
      let body = '', piece = t === P ? 0 : t;
      if (flag === FLAG_CK) { body = 'O-O'; piece = 0; }
      else if (flag === FLAG_CQ) { body = 'O-O-O'; piece = 0; }
      else if (flag === FLAG_SWAP) body = '⇄' + sqName(to);
      else if (flag === FLAG_BELIER) body = '⇑' + sqName(to);
      else if (flag === FLAG_MENEUSE) body = '⇑' + sqName(to) + (extra >= 0 ? ',' + sqName(extra) : '');
      else if (flag === FLAG_RES) { piece = from === to ? CENDRE : t; body = '↺' + sqName(to); }
      else if (flag === FLAG_TRACE) body = '✎' + sqName(to) + (extra >= 0 ? '(×' + sqName(extra) + ')' : '');
      else if (flag === FLAG_APO) body = '☀';
      else if (flag === FLAG_ABSORB) body = '⊕' + sqName(to);
      else if (flag === FLAG_GLYPH) body = '»' + sqName(to);
      else if (flag === FLAG_DESTROY) body = '✖' + sqName(to);
      else if (flag === FLAG_CREATE) body = '✚' + sqName(to);
      else if (flag === FLAG_OPEN) body = '⟿' + sqName(to) + (extra >= 0 ? '+' + sqName(extra) : '');
      else if (flag === FLAG_SHIFT) body = '⇋' + sqName(to);
      else if (flag === FLAG_ROT) body = extra < 0 ? '↻' : '↺';
      else {
        const capture = (!!b[to] && pColor(b[to]) !== pColor(p)) || flag === FLAG_EP;
        if (t === P) {
          if (capture) body += sqName(from)[0];
        } else {
          const others = (legalMoves || this.legal()).filter(o =>
            moveTo(o) === to && moveFrom(o) !== from && b[moveFrom(o)] === p && moveFlag(o) === flag);
          if (others.length) {
            const sameFile = others.some(o => CELL_F[moveFrom(o)] === CELL_F[from]);
            const sameRank = others.some(o => CELL_R[moveFrom(o)] === CELL_R[from]);
            const nm = sqName(from);
            if (!sameFile) body += nm.slice(0, nm.length - 1);
            else if (!sameRank) body += nm.slice(-1);
            else body += nm;
          }
        }
        if (capture) body += 'x';
        body += sqName(to);
        if (flag === FLAG_FOLLOW && extra >= 0) body += (b[extra] && extra !== from ? 'x' : '→') + sqName(extra);
        if (flag === FLAG_ECHO && extra >= 0) body += '⊗' + sqName(extra);
        if (flag === FLAG_COLLAPSE) body += '✖';
        if (flag === FLAG_QUAKE && extra >= 0) body += '✖' + sqName(extra);
      }
      this.make(m);
      let suffix = '';
      if (this.inCheck()) suffix = this.legal().length ? '+' : '#';
      this.unmake();
      return { piece, body, promo, suffix };
    }

    toUci(m) {
      const pr = movePromo(m);
      return sqName(moveFrom(m)) + sqName(moveTo(m)) + (pr ? UCI_PROMO[pr] || '' : '');
    }
    fromUci(str, legalMoves) {
      const moves = legalMoves || this.legal();
      return moves.find(m => this.toUci(m) === str) || 0;
    }

    toFEN() {
      let fen = '';
      for (let r = 8; r >= 1; r--) {
        let empty = 0;
        for (let f = 1; f <= 8; f++) {
          const p = this.b[r * 10 + f];
          if (!p) { empty++; continue; }
          if (empty) { fen += empty; empty = 0; }
          const l = FEN_LETTER[pType(p)] || '?';
          fen += pColor(p) === WHITE ? l.toUpperCase() : l;
        }
        if (empty) fen += empty;
        if (r > 1) fen += '/';
      }
      let cs = '';
      if (this.castle & 1) cs += 'K';
      if (this.castle & 2) cs += 'Q';
      if (this.castle & 4) cs += 'k';
      if (this.castle & 8) cs += 'q';
      return `${fen} ${this.turn === WHITE ? 'w' : 'b'} ${cs || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
    }

    isClassic() {
      for (let s = 0; s < NCELLS; s++) if (pType(this.b[s]) > K) return false;
      return true;
    }
  }

  function patternFor(type, sq, color = WHITE) {
    const pos = new Position();
    pos.b[sq] = type | (color << 7);
    pos.ids[sq] = sq;
    pos._recount();
    pos.turn = color;
    return pos.genPiece(sq, [], false, false).filter(m => moveFrom(m) === sq).map(m => moveTo(m));
  }

  G.ChessRules = {
    WHITE, BLACK, P, N, B, R, Q, K, BI, RE, VO, LO, CH, SO, CENDRE, NTYPES, NARCH, ZENARQUE,
    FLAG_DOUBLE, FLAG_EP, FLAG_CK, FLAG_CQ, FLAG_SWAP, FLAG_FOLLOW, FLAG_BELIER, FLAG_MENEUSE, FLAG_RES,
    FLAG_TRACE, FLAG_GLYPH, FLAG_ABSORB, FLAG_APO, FLAG_BONUS, FLAG_DESTROY, FLAG_CREATE, FLAG_COLLAPSE,
    FLAG_QUAKE, FLAG_OPEN, FLAG_SHIFT, FLAG_ECHO, FLAG_ROT, GLYPH_NAMES, G_ARMED, PLAN_PLIES,
    KEYS, NAMES, ARCH_NAMES, FAM, ARCH, MOVE, VALUES, PROMOS, KEY_TO_TYPE, CLASSIC_SETUP, SETUP_SQUARES,
    allowedFor, archOfKey, setupArchetypes, archPiece,
    NMAIN, NCELLS, CELL_B, CELL_F, CELL_R, cellIdx, isCore, DEFAULT_EX,
    FILES, sqName, sqFromName, moveFrom, moveTo, movePromo, moveFlag, moveExtra, mkMove,
    pColor, pType, isRoyal, isPawn, Position, patternFor
  };
})(typeof self !== 'undefined' ? self : globalThis);
