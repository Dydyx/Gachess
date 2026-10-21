/*
 * Échiquier interactif façon chess.com : clic ou glisser-déposer, aperçu des coups légaux,
 * anneaux de prise, dernier coup surligné, échec, coordonnées, promotion,
 * clic droit pour marquer une case, clic droit glissé pour tracer une flèche.
 *
 * Deux surfaces : le plateau principal (cadre fixe 10×10 de cases de 64 px, dont seules les cases
 * existantes sont dessinées) et, si fourni, le plan secondaire des Outremondes (8×8 de 36 px).
 */
(function (G) {
  'use strict';
  const CR = G.ChessRules, Art = G.PieceArt;
  const MOBILE = !!G.GACHESS_MOBILE;
  const MAIN_SQ = MOBILE ? 34 : 64, PLAN_SQ = MOBILE ? 34 : 36;
  const NC = CR.NCELLS;
  const pColor = p => p >> 7;

  class Board {
    /* opts :
         mode               'play' | 'edit'
         planEl             conteneur du plan secondaire (facultatif)
         canSelect(sq)      -> bool       (mode play)
         movesFrom(sq)      -> [coups]    (mode play)
         onMove(coup)                     (mode play)
         onSelect(sq)                     (mode play, facultatif)
         onSquareClick(sq)                (mode edit) */
    constructor(el, opts) {
      this.el = el;
      this.opts = Object.assign({ mode: 'play' }, opts);
      this.orientation = CR.WHITE;
      this.codes = new Uint8Array(NC);
      this.ex = CR.DEFAULT_EX.slice();
      this.els = new Array(NC).fill(null);
      this.lastMove = null;
      this.checkSq = -1;
      this.selected = -1;
      this.editSelected = -1;
      this.targets = [];
      this.marks = new Set();
      this.arrows = new Map();
      this.drag = null;
      this.rightStart = -1;
      this.promo = null;

      this.main = this._surface(el, 0, 10, MAIN_SQ);
      el.classList.add('board');
      if (this.opts.mode === 'edit') el.classList.add('edit-mode');
      this.arrowsEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.arrowsEl.setAttribute('class', 'layer arrows');
      this.arrowsEl.setAttribute('viewBox', `0 0 ${10 * MAIN_SQ} ${10 * MAIN_SQ}`);
      el.appendChild(this.arrowsEl);
      this.plan = this.opts.planEl ? this._surface(this.opts.planEl, 1, 8, PLAN_SQ) : null;
      if (this.plan) this.plan.el.classList.add('board', 'plan-board');
      this._buildSquares();

      for (const s of [this.main, this.plan]) {
        if (!s) continue;
        s.el.addEventListener('pointerdown', e => this._down(e));
        s.el.addEventListener('pointermove', e => this._move(e));
        s.el.addEventListener('pointerup', e => this._up(e));
        s.el.addEventListener('pointercancel', () => this._cancelDrag());
        s.el.addEventListener('contextmenu', e => e.preventDefault());
      }
    }

    _surface(el, bd, n, sq) {
      el.innerHTML = '';
      el.style.setProperty('--sq', sq + 'px');
      const s = { el, bd, n, sq, size: n * sq, off: bd === 1 ? 1 : 0 };
      const layer = cls => { const d = document.createElement('div'); d.className = 'layer ' + cls; el.appendChild(d); return d; };
      s.squares = layer('squares');
      s.squares.style.gridTemplateColumns = `repeat(${n}, ${sq}px)`;
      s.squares.style.gridTemplateRows = `repeat(${n}, ${sq}px)`;
      s.hl = layer('highlights');
      s.glyphs = layer('glyphs');
      s.hints = layer('hints');
      s.pieces = layer('pieces');
      s.fx = layer('fx');
      s.badges = document.createElement('div');
      s.fx.appendChild(s.badges);
      return s;
    }
    _surf(sq) { return sq >= CR.NMAIN ? this.plan : this.main; }

    // ---------- Géométrie ----------
    _xy(sq) {
      const s = this._surf(sq), m = s.n - 1, f = CR.CELL_F[sq] - s.off, r = CR.CELL_R[sq] - s.off;
      return this.orientation === CR.WHITE ? { x: f * s.sq, y: (m - r) * s.sq } : { x: (m - f) * s.sq, y: r * s.sq };
    }
    _cellAt(s, col, row) {
      const m = s.n - 1;
      const f = this.orientation === CR.WHITE ? col : m - col, r = this.orientation === CR.WHITE ? m - row : row;
      return CR.cellIdx(s.bd, f + s.off, r + s.off);
    }
    _sqAt(e) {
      for (const s of [this.main, this.plan]) {
        if (!s || s.el.offsetParent === null) continue;
        const rect = s.el.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (x < 0 || y < 0 || x >= s.size || y >= s.size) continue;
        return this._cellAt(s, Math.floor(x / s.sq), Math.floor(y / s.sq));
      }
      return -1;
    }

    _buildSquares() {
      for (const s of [this.main, this.plan]) {
        if (!s) continue;
        s.squares.innerHTML = '';
        const m = s.n - 1;
        // coordonnées : première case existante à gauche de chaque rangée, en bas de chaque colonne
        const rankLabel = new Set(), fileLabel = new Set();
        if (s.bd === 0) {
          for (let row = 0; row < s.n; row++) for (let col = 0; col < s.n; col++) {
            const c = this._cellAt(s, col, row);
            if (this.ex[c]) { rankLabel.add(c); break; }
          }
          for (let col = 0; col < s.n; col++) for (let row = m; row >= 0; row--) {
            const c = this._cellAt(s, col, row);
            if (this.ex[c]) { fileLabel.add(c); break; }
          }
        }
        for (let row = 0; row < s.n; row++) {
          for (let col = 0; col < s.n; col++) {
            const c = this._cellAt(s, col, row), f = CR.CELL_F[c], r = CR.CELL_R[c];
            const d = document.createElement('div');
            if (!this.ex[c]) d.className = 'sq ' + (CR.isCore(c) ? 'hole' : 'void');
            else {
              d.className = 'sq ' + ((f + r) % 2 ? 'light' : 'dark') + (s.bd === 1 ? ' plan' : CR.isCore(c) ? '' : ' created');
              const name = CR.sqName(c);
              if (rankLabel.has(c)) d.insertAdjacentHTML('beforeend', `<span class="coord rank">${name.slice(1)}</span>`);
              if (fileLabel.has(c)) d.insertAdjacentHTML('beforeend', `<span class="coord file">${name[0]}</span>`);
            }
            s.squares.appendChild(d);
          }
        }
      }
    }

    setOrientation(color) {
      if (this.orientation === color) return;
      this.orientation = color;
      this._buildSquares();
      for (let s = 0; s < NC; s++) if (this.els[s]) this._place(this.els[s], s, false);
      this._drawHighlights();
      this._drawHints();
      this._drawArrows();
      if (this.fxState) this._drawFx(this.fxState);
      this._closePromo();
    }
    flip() { this.setOrientation(this.orientation ^ 1); }

    // ---------- Pièces ----------
    _place(el, sq, animate) {
      const { x, y } = this._xy(sq);
      if (animate) {
        el.classList.add('anim');
        clearTimeout(el._t);
        el._t = setTimeout(() => el.classList.remove('anim'), 180);
      }
      el.style.transform = `translate(${x}px, ${y}px)`;
    }
    _create(code, sq) {
      const el = document.createElement('div');
      el.className = 'piece';
      this._setCode(el, code);
      this._place(el, sq, false);
      this._surf(sq).pieces.appendChild(el);
      return el;
    }
    _setCode(el, code) {
      el._code = code;
      el.style.backgroundImage = `url("${Art.pieceURL(code)}")`;
    }

    /* b : tableau des cases ; state : { lastMove, check, anim, mine, ex, glyphs, immune, badges } */
    setPosition(b, state = {}) {
      this._cancelDrag();
      this._closePromo();
      this._closeChoice();
      this.power = false;
      const ex = state.ex || CR.DEFAULT_EX;
      if (ex.some((v, i) => v !== this.ex[i])) { this.ex = ex.slice(); this._buildSquares(); }
      const flagOk = state.anim && CR.moveFlag(state.anim) <= CR.FLAG_CQ;
      const anim = flagOk && CR.moveFrom(state.anim) < CR.NMAIN === CR.moveTo(state.anim) < CR.NMAIN ? state.anim : 0;
      if (anim) {
        const from = CR.moveFrom(anim), to = CR.moveTo(anim), flag = CR.moveFlag(anim);
        const mover = this.els[from];
        if (mover) {
          let capSq = to;
          if (flag === CR.FLAG_EP) capSq = CR.cellIdx(CR.CELL_B[to], CR.CELL_F[to], CR.CELL_R[from]);
          if (capSq !== from && this.els[capSq]) { this.els[capSq].remove(); this.els[capSq] = null; }
          this.els[from] = null;
          this.els[to] = mover;
          this._place(mover, to, true);
          if (flag === CR.FLAG_CK || flag === CR.FLAG_CQ) {
            const rb = CR.CELL_R[to] * 10;
            const rf = flag === CR.FLAG_CK ? rb + 8 : rb + 1, rt = flag === CR.FLAG_CK ? rb + 6 : rb + 4;
            const rook = this.els[rf];
            if (rook) { this.els[rf] = null; this.els[rt] = rook; this._place(rook, rt, true); }
          }
        }
      }
      for (let s = 0; s < NC; s++) {
        const want = b[s], el = this.els[s];
        if (!want || (s >= CR.NMAIN && !this.plan)) {
          if (el) { el.remove(); this.els[s] = null; }
          continue;
        }
        if (!el) this.els[s] = this._create(want, s);
        else if (el._code !== want) this._setCode(el, want);
      }
      this.codes.set(b);
      const mine = state.mine === undefined ? -1 : state.mine;
      for (let s = 0; s < NC; s++) {
        const el = this.els[s];
        if (el) el.classList.toggle('mine', mine >= 0 && pColor(b[s]) === mine);
      }
      this.el.classList.toggle('can-grab', mine >= 0);
      if (this.plan) this.plan.el.classList.toggle('can-grab', mine >= 0);
      this._drawFx(state);
      this.lastMove = state.lastMove || null;
      this.checkSq = state.check >= 0 ? state.check : -1;
      this.selected = -1;
      this.targets = [];
      this._drawHighlights();
      this._drawHints();
    }

    _drawFx(state) {
      this.fxState = state;
      const SYMBOLS = [null, '⇈', '↷', '◇', '⛓', '⇆', '∅'];
      for (const s of [this.main, this.plan]) if (s) { s.glyphs.innerHTML = ''; s.badges.innerHTML = ''; }
      const g = state.glyphs;
      if (g) {
        for (let sq = 0; sq < NC; sq++) {
          const code = g[sq];
          if (!code || (sq >= CR.NMAIN && !this.plan)) continue;
          const { x, y } = this._xy(sq);
          const d = document.createElement('div');
          d.className = 'glyph g' + (code & 7) + ((code >> 3) & 1 ? ' black' : ' white') + (code & CR.G_ARMED ? ' armed' : '');
          d.style.transform = `translate(${x}px, ${y}px)`;
          d.title = 'Glyphe ' + CR.GLYPH_NAMES[code & 7] + ((code >> 3) & 1 ? ' (Noirs)' : ' (Blancs)');
          d.innerHTML = `<span>${SYMBOLS[code & 7]}</span>`;
          this._surf(sq).glyphs.appendChild(d);
        }
      }
      if (state.immune >= 0) {
        const { x, y } = this._xy(state.immune);
        if (!this.apoEl) {
          this.apoEl = document.createElement('div');
          this.apoEl.className = 'apo';
          this.apoEl.innerHTML = '<div class="orbit"><span>★</span></div>';
          this.main.fx.appendChild(this.apoEl);
        }
        this.apoEl.style.transform = `translate(${x}px, ${y}px)`;
      } else if (this.apoEl) { this.apoEl.remove(); this.apoEl = null; }
      for (const [sq, type, color] of state.badges || []) {
        if (sq >= CR.NMAIN && !this.plan) continue;
        const s = this._surf(sq), { x, y } = this._xy(sq), off = s.sq - 24;
        s.badges.insertAdjacentHTML('beforeend', `<div class="badge" title="Déplacement hérité : ${CR.NAMES[type]}" style="transform:translate(${x + off}px, ${y + off}px);background-image:url('${Art.typeURL(type, color)}')"></div>`);
      }
    }

    // ---------- Surlignages ----------
    _hl(sq, cls) {
      if (sq < 0 || (sq >= CR.NMAIN && !this.plan)) return;
      const d = document.createElement('div');
      const { x, y } = this._xy(sq);
      d.className = 'hl ' + cls;
      d.style.transform = `translate(${x}px, ${y}px)`;
      this._surf(sq).hl.appendChild(d);
    }
    _drawHighlights() {
      for (const s of [this.main, this.plan]) if (s) s.hl.innerHTML = '';
      if (this.lastMove) { this._hl(this.lastMove[0], 'move'); this._hl(this.lastMove[1], 'move'); }
      if (this.selected >= 0 && (!this.lastMove || !this.lastMove.includes(this.selected))) this._hl(this.selected, 'select');
      if (this.editSelected >= 0) this._hl(this.editSelected, 'edit');
      for (const s of this.marks) this._hl(s, 'mark');
      if (this.checkSq >= 0) this._hl(this.checkSq, 'check');
      if (this.drag && this.drag.active && this.drag.hover >= 0) this._hl(this.drag.hover, 'hover');
    }
    _drawHints() {
      for (const s of [this.main, this.plan]) if (s) s.hints.innerHTML = '';
      const seen = new Set();
      for (const m of this.targets) {
        const to = CR.moveTo(m);
        if (seen.has(to) || (to >= CR.NMAIN && !this.plan)) continue;
        seen.add(to);
        const q = this.codes[to], mover = this.codes[CR.moveFrom(m)];
        const flag = CR.moveFlag(m);
        let cls = 'dot';
        if (this.power) cls = 'power';
        else if (flag === CR.FLAG_EP || (q && mover && pColor(q) !== pColor(mover))) cls = 'ring';
        else if (q) cls = 'swap';
        else if (flag === CR.FLAG_SHIFT) cls = 'shift';
        const d = document.createElement('div');
        const { x, y } = this._xy(to);
        d.className = 'hint ' + cls;
        d.style.transform = `translate(${x}px, ${y}px)`;
        this._surf(to).hints.appendChild(d);
      }
    }

    setEditSelected(sq) {
      this.editSelected = sq;
      this._drawHighlights();
    }

    _select(sq) {
      this.selected = sq;
      this.power = false;
      this.targets = sq >= 0 ? this.opts.movesFrom(sq).filter(m => !Board.POWER_FLAGS.includes(CR.moveFlag(m))) : [];
      this._drawHighlights();
      this._drawHints();
      if (this.opts.onSelect) this.opts.onSelect(sq);
    }

    // Mode « pouvoir spécial » : affiche les cases d'un ensemble de coups
    showPower(moves) {
      this._closeChoice();
      this.selected = moves.length && this.codes[CR.moveFrom(moves[0])] ? CR.moveFrom(moves[0]) : -1;
      this.targets = moves;
      this.power = true;
      this._drawHighlights();
      this._drawHints();
    }

    // ---------- Choix d'un pouvoir complémentaire (case secondaire) ----------
    _showChoice(moves, animate) {
      const extras = [...new Set(moves.map(CR.moveExtra))];
      const flag = CR.moveFlag(moves[moves.length - 1]);
      this.choice = { moves, animate, extras };
      this.selected = CR.moveFrom(moves[0]);
      this.targets = flag === CR.FLAG_ROT ? [] : moves.filter(m => CR.moveExtra(m) >= 0).map(m => CR.mkMove(CR.moveFrom(m), CR.moveExtra(m)));
      this.power = true;
      this._drawHighlights();
      this._drawHints();
      this._hl(CR.moveTo(moves[0]), 'select');
      const bar = document.createElement('div');
      bar.className = 'choice-bar';
      const LABELS = {
        [CR.FLAG_MENEUSE]: "Avancer aussi l'autre pion ?",
        [CR.FLAG_TRACE]: 'Trois glyphes maximum : choisissez celui à effacer',
        [CR.FLAG_ECHO]: 'Écho : capturer la pièce violette ?',
        [CR.FLAG_COLLAPSE]: 'Faire s’effondrer la case de départ ?',
        [CR.FLAG_QUAKE]: 'Faire s’effondrer une case voisine (violette) ?',
        [CR.FLAG_OPEN]: 'Emmener aussi une pièce alliée (violette) ?',
        [CR.FLAG_ROT]: 'Sens de la rotation'
      };
      bar.innerHTML = `<span>${LABELS[flag] || 'Pouvoir : choisissez une case violette'}</span>`;
      const button = (label, sq) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('pointerdown', e => { e.stopPropagation(); this._pickExtra(sq); });
        bar.appendChild(btn);
      };
      if (flag === CR.FLAG_ROT) {
        button('↻ Horaire', -1);
        button('↺ Anti-horaire', CR.moveFrom(moves[0]));
      } else if (extras.includes(-1)) {
        button(flag === CR.FLAG_MENEUSE ? 'Un seul pion' : flag === CR.FLAG_OPEN ? 'Seul' : 'Sans pouvoir', -1);
      }
      const x = document.createElement('button');
      x.textContent = 'Annuler';
      x.addEventListener('pointerdown', e => { e.stopPropagation(); this._closeChoice(); this.deselect(); });
      bar.appendChild(x);
      this.el.appendChild(bar);
      this.choiceBar = bar;
    }
    _pickExtra(sq) {
      const { moves, animate } = this.choice;
      this._closeChoice();
      this.power = false;
      this._resolve(moves.filter(m => CR.moveExtra(m) === sq), animate, true);
    }
    _closeChoice() {
      if (this.choiceBar) { this.choiceBar.remove(); this.choiceBar = null; }
      this.choice = null;
    }

    _resolve(moves, animate, extraDone) {
      if (!moves.length) return;
      // un coup simple et sa variante à pouvoir (écho, effondrement…) partagent la même arrivée
      if (!extraDone && new Set(moves.map(CR.moveExtra)).size > 1) { this._showChoice(moves, animate); return; }
      this.deselect();
      if (new Set(moves.map(CR.movePromo)).size > 1) {
        const from = CR.moveFrom(moves[0]);
        if (this.els[from]) this._place(this.els[from], from, false);
        this._showPromo(from, CR.moveTo(moves[0]), moves);
      } else {
        this.opts.onMove(moves[0], animate);
      }
    }
    deselect() { this._select(-1); }

    // ---------- Flèches et marques ----------
    _clearAnnotations() {
      if (!this.marks.size && !this.arrows.size) return;
      this.marks.clear();
      this.arrows.clear();
      this._drawHighlights();
      this._drawArrows();
    }
    _drawArrows() {
      const svgNS = 'http://www.w3.org/2000/svg', SQ = MAIN_SQ;
      this.arrowsEl.innerHTML = '';
      const center = s => { const { x, y } = this._xy(s); return [x + SQ / 2, y + SQ / 2]; };
      for (const [key] of this.arrows) {
        const [from, to] = key.split('-').map(Number);
        if (from >= CR.NMAIN || to >= CR.NMAIN) continue;
        const df = Math.abs(CR.CELL_F[to] - CR.CELL_F[from]), dr = Math.abs(CR.CELL_R[to] - CR.CELL_R[from]);
        const pts = [center(from)];
        if ((df === 1 && dr === 2) || (df === 2 && dr === 1)) {
          const corner = dr === 2 ? CR.CELL_R[to] * 10 + CR.CELL_F[from] : CR.CELL_R[from] * 10 + CR.CELL_F[to];
          pts.push(center(corner));
        }
        pts.push(center(to));
        const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1];
        const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
        const head = 24, half = 15, w = 12;
        const tipX = bx - ux * 5, tipY = by - uy * 5;
        const baseX = tipX - ux * head, baseY = tipY - uy * head;
        const startPad = pts.length === 2 ? 18 : 0;
        const l0 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
        pts[0] = [pts[0][0] + (pts[1][0] - pts[0][0]) / l0 * startPad, pts[0][1] + (pts[1][1] - pts[0][1]) / l0 * startPad];
        pts[pts.length - 1] = [baseX, baseY];
        const line = document.createElementNS(svgNS, 'polyline');
        line.setAttribute('points', pts.map(p => p.join(',')).join(' '));
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', 'rgba(255,170,0,.8)');
        line.setAttribute('stroke-width', w);
        line.setAttribute('stroke-linejoin', 'miter');
        const poly = document.createElementNS(svgNS, 'polygon');
        poly.setAttribute('points', `${tipX},${tipY} ${baseX - uy * half},${baseY + ux * half} ${baseX + uy * half},${baseY - ux * half}`);
        poly.setAttribute('fill', 'rgba(255,170,0,.8)');
        this.arrowsEl.appendChild(line);
        this.arrowsEl.appendChild(poly);
      }
    }

    // ---------- Promotion ----------
    _showPromo(from, to, moves) {
      const color = pColor(this.codes[from]);
      const order = [...new Set(moves.map(CR.movePromo))];
      const s = this._surf(to), SQ = s.sq;
      const shade = document.createElement('div');
      shade.className = 'promo-shade';
      const box = document.createElement('div');
      const { x, y } = this._xy(to);
      const atTop = y < s.size / 2;
      const two = order.length > 4;
      box.className = 'promo' + (atTop ? '' : ' up') + (two ? ' two' : '');
      box.style.left = (two && x > s.size - 2 * SQ ? x - SQ : x) + 'px';
      if (atTop) box.style.top = y + 'px'; else box.style.bottom = (s.size - y - SQ) + 'px';
      for (const t of order) {
        const m = moves.find(mv => CR.movePromo(mv) === t);
        if (!m) continue;
        const btn = document.createElement('button');
        btn.style.backgroundImage = `url("${Art.typeURL(t, color)}")`;
        btn.title = CR.NAMES[t];
        btn.addEventListener('pointerdown', e => { e.stopPropagation(); this._closePromo(); this.opts.onMove(m, true); });
        box.appendChild(btn);
      }
      const close = document.createElement('button');
      close.className = 'promo-close';
      close.textContent = '✕';
      close.addEventListener('pointerdown', e => { e.stopPropagation(); this._closePromo(); });
      box.appendChild(close);
      shade.addEventListener('pointerdown', e => { e.stopPropagation(); this._closePromo(); });
      s.el.appendChild(shade);
      s.el.appendChild(box);
      this.promo = { shade, box };
    }
    _closePromo() {
      if (!this.promo) return;
      this.promo.shade.remove();
      this.promo.box.remove();
      this.promo = null;
    }

    _tryMove(from, to, animate) {
      let moves = this.targets.filter(m => CR.moveTo(m) === to && (this.power || CR.moveFrom(m) === from));
      if (!moves.length) return false;
      if (this.power) moves = moves.filter(m => CR.moveFrom(m) === CR.moveFrom(moves[0]));
      this._resolve(moves, animate);
      return true;
    }

    // ---------- Souris ----------
    _down(e) {
      if (this.promo) return;
      const sq = this._sqAt(e);
      if (e.button === 2) {
        this._cancelDrag();
        this.rightStart = sq;
        return;
      }
      if (e.button !== 0) return;
      const touch = e.pointerType === 'touch';
      if (touch && sq >= 0) {
        clearTimeout(this.lpTimer);
        this.lpFired = false;
        this.lpStart = [e.clientX, e.clientY];
        this.lpTimer = setTimeout(() => {
          this.lpFired = true;
          this._cancelDrag();
          this.deselect();
          if (this.marks.has(sq)) this.marks.delete(sq); else this.marks.add(sq);
          this._drawHighlights();
          if (navigator.vibrate) navigator.vibrate(15);
        }, 550);
      }
      if (!touch) this._clearAnnotations();
      if (sq < 0) return;
      if (this.opts.mode === 'edit') { this.opts.onSquareClick(sq); return; }
      if (this.choice) {
        if (this.choice.extras.includes(sq) && CR.moveFlag(this.choice.moves[0]) !== CR.FLAG_ROT) this._pickExtra(sq);
        else { this._closeChoice(); this.deselect(); }
        return;
      }
      if ((this.selected >= 0 || this.power) && (sq !== this.selected || this.power) && this.targets.some(m => CR.moveTo(m) === sq)) {
        this._tryMove(this.selected, sq, true);
        return;
      }
      if (this.opts.canSelect(sq)) {
        const wasSelected = this.selected === sq;
        this._select(sq);
        this.drag = { from: sq, x: e.clientX, y: e.clientY, active: false, hover: -1, wasSelected };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
      } else {
        this.deselect();
      }
    }

    _move(e) {
      if (this.lpTimer && this.lpStart && Math.hypot(e.clientX - this.lpStart[0], e.clientY - this.lpStart[1]) > 8) { clearTimeout(this.lpTimer); this.lpTimer = 0; }
      if (!this.drag) return;
      const d = this.drag;
      if (!d.active) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
        d.active = true;
        if (this.els[d.from]) this.els[d.from].classList.add('dragging');
      }
      const s = this._surf(d.from), rect = s.el.getBoundingClientRect();
      const el = this.els[d.from];
      if (el) el.style.transform = `translate(${e.clientX - rect.left - s.sq / 2}px, ${e.clientY - rect.top - s.sq / 2}px)`;
      const hover = this._sqAt(e);
      const hv = hover >= 0 && this.ex[hover] ? hover : -1;
      if (hv !== d.hover) { d.hover = hv; this._drawHighlights(); }
    }

    _up(e) {
      if (e.button === 2) {
        const sq = this._sqAt(e);
        if (this.rightStart >= 0 && sq >= 0) {
          if (sq === this.rightStart) {
            if (this.marks.has(sq)) this.marks.delete(sq); else this.marks.add(sq);
            this._drawHighlights();
          } else {
            const key = this.rightStart + '-' + sq;
            if (this.arrows.has(key)) this.arrows.delete(key); else this.arrows.set(key, true);
            this._drawArrows();
          }
        }
        this.rightStart = -1;
        return;
      }
      if (this.lpTimer) { clearTimeout(this.lpTimer); this.lpTimer = 0; }
      if (this.lpFired) { this.lpFired = false; this.drag = null; return; }
      if (e.pointerType === 'touch' && !this.drag && (this.marks.size || this.arrows.size)) this._clearAnnotations();
      if (!this.drag) return;
      const d = this.drag;
      this.drag = null;
      const el = this.els[d.from];
      if (el) el.classList.remove('dragging');
      if (d.active) {
        const to = this._sqAt(e);
        if (to >= 0 && to !== d.from && this._tryMove(d.from, to, false)) return;
        if (el) this._place(el, d.from, to !== d.from);
        this._drawHighlights();
      } else if (d.wasSelected) {
        this.deselect();
      }
    }

    _cancelDrag() {
      if (!this.drag) return;
      const el = this.els[this.drag.from];
      if (el) { el.classList.remove('dragging'); this._place(el, this.drag.from, false); }
      this.drag = null;
    }
  }

  // Coups déclenchés uniquement par le bouton « Pouvoir spécial »
  Board.POWER_FLAGS = [CR.FLAG_RES, CR.FLAG_TRACE, CR.FLAG_APO, CR.FLAG_CREATE, CR.FLAG_DESTROY, CR.FLAG_OPEN, CR.FLAG_ROT];

  G.Board = Board;
})(window);
