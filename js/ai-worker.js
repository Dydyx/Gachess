/*
 * Moteur de jeu pour les parties personnalisées (Web Worker).
 * Stockfish ne connaît pas les pièces inventées : ce moteur alpha-bêta s'appuie sur le même
 * générateur de coups que l'interface (js/rules.js), donc sur exactement les mêmes règles.
 * Recherche : approfondissement itératif, table de transposition, coup nul, LMR, killers,
 * historique, quiescence MVV-LVA. Le niveau Elo règle le temps, la profondeur et le bruit.
 */
importScripts('rules.js');
const CR = self.ChessRules;
const { Position, WHITE, P, N, B, R, Q, K, BI, RE, VO, LO, CH, SO } = CR;

const INF = 1000000, MATE = 900000;

// Tables « Simplified Evaluation Function » (rangée 8 en premier)
const T_P = [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0];
const T_N = [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50];
const T_B = [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20];
const T_R = [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0];
const T_Q = [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20];
const T_KM = [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20];
const T_KE = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
// Les pièces nouvelles empruntent la table de la pièce la plus proche
const TABLE = [];
const FAM_TABLE = [null, T_P, T_N, T_B, T_R, T_Q, null];
for (let t = 1; t <= CR.NTYPES; t++) TABLE[t] = FAM_TABLE[CR.FAM[t]];
TABLE[RE] = T_N; TABLE[LO] = T_N; // portée courte : centralisation
const FAM_PHASE = [0, 0, 1, 1, 2, 4, 0];
const PHASE = [];
for (let t = 0; t <= CR.NTYPES; t++) PHASE[t] = t ? FAM_PHASE[CR.FAM[t]] : 0;
PHASE[VO] = 1; PHASE[LO] = 2;

const NC = CR.NCELLS;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
// Indice de table (rangée 8 en premier) d'une case, vue par la couleur c ; -1 pour le plan secondaire
const tblIdx = (s, c) => {
  const f = clamp(CR.CELL_F[s], 1, 8) - 1, r = clamp(CR.CELL_R[s], 1, 8) - 1;
  return c === WHITE ? (7 - r) * 8 + f : r * 8 + f;
};
// PSQ[piece][case] = matériel + position, du point de vue des Blancs
const PSQ = [];
for (let c = 0; c < 2; c++) {
  for (let t = 1; t <= CR.NTYPES; t++) {
    const arr = new Int32Array(NC);
    for (let s = 0; s < NC; s++) {
      const idx = tblIdx(s, c);
      const v = CR.VALUES[t] + (TABLE[t] && idx >= 0 ? TABLE[t][idx] : 0);
      arr[s] = c === WHITE ? v : -v;
    }
    PSQ[t | (c << 7)] = arr;
  }
}

function evaluate(pos) {
  const b = pos.b;
  let score = 0, phase = 0, bw = 0, bb = 0;
  for (let s = 0; s < NC; s++) {
    const p = b[s];
    if (!p) continue;
    const t = p & 127;
    if (CR.FAM[t] === K) continue;
    score += PSQ[p][s];
    phase += PHASE[t];
    if (t === B) { if (p >> 7) bb++; else bw++; }
  }
  if (phase > 24) phase = 24;
  const kw = pos.kings[0], kb = pos.kings[1];
  if (kw >= 0) {
    const i = tblIdx(kw, WHITE);
    if (i >= 0) score += (T_KM[i] * phase + T_KE[i] * (24 - phase)) / 24;
  }
  if (kb >= 0) {
    const i = tblIdx(kb, 1);
    if (i >= 0) score -= (T_KM[i] * phase + T_KE[i] * (24 - phase)) / 24;
  }
  if (bw >= 2) score += 30;
  if (bb >= 2) score -= 30;
  // Voraces : une marche héritée vaut une part de la pièce absorbée
  if (pos.anyInh) {
    for (let s = 0; s < NC; s++) {
      const p = b[s];
      if (!p) continue;
      const inh = pos.vInh[pos.ids[s]];
      if (inh) score += ((p >> 7) ? -1 : 1) * (CR.VALUES[inh] * 0.55 + (pos.vBonus[pos.ids[s]] ? 40 : 0));
    }
  }
  // Palimpsestes : un glyphe posé vaut un léger avantage
  if (pos.gCount) for (let s = 0; s < NC; s++) { const g = pos.glyph[s]; if (g) score += (g & 8) ? -18 : 18; }
  // Héliarques : chaque soutien lié au Zénarque
  for (const c of [0, 1]) {
    const k = pos.kings[c];
    if (k >= 0 && (b[k] & 127) === CR.ZENARQUE) score += (c ? -1 : 1) * 25 * pos.court(c).types.size;
  }
  return ((pos.turn === WHITE ? score : -score) | 0) + 10;
}

// ---------- Table de transposition ----------
const TT_BITS = 20, TT_SIZE = 1 << TT_BITS, TT_MASK = TT_SIZE - 1;
const ttKey = new Int32Array(TT_SIZE), ttMove = new Float64Array(TT_SIZE),
  ttScore = new Int32Array(TT_SIZE), ttDepth = new Int8Array(TT_SIZE), ttFlag = new Uint8Array(TT_SIZE);
const EXACT = 1, LOWER = 2, UPPER = 3;
function ttClear() { ttKey.fill(0); ttFlag.fill(0); }

const killers = [];
for (let i = 0; i < 128; i++) killers.push([0, 0]);
const history = new Int32Array(256 * NC);

let nodes = 0, deadline = 0, stopped = false;

function isRepeat(pos) {
  const len = pos.hist1.length, stop = Math.max(0, len - pos.half);
  for (let i = len - 2; i >= stop; i -= 2) {
    if (pos.hist1[i] === pos.h1 && pos.hist2[i] === pos.h2) return true;
  }
  return false;
}

function hasPieces(pos) {
  const base = pos.turn;
  for (let s = 0; s < NC; s++) {
    const p = pos.b[s];
    if (p && (p >> 7) === base) {
      const f = CR.FAM[p & 127];
      if (f !== P && f !== K) return true;
    }
  }
  return false;
}

function orderMoves(pos, moves, ttm, ply) {
  const b = pos.b, scores = new Int32Array(moves.length);
  const k = killers[ply] || [0, 0];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i], to = CR.moveTo(m), promo = CR.movePromo(m), from = CR.moveFrom(m);
    const cap = pos.isCapture(m);
    const victim = cap ? (b[to] && (b[to] >> 7) !== pos.turn ? b[to] : P) : 0;
    let s;
    if (m === ttm) s = 10000000;
    else if (cap) s = 1000000 + CR.VALUES[victim & 127] * 10 - CR.VALUES[(b[from] & 127) || P] / 10;
    else if (promo) s = 900000 + CR.VALUES[promo];
    else if (m === k[0]) s = 800000;
    else if (m === k[1]) s = 700000;
    else s = history[b[from] * NC + to];
    scores[i] = s;
  }
  // tri par insertion (listes courtes)
  for (let i = 1; i < moves.length; i++) {
    const m = moves[i], s = scores[i];
    let j = i - 1;
    while (j >= 0 && scores[j] < s) { moves[j + 1] = moves[j]; scores[j + 1] = scores[j]; j--; }
    moves[j + 1] = m; scores[j + 1] = s;
  }
  return moves;
}

function qsearch(pos, alpha, beta, ply) {
  if ((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
  if (stopped) return 0;
  const stand = evaluate(pos);
  if (ply > 60) return stand;
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  const moves = orderMoves(pos, pos.gen([], true), 0, ply);
  const c = pos.turn;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    // élagage delta : une prise qui ne peut pas remonter alpha est ignorée
    const victim = pos.b[CR.moveTo(m)];
    if (!CR.movePromo(m) && stand + CR.VALUES[victim & 127] + 200 < alpha) continue;
    pos.make(m);
    if (!pos.safeAfter(m, c)) { pos.unmake(); continue; }
    const s = -qsearch(pos, -beta, -alpha, ply + 1);
    pos.unmake();
    if (stopped) return 0;
    if (s >= beta) return s;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

// Score du point de vue de c après un coup (la Dévoracle peut rejouer : même camp au trait)
function child(pos, c, depth, alpha, beta, ply) {
  if (pos.turn === c) return search(pos, depth, alpha, beta, ply, false);
  return -search(pos, depth, -beta, -alpha, ply, true);
}

function search(pos, depth, alpha, beta, ply, allowNull) {
  if ((++nodes & 2047) === 0 && Date.now() > deadline) stopped = true;
  if (stopped) return 0;
  if (ply > 0 && (pos.half >= 100 || isRepeat(pos))) return 0;
  const c = pos.turn;
  const inCheck = pos.isAttacked(pos.kings[c], c ^ 1);
  if (inCheck) depth++;
  if (depth <= 0) return qsearch(pos, alpha, beta, ply);
  if (ply > 100) return evaluate(pos);

  const idx = pos.h1 & TT_MASK;
  let ttm = 0;
  if (ttKey[idx] === pos.h2 && ttFlag[idx]) {
    ttm = ttMove[idx];
    if (ttDepth[idx] >= depth) {
      let s = ttScore[idx];
      if (s > MATE - 1000) s -= ply; else if (s < -MATE + 1000) s += ply;
      const f = ttFlag[idx];
      if (f === EXACT || (f === LOWER && s >= beta) || (f === UPPER && s <= alpha)) return s;
    }
  }

  if (allowNull && !inCheck && pos.forced < 0 && pos.immune < 0 && depth >= 3 && beta < MATE - 1000 && hasPieces(pos) && evaluate(pos) >= beta) {
    pos.makeNull();
    const s = -search(pos, depth - 3, -beta, -beta + 1, ply + 1, false);
    pos.unmakeNull();
    if (stopped) return 0;
    if (s >= beta) return beta;
  }

  const moves = orderMoves(pos, pos.gen([], false), ttm, ply);
  const origAlpha = alpha;
  let best = -INF, bestMove = 0, legal = 0;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const quiet = !CR.movePromo(m) && !pos.isCapture(m);
    pos.make(m);
    if (!pos.safeAfter(m, c)) { pos.unmake(); continue; }
    legal++;
    let s;
    if (legal === 1) {
      s = child(pos, c, depth - 1, alpha, beta, ply + 1);
    } else {
      let red = 0;
      if (depth >= 3 && legal > 3 && quiet && !inCheck) red = legal > 10 ? 2 : 1;
      s = child(pos, c, depth - 1 - red, alpha, alpha + 1, ply + 1);
      if (s > alpha && (red || s < beta)) s = child(pos, c, depth - 1, alpha, beta, ply + 1);
    }
    pos.unmake();
    if (stopped) return 0;
    if (s > best) {
      best = s; bestMove = m;
      if (s > alpha) {
        alpha = s;
        if (s >= beta) {
          if (quiet) {
            const k = killers[ply];
            if (k && k[0] !== m) { k[1] = k[0]; k[0] = m; }
            history[pos.b[CR.moveFrom(m)] * NC + CR.moveTo(m)] += depth * depth;
          }
          break;
        }
      }
    }
  }
  if (!legal) return inCheck ? -MATE + ply : 0;

  let st = best;
  if (st > MATE - 1000) st += ply; else if (st < -MATE + 1000) st -= ply;
  ttKey[idx] = pos.h2; ttMove[idx] = bestMove; ttScore[idx] = st; ttDepth[idx] = depth;
  ttFlag[idx] = best <= origAlpha ? UPPER : best >= beta ? LOWER : EXACT;
  return best;
}

// Réglages selon le niveau demandé
function levelParams(elo) {
  const t = Math.min(1, Math.max(0, (elo - 400) / 2400));
  return {
    time: Math.round(250 + 2350 * Math.pow(t, 1.3)),
    maxDepth: elo < 800 ? 1 : elo < 1100 ? 2 : elo < 1400 ? 3 : elo < 1700 ? 4 : elo < 2000 ? 5 : elo < 2300 ? 6 : 64,
    noise: Math.round(220 * (1 - t) * (1 - t)),
    blunder: elo < 1200 ? 0.30 * (1 - (elo - 400) / 800) + 0.02 : 0
  };
}

function think(pos, elo) {
  const legal = pos.legal();
  if (!legal.length) return 0;
  if (legal.length === 1) return legal[0];
  const prm = levelParams(elo);
  if (Math.random() < prm.blunder) return legal[Math.floor(Math.random() * legal.length)];

  const start = Date.now();
  deadline = start + prm.time;
  stopped = false;
  nodes = 0;
  for (const k of killers) { k[0] = 0; k[1] = 0; }
  for (let i = 0; i < history.length; i++) history[i] >>= 2;

  let root = orderMoves(pos, legal.slice(), 0, 0).map(m => ({ m, s: -INF }));
  let done = root.map(r => ({ m: r.m, s: 0 }));
  const margin = prm.noise * 2;
  const rootColor = pos.turn;
  for (let depth = 1; depth <= prm.maxDepth; depth++) {
    let best = -INF, iterBest = null;
    for (const r of root) {
      pos.make(r.m);
      const lower = best === -INF ? -INF : best - margin - 1;
      const s = child(pos, rootColor, depth - 1, lower, INF, 1);
      pos.unmake();
      if (stopped) break;
      r.s = s;
      if (s > best) { best = s; iterBest = r; }
    }
    if (stopped) {
      // itération incomplète : on garde la précédente, en remontant un meilleur coup déjà prouvé
      if (iterBest && depth > 1 && iterBest.m !== done[0].m) {
        done = [{ m: iterBest.m, s: iterBest.s }].concat(done.filter(d => d.m !== iterBest.m));
      }
      break;
    }
    root.sort((a, b) => b.s - a.s);
    done = root.map(r => ({ m: r.m, s: r.s }));
    root.forEach(r => { r.s = -INF; });
    if (Math.abs(done[0].s) > MATE - 1000) break;
    if (Date.now() - start > prm.time * 0.55) break;
  }

  if (!prm.noise) return done[0].m;
  // Bruit d'évaluation : les niveaux faibles choisissent parfois un coup un peu moins bon
  let pick = done[0], pickScore = -INF;
  for (const r of done) {
    if (r.s < done[0].s - margin) continue;
    const v = r.s + (Math.random() * 2 - 1) * prm.noise;
    if (v > pickScore) { pickScore = v; pick = r; }
  }
  return pick.m;
}

self.onmessage = e => {
  const d = e.data;
  if (d.type === 'new') { ttClear(); history.fill(0); return; }
  if (d.type === 'think') {
    const pos = Position.fromSetups(d.setupW, d.setupB);
    for (const m of d.moves) pos.make(m);
    const move = think(pos, d.elo);
    self.postMessage({ id: d.id, move });
  }
};
