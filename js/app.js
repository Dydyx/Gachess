/* Application : menu, partie contre le bot, personnalisation des pièces. */
(function () {
  'use strict';
  const CR = window.ChessRules, Art = window.PieceArt, Sound = window.Sound;
  const { WHITE, BLACK } = CR;
  const $ = id => document.getElementById(id);
  const SLOT_COUNT = 5;

  // ======================= Stockage local =======================
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('echecs.' + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('echecs.' + key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
    }
  };
  const settings = Object.assign({ color: 'white', elo: 1500 }, store.get('settings', {}));
  const getSlots = () => {
    const s = store.get('slots', []);
    return Array.from({ length: SLOT_COUNT }, (_, i) => s[i] || null);
  };
  const setSlots = slots => store.set('slots', slots);

  // ======================= Textes =======================
  const DESCRIPTIONS = {
    pion: "Avance d'une case (deux au premier coup), prend en diagonale avant. Prise en passant et promotion.",
    biaiseur: "Avance d'une case en diagonale avant. Ne prend que la pièce située juste devant lui. Se promeut sur la dernière rangée.",
    tour: 'Ligne droite horizontale ou verticale, sans limite. Peut roquer.',
    rempart: "Ligne droite horizontale ou verticale, 3 cases max. Peut sauter par-dessus une seule pièce. Capture uniquement sur sa case d'arrivée. Peut roquer.",
    cavalier: 'Se déplace en L et saute par-dessus les pièces.',
    voltigeur: "Saute de deux cases en diagonale, par-dessus la pièce intermédiaire. Capture uniquement sur sa case d'arrivée.",
    fou: 'Diagonale, sans limite.',
    louvoyeur: "Une ou deux cases en diagonale, puis un pas de côté (horizontal ou vertical) facultatif. Ne saute pas ; capture uniquement à l'arrivée.",
    dame: 'Combine la Tour et le Fou.',
    chimere: "Rempart + Voltigeur : jusqu'à 3 cases en ligne droite en franchissant au plus une pièce, ou saut de deux cases en diagonale. Capture uniquement à l'arrivée.",
    roi: 'Une case dans toutes les directions. Peut roquer.',
    souverain: "Une case dans toutes les directions, ou saut de deux cases vers l'arrière sur une case libre et non attaquée (sans capturer). Soumis à l'échec et au mat ; peut roquer.",
    // Errants (en plus de la marche de base)
    virepas: "Pion. En plus : avance d'une case en diagonale avant, sans capturer.",
    sylphe: 'Cavalier. En plus : saute de trois cases dans une direction et une perpendiculairement, sans capturer.',
    miroitier: "Fou. En plus : une case horizontalement ou verticalement, sans capturer (change de couleur de case).",
    traverse: 'Tour. En plus : face à un cavalier allié sur sa colonne, le franchit et se pose sur l\'une des deux cases suivantes si le trajet est libre (sans capturer).',
    vagabonde: 'Dame. En plus : après une prise, peut sauter vers une case vide à deux cases maximum (lignes et diagonales).',
    passebrume: 'Roi. En plus : deux cases horizontalement, sans capturer ; la case intermédiaire doit être libre, ni elle ni l\'arrivée ne peuvent être attaquées.',
    // Veilleurs
    pavois: 'Pion. Relève : échange sa place avec une pièce alliée (ni pion ni roi) située juste derrière lui.',
    escorteur: 'Cavalier. Relève : échange sa place avec un fou allié situé à une destination de cavalier (franchit les pièces).',
    tisseur: 'Fou. Relève : échange sa place avec un cavalier allié sur sa diagonale, à trois cases maximum.',
    bastion: 'Tour. Relève : échange sa place avec un pion allié devant elle sur sa colonne, à trois cases maximum.',
    egide: 'Dame. Relève : échange sa place avec une tour, un fou ou un cavalier allié à deux cases maximum (ligne ou diagonale).',
    castellan: 'Roi. Relève : échange sa place avec un pion allié adjacent ; le roi doit arriver sur une case sûre, le pion pas sur sa dernière rangée.',
    // Ravageurs
    mordant: 'Pion. En plus : capture un pion adverse juste à sa gauche ou à sa droite, en prenant sa case.',
    harpon: 'Cavalier. Après une prise, peut enchaîner un saut de trois cases puis une perpendiculairement, uniquement pour capturer.',
    percevoile: 'Fou. En plus : capture à quatre cases maximum en diagonale en franchissant exactement un pion allié, sans autre obstacle.',
    fracasseur: 'Tour. En plus : capture à trois cases maximum en ligne droite en franchissant exactement un cavalier allié, sans autre obstacle.',
    vendetta: 'Dame. Après une prise, peut enchaîner une capture par un saut de cavalier.',
    duelarque: 'Roi. Après une prise, peut enchaîner un saut de cavalier sans capturer, vers une case sûre.',
    // Pionniers
    eclaireur: 'Pion. En plus : avance de deux cases depuis n\'importe quelle rangée (trajet libre, sans capturer) ; autorise la prise en passant.',
    estafette: 'Cavalier. En plus : saute de trois cases vers l\'avant et une sur le côté, sans capturer.',
    auroral: "Fou. En plus : avance droit devant d'une ou deux cases, sans capturer ni franchir de pièce.",
    belier: 'Tour. En plus : si un pion allié est juste devant elle, le fait avancer d\'une case et prend sa place (promotion possible).',
    meneuse: 'Dame. En plus : fait avancer d\'une case un ou deux pions alliés placés juste à sa gauche et à sa droite ; elle reste sur place.',
    'porte-enseigne': 'Roi. En plus : avance droit devant de deux cases sans capturer ; trajet libre et cases traversées sûres.',
    // Rémanents
    cendre: 'Pion. Si la pièce qui l\'a capturé est ensuite prise par son camp, il peut revenir sur sa case de départ au tour suivant (une fois par partie).',
    rappelant: 'Cavalier. Au tour qui suit la capture d\'un pion adverse, peut faire revenir un Cendre au choix (cela coûte le tour).',
    psalmiste: 'Fou. Au tour qui suit la capture d\'un fou ou d\'un cavalier adverse, peut faire revenir un Cendre au choix.',
    reliquaire: 'Tour. Dans la moitié adverse de l\'échiquier, peut faire revenir un Cendre au choix en restant sur place.',
    anamnese: 'Dame. Au tour qui suit la capture d\'une pièce autre qu\'un pion, peut faire revenir un Cendre au choix.',
    legataire: 'Roi. Tant que son camp n\'a plus de dame, peut faire revenir un Cendre au choix en restant sur place.',
    // Héliarques
    lumignon: 'Pion. Juste derrière le Zénarque, lui donne le Pas solaire : avancer de deux cases (devant ou en diagonale avant), sans capturer ni traverser une case attaquée.',
    satellite: 'Cavalier. Derrière le Zénarque, à une distance de cavalier, lui donne le Bond royal : un saut de cavalier sans capturer, vers une case sûre.',
    heliophante: 'Fou. Voyant le Zénarque en diagonale depuis l\'arrière (3 cases max.), lui donne la Frappe oblique : capturer à deux cases en diagonale, case intermédiaire vide et sûre.',
    obelisque: 'Tour. Voyant le Zénarque sur sa colonne depuis l\'arrière (3 cases max.), lui donne la Frappe axiale : capturer à deux cases en ligne droite, case intermédiaire vide et sûre.',
    aureole: 'Dame. Voyant le Zénarque depuis l\'arrière (ligne ou diagonale, 3 cases max.), lui permet le Repli souverain : échanger leurs places si l\'arrivée du roi est sûre.',
    zenarque: 'Roi. Peut sauter par-dessus un de ses pions adjacents (avec ou sans prise, sans se mettre en échec). Utilise les pouvoirs de sa cour (un seul par coup). Avec trois types de soutiens liés : l\'Apothéose (bouton), immunité aux échecs pendant deux tours, durant lesquels il se déplace aussi comme une Dame ; elle ne termine pas le tour, le Zénarque rejoue aussitôt.',
    // Palimpsestes
    sillonneur: 'Pion. Trace le glyphe d\'Élan : un pion allié posé dessus pourra avancer de deux cases (trajet libre). Consommé à l\'usage.',
    runambule: 'Cavalier. Trace le glyphe de Tremplin : une pièce alliée posée dessus pourra faire un saut de cavalier, avec ou sans prise. Consommé au départ.',
    sigillaire: 'Fou. Trace le glyphe de Mue : une pièce alliée posée dessus pourra se déplacer en fou de trois cases maximum, avec ou sans prise. Consommé au départ.',
    graveborne: 'Tour. Trace le glyphe d\'Entrave : une pièce ennemie (hors roi) qui s\'y arrête ne peut pas bouger au tour suivant de son camp ; le glyphe disparaît ensuite.',
    cartomancienne: 'Dame. Trace le glyphe de Passage : une pièce alliée posée dessus pourra rejoindre un autre glyphe allié vide, sans capturer. Les deux glyphes sont consommés.',
    clearque: 'Roi. Trace le glyphe de Silence : une pièce ennemie (hors roi) qui s\'y arrête perd son pouvoir spécial jusqu\'à son départ, et le glyphe disparaît alors.',
    // Voraces
    goulot: 'Pion. Absorbe une alliée en diagonale avant et hérite de sa marche classique. Ensuite : peut aussi capturer tout droit devant lui. La promotion efface la transformation.',
    croquelune: 'Cavalier. Absorbe une alliée à distance de cavalier et hérite de sa marche classique (son bond de digestion est déjà inclus dans sa marche).',
    mandibule: 'Fou. Absorbe une alliée sur sa diagonale libre et hérite de sa marche. Bonus unique : un pas horizontal ou vertical sans capturer.',
    goinfroi: 'Tour. Absorbe une alliée sur sa ligne libre et hérite de sa marche. Bonus unique : un coup de tour franchissant exactement une pièce alliée, avec ou sans prise.',
    devoracle: 'Dame. Absorbe une alliée sur une ligne libre et hérite de sa marche ; cette absorption ne coûte pas le tour : elle rejoue aussitôt.',
    gastrarque: 'Roi. Absorbe une alliée adjacente (case sûre) et hérite de sa marche, sans jamais traverser ni atteindre une case attaquée. Bonus unique : deux cases en arrière sans capturer.',
    // Géomanciens
    sapeur: 'Pion. Après chacune de ses prises, la case qu\'il vient de quitter s\'effondre et disparaît du plateau.',
    terrassier: 'Cavalier. À chaque saut, peut faire s\'effondrer sa case de départ (choix proposé après le coup).',
    arpenteur: 'Fou. Pouvoir : crée la première case manquante au bout d\'une de ses diagonales dégagées (reconstruit un trou ou agrandit le plateau).',
    batisseuse: 'Tour. Pouvoir : crée la première case manquante au bout d\'une de ses lignes dégagées (reconstruit un trou ou agrandit le plateau).',
    tellurique: 'Dame. Après une prise, peut faire s\'effondrer une case vide voisine de son arrivée.',
    demiurge: 'Roi. Pouvoir : crée une case manquante adjacente à lui (reconstruction ou extension hors du 8×8).',
    // Outremondes
    fugueur: 'Pion. À tout moment, peut passer sur l\'autre plateau en gardant sa case (g4 → g4), si elle y est libre ; cela compte comme un coup et ouvre le plan s\'il était fermé.',
    passemonde: 'Cavalier. À tout moment, peut passer sur l\'autre plateau en gardant sa case (g4 → g4), si elle y est libre ; cela compte comme un coup et ouvre le plan s\'il était fermé.',
    refracteur: 'Fou. Pouvoir : ouvre le plan en y transposant lui-même et la première pièce ennemie (hors roi) vue sur une diagonale.',
    arche: 'Tour. Pouvoir : ouvre le plan en y transposant elle-même et la première pièce ennemie (hors roi) vue sur une ligne droite.',
    ubiquiste: 'Dame. À tout moment, peut passer sur l\'autre plateau en gardant sa case (g4 → g4), si elle y est libre ; cela compte comme un coup et ouvre le plan s\'il était fermé.',
    exilarque: 'Roi. Pouvoir : ouvre le plan en y exilant une pièce ennemie (hors roi) à deux cases maximum, avec une alliée voisine s\'il le souhaite ; lui reste sur place.',
    // Horlogers
    balancier: 'Pion. Peut aussi prendre en diagonale arrière, reflet de sa prise habituelle.',
    echappement: 'Cavalier. Écho : après un saut sans prise de A vers B, peut capturer à distance la pièce située sur la case symétrique de A par rapport à B.',
    gnomon: 'Fou. Peut aussi se refléter sur l\'axe vertical ou horizontal du plateau (a↔h, 1↔8), vers une case vide.',
    rouage: 'Tour. Pouvoir : fait tourner d\'un cran dans le sens horaire les huit cases qui l\'entourent, avec leurs pièces (aucun roi dans la couronne).',
    pendule: 'Dame. Pouvoir : fait tourner d\'un cran, au choix dans le sens horaire ou anti-horaire, les huit cases qui l\'entourent (aucun roi dans la couronne).',
    chronarque: 'Roi. Peut échanger sa place avec une pièce alliée située sur la case symétrique par rapport à l\'axe vertical (e1 ↔ d1) ou horizontal (e1 ↔ e8), si son arrivée est sûre.'
  };
  const ARCH_DESCRIPTIONS = [
    '',
    'Changer de trajectoire, franchir un obstacle et se dégager. Les déplacements spéciaux ne capturent jamais.',
    'La relève : deux pièces alliées échangent leurs places, sans capturer.',
    'Des prises inhabituelles et de nouvelles menaces après avoir capturé.',
    'Faire progresser les pions et transformer l\'avance en promotions.',
    'Ramener les Cendres capturés (une fois chacun, en y consacrant un tour).',
    'Toute l\'armée nourrit un roi offensif : les pièces placées derrière le Zénarque forment sa cour et lui transmettent leurs pouvoirs.',
    'Tracer des glyphes (un tour, sans bouger, 2 cases max. en ligne dégagée, 3 par armée) pour préparer des cases et piéger l\'adversaire.',
    'Absorber une pièce alliée (un tour) pour hériter de sa marche classique et gagner un effet de digestion. Une seule absorption par pièce.',
    'Remodeler le terrain : faire s\'effondrer des cases (définitivement, jusqu\'à leur reconstruction) ou en créer de nouvelles, jusque hors du 8×8 (colonnes z et i, rangées 0 et 9).',
    'Ouvrir un plan secondaire 8×8 où des pièces des deux camps sont transposées pendant 8 demi-coups : deux parties se jouent en même temps (un coup par tour, sur le plateau de son choix).',
    'Symétries et rouages : prises en miroir, échos symétriques, réflexions sur les axes et rotations horaires ou anti-horaires des cases voisines.'
  ];
  const ARCH_COLORS = ['#5d7a3a', '#3a6f8f', '#8a8a2a', '#8a3b34', '#4f7a32', '#6d3a9c', '#a07a1e', '#208c84', '#8f3a64', '#7a5a34', '#4b4aa8', '#2f6f8a'];
  const POWER_FLAGS = window.Board.POWER_FLAGS;
  const REASONS = {
    checkmate: 'par échec et mat', stalemate: 'par pat', repetition: 'par triple répétition',
    fifty: 'par la règle des 50 coups', material: 'par matériel insuffisant', resign: 'par abandon'
  };
  function eloCaption(elo) {
    if (elo < 800) return 'Débutant';
    if (elo < 1200) return 'Novice';
    if (elo < 1600) return 'Intermédiaire';
    if (elo < 2000) return 'Confirmé';
    if (elo < 2400) return 'Expert';
    if (elo < 2700) return 'Maître';
    return 'Grand maître';
  }

  // ======================= Interface générique =======================
  function showScreen(name) {
    for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === 'screen-' + name);
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* openModal({ title, sub, headClass, body: Node|string, actions: [{label, cls, onClick}], wide, closable }) */
  function openModal(o) {
    const root = $('modal-root');
    const shade = document.createElement('div');
    shade.className = 'modal-shade';
    const box = document.createElement('div');
    box.className = 'modal' + (o.wide ? ' wide' : '');
    const head = document.createElement('div');
    head.className = 'modal-head ' + (o.headClass || '');
    head.innerHTML = escapeHtml(o.title) + (o.sub ? `<span class="sub">${escapeHtml(o.sub)}</span>` : '');
    const close = () => { shade.remove(); document.removeEventListener('keydown', onKey); if (o.onClose) o.onClose(); };
    const onKey = e => { if (e.key === 'Escape' && o.closable !== false) close(); };
    if (o.closable !== false) {
      const x = document.createElement('button');
      x.className = 'modal-x';
      x.textContent = '✕';
      x.title = 'Fermer';
      x.onclick = close;
      head.appendChild(x);
      shade.addEventListener('pointerdown', e => { if (e.target === shade) close(); });
    }
    box.appendChild(head);
    if (o.body) {
      const body = document.createElement('div');
      body.className = 'modal-body';
      if (typeof o.body === 'string') body.innerHTML = o.body; else body.appendChild(o.body);
      box.appendChild(body);
    }
    if (o.actions && o.actions.length) {
      const act = document.createElement('div');
      act.className = 'modal-actions';
      for (const a of o.actions) {
        const b = document.createElement('button');
        b.className = 'btn ' + (a.cls || '');
        b.textContent = a.label;
        b.onclick = () => { if (a.onClick(close) !== false) close(); };
        act.appendChild(b);
      }
      box.appendChild(act);
    }
    shade.appendChild(box);
    root.appendChild(shade);
    document.addEventListener('keydown', onKey);
    return close;
  }

  function confirmModal(title, text, yesLabel, onYes) {
    openModal({
      title, body: `<div>${escapeHtml(text)}</div>`,
      actions: [{ label: 'Non', onClick: () => {} }, { label: yesLabel, cls: 'btn-primary', onClick: onYes }]
    });
  }

  // ======================= Configurations personnalisées =======================
  const classicSetup = () => Object.assign({}, CR.CLASSIC_SETUP);
  const isClassicSetup = setup => CR.SETUP_SQUARES.every(sq => setup[sq] === CR.CLASSIC_SETUP[sq]);
  const changedSquares = setup => CR.SETUP_SQUARES.filter(sq => setup[sq] !== CR.CLASSIC_SETUP[sq]);
  // Configuration complète d'un archétype : -1 = classique, 0 = Commun, 1..NARCH = archétypes
  function archSetup(a) {
    const setup = {};
    for (const sq of CR.SETUP_SQUARES) {
      const fam = CR.KEY_TO_TYPE[CR.CLASSIC_SETUP[sq]];
      setup[sq] = a < 0 ? CR.CLASSIC_SETUP[sq] : a ? CR.KEYS[CR.archPiece(a, fam)] : CR.allowedFor(sq)[1];
    }
    return setup;
  }
  const archLabel = a => a < 0 ? 'Classique' : CR.ARCH_NAMES[a];

  function exportJSON(setup, name) {
    const pieces = {};
    for (const sq of CR.SETUP_SQUARES) pieces[sq] = setup[sq];
    return JSON.stringify({ format: 'echecs-personnalises', version: 1, nom: name || 'Configuration', pieces }, null, 2);
  }

  // Renvoie { setup, name } ou lève une erreur au message lisible
  function parseImport(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("Le texte n'est pas un JSON valide."); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Le JSON doit être un objet.');
    const pieces = data.pieces && typeof data.pieces === 'object' ? data.pieces : data;
    const setup = classicSetup();
    const errors = [];
    let recognised = 0;
    for (const [sq, val] of Object.entries(pieces)) {
      if (['format', 'version', 'nom', 'name', 'pieces'].includes(sq) && pieces === data) continue;
      const key = String(sq).toLowerCase();
      if (!CR.CLASSIC_SETUP[key]) { errors.push(`Case inconnue : « ${sq} » (cases permises : a1 à h2).`); continue; }
      const allowed = CR.allowedFor(key);
      const v = String(val).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (!allowed.includes(v)) { errors.push(`${key} : « ${val} » interdit (choix : ${allowed.join(', ')}).`); continue; }
      setup[key] = v;
      recognised++;
    }
    const archs = CR.setupArchetypes(setup);
    if (archs.length > 1) {
      errors.push(`Une configuration ne peut contenir qu'un seul archétype (hors Commun) : ${archs.map(a => CR.ARCH_NAMES[a]).join(' et ')} trouvés.`);
    }
    if (errors.length) throw new Error(errors.slice(0, 6).join('\n'));
    if (!recognised) throw new Error('Aucune pièce trouvée dans ce JSON.');
    const name = typeof data.nom === 'string' ? data.nom : typeof data.name === 'string' ? data.name : '';
    return { setup, name: name.slice(0, 40) };
  }

  function slotButton(slot, i, opts) {
    const b = document.createElement('button');
    b.className = 'slot';
    if (!slot) {
      b.innerHTML = `<span class="num">${i + 1}</span><span class="info"><div class="sname">Emplacement vide</div><div class="smeta">${opts.emptyText || ''}</div></span>`;
      if (opts.disableEmpty) b.disabled = true;
    } else {
      const changed = changedSquares(slot.setup);
      const icons = changed.slice(0, 8).map(sq => `<img src="${Art.typeURL(CR.KEY_TO_TYPE[slot.setup[sq]], WHITE)}" alt="">`).join('');
      const date = new Date(slot.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
      b.innerHTML = `<span class="num">${i + 1}</span><span class="info"><div class="sname">${escapeHtml(slot.name || 'Configuration ' + (i + 1))}</div>` +
        `<div class="smeta">${changed.length ? changed.length + ' pièce(s) modifiée(s)' : 'Pièces classiques'} · ${date}</div></span><span class="sicons">${icons}</span>`;
    }
    b.onclick = () => opts.onPick(i, slot);
    return b;
  }

  // ======================= Menu principal =======================
  const Menu = {
    init() {
      $('logo-img').src = Art.typeURL(CR.N, WHITE);
      const icon = document.createElement('link');
      icon.rel = 'icon';
      icon.href = Art.typeURL(CR.N, WHITE);
      document.head.appendChild(icon);
      for (const img of document.querySelectorAll('#color-choice img')) {
        img.src = Art.typeURL(CR.K, img.dataset.piece === 'black' ? BLACK : WHITE);
      }
      for (const btn of document.querySelectorAll('#color-choice button')) {
        btn.onclick = () => { settings.color = btn.dataset.color; this.save(); this.render(); };
      }
      const slider = $('elo');
      slider.oninput = () => { settings.elo = +slider.value; this.save(); this.render(); };
      $('elo-minus').onclick = () => { settings.elo = Math.max(400, settings.elo - 100); this.save(); this.render(); };
      $('elo-plus').onclick = () => { settings.elo = Math.min(2800, settings.elo + 100); this.save(); this.render(); };
      $('btn-classic').onclick = () => { Sound.unlock(); Game.start(null, null); };
      $('btn-customize').onclick = () => Custom.open();
      $('btn-custom-game').onclick = () => { Sound.unlock(); this.pickCustomGame(); };
      this.render();
    },
    save() { store.set('settings', settings); },
    render() {
      for (const btn of document.querySelectorAll('#color-choice button')) btn.classList.toggle('selected', btn.dataset.color === settings.color);
      $('color-caption').textContent = { white: 'Blancs', black: 'Noirs', random: 'Aléatoire' }[settings.color];
      $('elo').value = settings.elo;
      $('elo-value').textContent = settings.elo;
      $('elo-caption').textContent = eloCaption(settings.elo);
    },
    /* Partie personnalisée : on choisit son camp (archétype complet ou configuration enregistrée)
       et celui de l'adversaire. Les listes sont générées depuis CR.NARCH : tout nouvel archétype
       est automatiquement proposé des deux côtés. */
    pickCustomGame() {
      const slots = getSlots();
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      const valid = v => v && (v.kind === 'arch' ? v.a >= -1 && v.a <= CR.NARCH : !!slots[v.i]);
      let mine = valid(settings.customMine) ? settings.customMine : { kind: 'arch', a: 0 };
      let opp = valid(settings.customOpp) && settings.customOpp.kind === 'arch' ? settings.customOpp : { kind: 'arch', a: -1 };
      const cards = [];
      const archGrid = (side) => {
        const grid = document.createElement('div');
        grid.className = 'arch-pick';
        for (let a = -1; a <= CR.NARCH; a++) {
          const setup = archSetup(a);
          const icons = [CR.P, CR.N, CR.B, CR.R, CR.Q, CR.K]
            .map(f => `<img src="${Art.typeURL(CR.KEY_TO_TYPE[setup[CR.SETUP_SQUARES.find(sq => CR.KEY_TO_TYPE[CR.CLASSIC_SETUP[sq]] === f)]], side === 'opp' ? BLACK : WHITE)}" alt="">`).join('');
          const btn = document.createElement('button');
          btn.className = 'arch-card';
          btn.style.setProperty('--ac', a < 0 ? '#8b8987' : ARCH_COLORS[a]);
          btn.innerHTML = `<span class="arch-card-name">${archLabel(a)}</span><span class="arch-card-icons">${icons}</span>`;
          btn.title = a < 0 ? 'Pièces classiques' : a ? ARCH_DESCRIPTIONS[a] : 'Biaiseur, Rempart, Voltigeur, Louvoyeur, Chimère, Souverain';
          btn._side = side; btn._val = { kind: 'arch', a };
          btn.onclick = () => { if (side === 'mine') mine = btn._val; else opp = btn._val; refresh(); };
          cards.push(btn);
          grid.appendChild(btn);
        }
        return grid;
      };
      wrap.insertAdjacentHTML('beforeend', '<div class="pick-title">Votre camp</div>');
      wrap.appendChild(archGrid('mine'));
      wrap.insertAdjacentHTML('beforeend', '<div class="field-label" style="margin-top:4px">Ou une configuration enregistrée</div>');
      if (!slots.some(Boolean)) {
        wrap.insertAdjacentHTML('beforeend', '<div style="color:var(--muted);font-weight:600;font-size:13px">Aucune configuration enregistrée (Personnalisation → Sauvegarder).</div>');
      }
      slots.forEach((slot, i) => {
        if (!slot) return;
        const b = slotButton(slot, i, { disableEmpty: true, onPick: () => { mine = { kind: 'slot', i }; refresh(); } });
        b._side = 'mine'; b._val = { kind: 'slot', i };
        cards.push(b);
        wrap.appendChild(b);
      });
      wrap.insertAdjacentHTML('beforeend', '<div class="pick-title" style="margin-top:8px">Camp adverse</div>');
      wrap.appendChild(archGrid('opp'));
      const same = (x, y) => x.kind === y.kind && (x.kind === 'arch' ? x.a === y.a : x.i === y.i);
      const refresh = () => {
        for (const c of cards) c.classList.toggle('selected', same(c._val, c._side === 'mine' ? mine : opp));
      };
      refresh();
      openModal({
        title: 'Partie personnalisée', sub: 'Choisissez votre camp et celui de l\'adversaire',
        body: wrap, wide: true,
        actions: [{
          label: 'Lancer la partie', cls: 'btn-primary', onClick: () => {
            settings.customMine = mine; settings.customOpp = opp; this.save();
            const mySetup = mine.kind === 'slot' ? slots[mine.i].setup : archSetup(mine.a);
            const myName = mine.kind === 'slot' ? (slots[mine.i].name || 'Configuration ' + (mine.i + 1)) : archLabel(mine.a);
            Game.start(mySetup, myName, archSetup(opp.a), archLabel(opp.a));
          }
        }]
      });
    }
  };

  // ======================= Moteurs =======================
  const engines = { stockfish: null, variant: null, sfError: null };
  function initEngines() {
    const status = $('engine-status');
    try {
      const local = ['localhost', '127.0.0.1'].includes(location.hostname);
      const LITE = 'engine/stockfish-19-lite-single.js', FULL = 'engine/stockfish-19-single.js';
      // version complète en local sur ordinateur ; version lite sur téléphone, en ligne, ou en repli
      const load = (url, fallback) => {
        engines.sfError = null;
        engines.stockfish = new window.Bots.StockfishBot(url);
        engines.stockfish.ready.then(() => {
          status.textContent = `${engines.stockfish.engineId || 'Stockfish 19'} est prêt`;
          status.className = 'engine-status ok';
        }).catch(err => {
          if (fallback) { load(fallback, null); return; }
          engines.sfError = String(err);
          status.textContent = 'Stockfish n’a pas pu se charger (lancez l’appli via Lancer.bat). Le moteur de secours sera utilisé.';
          status.className = 'engine-status err';
        });
      };
      if (local && !window.GACHESS_MOBILE) load(FULL, LITE); else load(LITE, null);
    } catch (e) {
      engines.sfError = String(e);
      status.textContent = 'Stockfish indisponible : ouvrez l\'appli via Lancer.bat (serveur local).';
      status.className = 'engine-status err';
    }
    try { engines.variant = new window.Bots.VariantBot('js/ai-worker.js'); } catch (e) { /* signalé au lancement */ }
  }

  // ======================= Partie =======================
  const Game = {
    board: null,
    init() {
      this.board = new window.Board($('game-board'), {
        mode: 'play',
        planEl: $('plan-board'),
        canSelect: sq => this.canSelect(sq),
        movesFrom: sq => this.legal.filter(m => CR.moveFrom(m) === sq),
        onMove: (m, animate) => this.userMove(m, animate),
        onSelect: sq => this.updatePower(sq)
      });
      $('btn-power').onclick = () => {
        const list = this.powerMoves(this.powerSq);
        if (list.length) { this.board.showPower(list); $('btn-power').classList.add('active'); }
      };
      $('btn-game-menu').onclick = () => this.leave();
      $('btn-resign').onclick = () => {
        if (this.over) return;
        confirmModal('Abandonner ?', 'Voulez-vous vraiment abandonner la partie ?', 'Abandonner', () => {
          this.finish(this.player === WHITE ? '0-1' : '1-0', 'resign');
        });
      };
      $('nav-first').onclick = () => this.view(0);
      $('nav-prev').onclick = () => this.view((this.viewPly < 0 ? this.records.length : this.viewPly) - 1);
      $('nav-next').onclick = () => this.view((this.viewPly < 0 ? this.records.length : this.viewPly) + 1);
      $('nav-last').onclick = () => this.view(-1);
      $('nav-flip').onclick = () => { this.board.flip(); this.renderBars(); };
      document.addEventListener('keydown', e => {
        if (!$('screen-game').classList.contains('active') || $('modal-root').children.length) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); $('nav-prev').click(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); $('nav-next').click(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.view(0); }
        if (e.key === 'ArrowDown') { e.preventDefault(); this.view(-1); }
      });
      this.token = 0;
    },

    /* setup : configuration perso du joueur (point de vue Blancs) ou null pour une partie classique */
    start(setup, configName, oppSetup, oppName) {
      const color = settings.color === 'random' ? (Math.random() < 0.5 ? WHITE : BLACK) : settings.color === 'black' ? BLACK : WHITE;
      this.player = color;
      this.elo = settings.elo;
      this.custom = !!setup || !!oppSetup;
      this.configName = configName || '';
      this.oppName = oppName || 'Classique';
      this.setupW = color === WHITE ? setup || null : oppSetup || null;
      this.setupB = color === BLACK ? setup || null : oppSetup || null;
      this.pos = CR.Position.fromSetups(this.setupW, this.setupB);
      this.startBoard = this.pos.b.slice();
      // Stockfish pour tout ce qui est classique ; moteur maison dès qu'une pièce inventée est en jeu
      const sfOk = engines.stockfish && !engines.sfError;
      this.engine = this.pos.isClassic() && sfOk ? 'stockfish' : 'variant';
      this.moves = [];
      this.uci = [];
      this.records = [];
      this.over = false;
      this.result = null;
      this.viewPly = -1;
      this.thinking = false;
      this.token++;
      this.legal = this.pos.legal();

      const bot = engines[this.engine];
      if (bot) bot.newGame();

      $('side-icon').src = Art.typeURL(this.custom ? CR.CH : CR.K, WHITE);
      $('side-title').textContent = this.custom ? 'Partie personnalisée' : 'Partie classique';
      $('side-sub').textContent = (this.custom ? `« ${this.configName} » contre « ${this.oppName} » · ` : '') +
        `Vous jouez les ${color === WHITE ? 'Blancs' : 'Noirs'} · ${this.botName()} ${this.elo}`;
      this.board.setOrientation(color);
      this.refreshBoard(0);
      this.renderMoves();
      this.renderBars();
      this.renderStatus();
      this.renderPowers();
      showScreen('game');
      this.setMobileTab('game');
      Sound.start();
      if (this.pos.turn !== this.player) this.botMove();
    },

    botName() {
      if (this.engine === 'stockfish') return 'Stockfish 19';
      return this.custom ? 'Bot variantes' : 'Bot de secours';
    },

    canSelect(sq) {
      if (this.over || this.thinking || this.viewPly >= 0 || this.pos.turn !== this.player) return false;
      const p = this.pos.b[sq];
      return !!p && CR.pColor(p) === this.player;
    },

    // Glyphes, Apothéose et pièces transformées à afficher sur l'échiquier
    fxState() {
      const pos = this.pos, badges = [];
      let immune = -1;
      for (const c of [WHITE, BLACK]) if (pos.apotheosisActive(c)) immune = pos.kings[c];
      if (pos.anyInh) {
        for (let s = 0; s < CR.NCELLS; s++) {
          const p = pos.b[s];
          if (p && pos.vInh[pos.ids[s]]) badges.push([s, pos.vInh[pos.ids[s]], CR.pColor(p)]);
        }
      }
      return { glyphs: pos.glyph.slice(), immune, badges, ex: pos.ex.slice() };
    },

    // Pouvoirs déclenchés par le bouton « Pouvoir spécial » : résurrections, glyphes, Apothéose
    powerMoves(sq) {
      if (this.over || this.thinking || this.viewPly >= 0 || this.pos.turn !== this.player) return [];
      const res = this.legal.filter(m => POWER_FLAGS.includes(CR.moveFlag(m)));
      const selfRes = m => CR.moveFlag(m) === CR.FLAG_RES && CR.moveFrom(m) === CR.moveTo(m);
      if (sq >= 0) {
        const own = res.filter(m => CR.moveFrom(m) === sq && !selfRes(m));
        if (own.length) return own;
      }
      return res.filter(selfRes);
    },
    updatePower(sq) {
      this.powerSq = sq;
      const btn = $('btn-power');
      const list = this.powerMoves(sq);
      btn.style.display = list.length ? '' : 'none';
      btn.classList.remove('active');
      const fl = list.length ? CR.moveFlag(list[0]) : -1;
      btn.textContent = fl === CR.FLAG_TRACE ? '✎ Tracer un glyphe' : fl === CR.FLAG_APO ? '☀ Apothéose'
        : fl === CR.FLAG_CREATE ? '✚ Créer une case' : fl === CR.FLAG_OPEN ? '⟿ Ouvrir le plan' : fl === CR.FLAG_ROT ? '↻ Rotation'
        : fl === CR.FLAG_RES && CR.moveFrom(list[0]) === CR.moveTo(list[0]) ? '✦ Ressusciter un Cendre' : '✦ Pouvoir spécial';
    },

    userMove(m, animate) {
      if (this.over || this.pos.turn !== this.player || !this.legal.includes(m)) return;
      this.apply(m, animate);
      if (!this.over && this.pos.turn !== this.player) this.botMove();
    },

    apply(m, animate) {
      const pos = this.pos;
      const san = pos.san(m, this.legal);
      const flag = CR.moveFlag(m);
      const mover = pos.turn;
      this.uci.push(pos.toUci(m));
      const captured = pos.make(m).caps.slice();
      this.moves.push(m);
      this.legal = pos.legal();
      const inCheck = pos.inCheck();
      this.records.push({
        san, color: mover, captured,
        board: pos.b.slice(), fx: this.fxState(),
        lastMove: [CR.moveFrom(m), flag === CR.FLAG_FOLLOW && CR.moveExtra(m) >= 0 ? CR.moveExtra(m) : CR.moveTo(m)],
        check: inCheck ? pos.kings[pos.turn] : -1, move: m
      });
      this.viewPly = -1;
      this.refreshBoard(animate ? m : 0);
      if (inCheck) Sound.check();
      else if (CR.movePromo(m)) Sound.promote();
      else if (flag === CR.FLAG_CK || flag === CR.FLAG_CQ) Sound.castle();
      else if (captured.length) Sound.capture();
      else Sound.move();
      this.renderMoves();
      this.renderBars();
      this.renderPowers();
      const st = pos.status(this.legal);
      if (st.over) this.finish(st.result, st.reason);
      else this.renderStatus();
    },

    async botMove() {
      const tok = this.token;
      const bot = engines[this.engine];
      if (!bot) { toast('Aucun moteur disponible.'); return; }
      this.thinking = true;
      this.renderBars();
      this.renderStatus();
      const t0 = Date.now();
      let m;
      try {
        m = this.engine === 'stockfish'
          ? await bot.chooseMove(this.pos.clone(), this.uci.slice(), this.elo)
          : await bot.chooseMove(this, this.elo);
      } catch (e) {
        // Stockfish indisponible : on bascule sur le moteur maison pour finir la partie
        console.error(e);
        m = 0;
        if (this.engine === 'stockfish' && engines.variant && tok === this.token) {
          this.engine = 'variant';
          toast('Stockfish indisponible : le bot de secours prend le relais');
          m = await engines.variant.chooseMove(this, this.elo);
        }
      }
      if (tok !== this.token || this.over) return;
      // un petit délai pour que la réponse ne paraisse pas instantanée
      const wait = Math.max(0, 450 - (Date.now() - t0));
      if (wait) await new Promise(r => setTimeout(r, wait));
      if (tok !== this.token || this.over) return;
      this.thinking = false;
      if (!m || !this.legal.includes(m)) m = this.legal[Math.floor(Math.random() * this.legal.length)];
      this.apply(m, true);
      if (!this.over && this.pos.turn !== this.player) this.botMove();
    },

    finish(result, reason) {
      this.over = true;
      this.thinking = false;
      this.result = { result, reason };
      const bot = engines[this.engine];
      if (bot) bot.stop();
      this.renderStatus();
      this.renderBars();
      this.refreshBoard(0, true);
      Sound.end();
      const win = (result === '1-0' && this.player === WHITE) || (result === '0-1' && this.player === BLACK);
      const draw = result === '1/2-1/2';
      setTimeout(() => {
        if (!this.over || !$('screen-game').classList.contains('active')) return;
        openModal({
          title: draw ? 'Partie nulle' : win ? 'Vous avez gagné !' : 'Vous avez perdu',
          sub: REASONS[reason] + ' · ' + result.replace('1/2-1/2', '½-½'),
          headClass: draw ? 'draw' : win ? 'win' : 'lose',
          body: `<div style="text-align:center;color:var(--muted);font-weight:600">${escapeHtml(this.botName())} (${this.elo}) · ${Math.ceil(this.records.length / 2)} coups</div>`,
          actions: [{ label: 'Retour au menu', cls: 'btn-primary', onClick: () => this.leave() }]
        });
      }, reason === 'resign' ? 50 : 700);
    },

    leave() {
      this.token++;
      const bot = engines[this.engine];
      if (bot && this.thinking) bot.stop();
      this.thinking = false;
      $('modal-root').innerHTML = '';
      showScreen('menu');
    },

    refreshBoard(anim, keepView) {
      if (this.viewPly >= 0 && !keepView) {
        // consultation d'une position passée
        const i = this.viewPly;
        const rec = this.records[i - 1];
        const b = rec ? rec.board : CR.Position.fromSetups(this.setupW, this.setupB).b;
        this.board.setPosition(b, Object.assign({ lastMove: rec ? rec.lastMove : null, check: rec ? rec.check : -1, anim, mine: -1 }, rec ? rec.fx : {}));
        this.updatePower(-1);
        return;
      }
      const last = this.records[this.records.length - 1];
      const myTurn = !this.over && this.pos.turn === this.player;
      this.board.setPosition(this.pos.b, {
        lastMove: last ? last.lastMove : null,
        check: last ? last.check : -1,
        anim,
        mine: myTurn ? this.player : -1,
        ...this.fxState()
      });
      this.updatePower(-1);
      this.renderPlan();
    },

    // Onglets de l'écran de partie sur téléphone
    setMobileTab(tab) {
      document.querySelector('.game-layout').dataset.tab = tab;
      for (const b of document.querySelectorAll('#mobile-tabs button')) b.classList.toggle('active', b.dataset.tab === tab);
    },

    // Plan secondaire des Outremondes : visible tant qu'il est ouvert
    renderPlan() {
      const open = this.pos.planOpen() || this.pos.planPieces().length > 0;
      // toujours visible si une pièce des Outremondes est en jeu (on peut y passer à tout moment)
      let outre = false;
      for (let x = 0; x < CR.NCELLS; x++) if (CR.ARCH[CR.pType(this.pos.b[x])] === 10) { outre = true; break; }
      $('plan-box').classList.toggle('on', open || outre);
      $('plan-timer').textContent = open ? `retour dans ${this.pos.planTimer} demi-coup${this.pos.planTimer > 1 ? 's' : ''}` : 'fermé';
    },

    // ply : 0 = position de départ, n = après n demi-coups, -1 = position actuelle
    view(ply) {
      const n = this.records.length;
      if (ply >= n || ply < -1) ply = -1;
      if (ply === n) ply = -1;
      const prev = this.viewPly < 0 ? n : this.viewPly;
      const target = ply < 0 ? n : ply;
      this.viewPly = ply;
      // animation quand on avance d'un seul coup
      const anim = target === prev + 1 && this.records[target - 1] ? this.records[target - 1].move : 0;
      this.refreshBoard(anim);
      if (target !== prev) Sound.move();
      this.renderMoves();
    },

    renderMoves() {
      const el = $('move-list');
      el.innerHTML = '';
      if (!this.records.length) {
        el.innerHTML = '<div class="empty">Les coups de la partie apparaîtront ici.</div>';
        return;
      }
      const current = this.viewPly < 0 ? this.records.length : this.viewPly;
      // si les Noirs commencent (impossible ici) on garderait l'alignement : les Blancs jouent toujours en premier
      // Une rangée par tour ; un double coup (Dévoracle) est regroupé dans la même case
      let line = null, num = 0, prevCol = -1, cell = null;
      for (let j = 0; j < this.records.length; j++) {
        const rec = this.records[j], col = rec.color;
        if (col === prevCol && cell) {
          cell.appendChild(document.createTextNode(' · '));
          cell.insertAdjacentHTML('beforeend', this.sanHtml(rec));
        } else {
          if (col === WHITE || !line) {
            line = document.createElement('div');
            line.className = 'row';
            line.innerHTML = `<span class="num">${++num}.</span>`;
            el.appendChild(line);
            if (col === BLACK) line.appendChild(document.createElement('span'));
          }
          cell = document.createElement('span');
          cell.className = 'mv';
          cell.innerHTML = this.sanHtml(rec);
          line.appendChild(cell);
        }
        const ply = j + 1;
        if (ply === current) cell.classList.add('current');
        cell.onclick = () => this.view(ply === this.records.length ? -1 : ply);
        prevCol = col;
      }
      // défilement limité à la liste (scrollIntoView ferait aussi défiler la page)
      const cur = el.querySelector('.current');
      if (!cur) { el.scrollTop = el.scrollHeight; return; }
      const row = cur.parentElement;
      if (row.offsetTop < el.scrollTop) el.scrollTop = row.offsetTop;
      else if (row.offsetTop + row.offsetHeight > el.scrollTop + el.clientHeight) el.scrollTop = row.offsetTop + row.offsetHeight - el.clientHeight;
    },

    sanHtml(rec) {
      const s = rec.san;
      const icon = t => `<img src="${Art.typeURL(t, rec.color)}" alt="${CR.NAMES[t]}" title="${CR.NAMES[t]}">`;
      return (s.piece ? icon(s.piece) : '') + escapeHtml(s.body) + (s.promo ? '=' + icon(s.promo) : '') + escapeHtml(s.suffix);
    },

    renderBars() {
      const bottomColor = this.board.orientation;
      const bar = (el, color) => {
        const isBot = color !== this.player;
        // pièces capturées par `color` et avantage matériel
        const caps = this.records.filter(r => r.color === color).flatMap(r => r.captured.map(p => CR.pType(p)));
        caps.sort((a, b) => CR.VALUES[a] - CR.VALUES[b] || a - b);
        const groups = [];
        for (const t of caps) {
          if (!groups.length || groups[groups.length - 1][0] !== t) groups.push([t, 0]);
          groups[groups.length - 1][1]++;
        }
        // avantage = évolution du matériel depuis le début (prises et promotions), pas l'écart
        // initial dû aux pièces personnalisées
        const adv = Math.round((this.materialBalance(this.pos.b, color) - this.materialBalance(this.startBoard, color)) / 100);
        const capsHtml = groups.map(([t, n]) =>
          `<span class="cap-group">${Array.from({ length: n }, () => `<img src="${Art.typeURL(t, color ^ 1)}" alt="">`).join('')}</span>`).join('') +
          (adv > 0 ? `<span class="adv">+${adv}</span>` : '');
        const avatar = isBot
          ? `<div class="avatar" style="background:#3f6b2f"><img src="${Art.typeURL(CR.K, BLACK)}" alt=""></div>`
          : `<div class="avatar"><img src="${Art.typeURL(CR.P, WHITE)}" alt=""></div>`;
        const name = isBot
          ? `${escapeHtml(this.botName())} <span class="rating">(${this.elo})</span>`
          : `Vous <span class="rating">(${color === WHITE ? 'Blancs' : 'Noirs'})</span>`;
        el.innerHTML = `${avatar}<div class="pinfo"><div class="pname">${name}</div><div class="pcaps">${capsHtml}</div></div>` +
          `<div class="thinking ${isBot && this.thinking ? 'on' : ''}"><i></i><i></i><i></i></div>`;
      };
      bar($('bar-bottom'), bottomColor);
      bar($('bar-top'), bottomColor ^ 1);
    },

    materialBalance(b, color) {
      let mat = 0;
      for (let s = 0; s < CR.NCELLS; s++) {
        const p = b[s];
        if (p) mat += (CR.pColor(p) === color ? 1 : -1) * CR.VALUES[CR.pType(p)];
      }
      return mat;
    },

    // Rappel des déplacements et pouvoirs spéciaux des pièces non classiques en jeu
    renderPowers() {
      const panel = $('powers-panel'), content = $('powers-content');
      const types = new Set(), owner = {};
      for (const b of [this.startBoard, this.pos.b]) for (let s = 0; s < CR.NCELLS; s++) {
        const t = CR.pType(b[s]);
        if (t > CR.K) { types.add(t); if (!(t in owner)) owner[t] = CR.pColor(b[s]); }
      }
      panel.classList.toggle('on', types.size > 0);
      const layout = document.querySelector('.game-layout');
      layout.classList.toggle('has-powers', types.size > 0);
      if (!types.size) this.setMobileTab('game');
      if (!types.size) { content.innerHTML = ''; return; }
      const onBoard = new Set();
      for (let s = 0; s < CR.NCELLS; s++) if (this.pos.b[s]) onBoard.add(CR.pType(this.pos.b[s]));
      const groups = new Map();
      for (const t of [...types].sort((x, y) => x - y)) {
        const a = CR.ARCH[t];
        if (!groups.has(a)) groups.set(a, []);
        groups.get(a).push(t);
      }
      let html = '<div class="ph">Pouvoirs en jeu<small>Déplacements spéciaux des pièces présentes</small></div>';
      for (const [a, list] of groups) {
        html += `<div class="grp"><div class="grp-title"><span class="arch-name" style="background:${ARCH_COLORS[a]}">${CR.ARCH_NAMES[a]}</span></div>`;
        if (a) html += `<div class="grp-desc">${escapeHtml(ARCH_DESCRIPTIONS[a])}</div>`;
        for (const t of list) {
          const gone = !onBoard.has(t);
          html += `<div class="pw${gone ? ' gone' : ''}"><img src="${Art.typeURL(t, owner[t])}" alt=""><div><b>${CR.NAMES[t]}</b>` +
            (gone ? ' <span class="gone-tag">(plus sur l’échiquier)</span>' : '') + `<br>${escapeHtml(DESCRIPTIONS[CR.KEYS[t]])}</div></div>`;
        }
        html += '</div>';
      }
      // État en direct
      const live = [];
      const ct = this.pos.court(this.player);
      if (CR.pType(this.pos.b[ct.k]) === CR.ZENARQUE) {
        const names = [...ct.types].map(t => CR.NAMES[t]);
        live.push(`<b>Cour du Zénarque :</b> ${names.length ? names.join(', ') : 'aucun soutien lié'}` +
          (ct.types.size >= 3 ? ' — <b style="color:#ffd23f">Apothéose disponible</b>' : ` (${ct.types.size}/3 pour l'Apothéose)`));
      }
      if (groups.has(7)) live.push(`<b>Glyphes :</b> ${this.pos.glyphCount(this.player)}/3`);
      if (this.pos.apotheosisActive(this.player)) live.push(`<b style="color:#ffd23f">☀ Apothéose active : ${this.pos.immuneLeft} tour${this.pos.immuneLeft > 1 ? 's' : ''} restant${this.pos.immuneLeft > 1 ? 's' : ''} (marche de Dame)</b>`);
      if (this.pos.forced >= 0 && this.pos.turn === this.player) live.push(`<b style="color:#ffd23f">${this.replayText()}</b>`);
      if (this.pos.planOpen()) live.push(`<b style="color:#c9bdf6">⟿ Plan ouvert :</b> retour des pièces dans ${this.pos.planTimer} demi-coup${this.pos.planTimer > 1 ? 's' : ''}`);
      if (live.length) html = html.replace('</small></div>', '</small></div><div class="live">' + live.join('<br>') + '</div>');
      content.innerHTML = html;
    },

    // Message quand une pièce rejoue dans le même tour (Dévoracle, Zénarque après l'Apothéose)
    replayText() {
      for (let s = 0; s < CR.NCELLS; s++) {
        if (this.pos.b[s] && this.pos.ids[s] === this.pos.forced) {
          const t = CR.pType(this.pos.b[s]);
          return (t === CR.ZENARQUE ? 'Apothéose ! Le Zénarque' : 'La ' + CR.NAMES[t]) + ' rejoue';
        }
      }
      return 'Rejouez';
    },

    renderStatus() {
      const el = $('status-line');
      el.classList.toggle('over', this.over);
      if (this.over) {
        const { result, reason } = this.result;
        const win = (result === '1-0' && this.player === WHITE) || (result === '0-1' && this.player === BLACK);
        el.textContent = (result === '1/2-1/2' ? 'Partie nulle ' : win ? 'Victoire ' : 'Défaite ') + REASONS[reason];
        return;
      }
      const check = this.pos.inCheck() ? 'Échec ! ' : '';
      if (this.pos.forced >= 0 && this.pos.turn === this.player) { el.textContent = this.replayText(); return; }
      el.textContent = this.pos.turn === this.player
        ? check + 'À vous de jouer'
        : check + `${this.botName()} réfléchit…`;
    }
  };

  // ======================= Personnalisation =======================
  const Custom = {
    board: null,
    setup: null,
    name: '',
    history: [],
    selected: -1,
    preview: null,

    init() {
      const draft = store.get('draft', null);
      this.setup = classicSetup();
      if (draft && draft.setup) {
        try { this.setup = parseImport(JSON.stringify({ pieces: draft.setup })).setup; } catch (e) { /* brouillon ignoré */ }
        this.name = draft.name || '';
      }
      this.board = new window.Board($('custom-board'), { mode: 'edit', onSquareClick: sq => this.click(sq) });
      $('cz-undo').onclick = () => this.undo();
      $('cz-reset').onclick = () => this.resetAll();
      $('cz-save').onclick = () => this.saveDialog();
      $('cz-load').onclick = () => this.loadDialog();
      $('cz-export').onclick = () => this.exportDialog();
      $('cz-import').onclick = () => this.importDialog();
      $('cz-menu').onclick = () => { showScreen('menu'); };
      const sc = $('arch-shortcuts');
      sc.innerHTML = '<span class="label">Tout en</span>';
      for (let a = 1; a <= CR.NARCH; a++) {
        const btn = document.createElement('button');
        btn.dataset.arch = a;
        btn.style.setProperty('--ac', ARCH_COLORS[a]);
        btn.title = `Remplacer les 16 pièces par celles de l'archétype ${CR.ARCH_NAMES[a]}`;
        btn.innerHTML = `<img src="${Art.typeURL(CR.archPiece(a, CR.Q), WHITE)}" alt="">${CR.ARCH_NAMES[a]}`;
        btn.onclick = () => this.applyArchetype(a);
        sc.appendChild(btn);
      }
    },

    open() {
      this.selected = -1;
      this.render();
      showScreen('custom');
    },

    persist() { store.set('draft', { setup: this.setup, name: this.name }); },

    // applique un changement en mémorisant l'état précédent pour « Annuler »
    change(newSetup, newName) {
      const same = CR.SETUP_SQUARES.every(sq => newSetup[sq] === this.setup[sq]) && (newName === undefined || newName === this.name);
      if (same) return false;
      this.history.push({ setup: Object.assign({}, this.setup), name: this.name });
      if (this.history.length > 200) this.history.shift();
      this.setup = Object.assign({}, newSetup);
      if (newName !== undefined) this.name = newName;
      this.persist();
      this.render();
      return true;
    },

    click(sq) {
      const name = CR.sqName(sq);
      this.selected = CR.CLASSIC_SETUP[name] ? sq : -1;
      this.preview = null;
      this.render();
    },

    choose(key) {
      const sqn = CR.sqName(this.selected);
      const next = Object.assign({}, this.setup, { [sqn]: key });
      if (this.change(next)) Sound.move();
    },

    // Raccourci : toutes les pièces de l'archétype `a`
    applyArchetype(a) {
      const next = {};
      for (const sq of CR.SETUP_SQUARES) next[sq] = CR.KEYS[CR.archPiece(a, CR.KEY_TO_TYPE[CR.CLASSIC_SETUP[sq]])];
      if (this.change(next)) { Sound.move(); toast(`Toutes les pièces sont maintenant de l'archétype ${CR.ARCH_NAMES[a]}`); }
      else toast(`La configuration est déjà entièrement ${CR.ARCH_NAMES[a]}`);
    },

    undo() {
      const prev = this.history.pop();
      if (!prev) { toast('Rien à annuler'); return; }
      this.setup = prev.setup;
      this.name = prev.name;
      this.persist();
      this.render();
    },

    resetAll() {
      if (this.change(classicSetup(), '')) toast('Toutes les pièces sont redevenues classiques');
      else toast('Les pièces sont déjà classiques');
    },

    render() {
      const b = new Uint8Array(CR.NCELLS);
      for (const sqn of CR.SETUP_SQUARES) b[CR.sqFromName(sqn)] = CR.KEY_TO_TYPE[this.setup[sqn]];
      this.board.setPosition(b, {});
      this.board.setEditSelected(this.selected);
      const n = changedSquares(this.setup).length;
      $('custom-summary').textContent = (this.name ? `« ${this.name} » · ` : '') +
        (n ? `${n} pièce${n > 1 ? 's' : ''} modifiée${n > 1 ? 's' : ''}` : 'Pièces classiques') +
        (CR.setupArchetypes(this.setup).length ? ` · Archétype ${CR.ARCH_NAMES[CR.setupArchetypes(this.setup)[0]]}` : '');
      $('cz-undo').disabled = !this.history.length;
      for (const btn of document.querySelectorAll('#arch-shortcuts button')) {
        btn.classList.toggle('current', CR.SETUP_SQUARES.every(sq => CR.ARCH[CR.KEY_TO_TYPE[this.setup[sq]]] === +btn.dataset.arch));
      }
      this.renderPanel();
    },

    renderPanel() {
      const panel = $('custom-panel');
      panel.innerHTML = '';
      if (this.selected < 0) {
        panel.innerHTML = `<div class="placeholder"><img src="${Art.typeURL(CR.N, WHITE)}" alt="">` +
          'Cliquez sur une pièce de l\'échiquier pour choisir par quelle pièce la remplacer.</div>';
        return;
      }
      const sqn = CR.sqName(this.selected);
      const classic = CR.CLASSIC_SETUP[sqn];
      const current = this.setup[sqn];
      panel.insertAdjacentHTML('beforeend',
        `<div class="panel-title">Case ${sqn.toUpperCase()}</div><div class="panel-sub">Pièce d'origine : ${CR.NAMES[CR.KEY_TO_TYPE[classic]]}</div>`);
      // Archétype déjà utilisé ailleurs dans la configuration (hors case sélectionnée)
      const others = {};
      for (const sq of CR.SETUP_SQUARES) if (sq !== sqn) others[sq] = this.setup[sq];
      const used = CR.setupArchetypes(others);
      const list = document.createElement('div');
      list.className = 'opt-list';
      for (const key of CR.allowedFor(sqn)) {
        const t = CR.KEY_TO_TYPE[key], arch = CR.ARCH[t];
        const blocked = arch && used.length && !used.includes(arch);
        const opt = document.createElement('button');
        opt.className = 'opt' + (key === current ? ' selected' : '') + (blocked ? ' blocked' : '');
        const tag = key === classic ? '<span class="tag">Classique</span>' : arch
          ? `<span class="tag arch a${arch}">${CR.ARCH_NAMES[arch]}</span>` : '<span class="tag new">Commun</span>';
        opt.innerHTML = `<img src="${Art.typeURL(t, WHITE)}" alt=""><div class="opt-name">${CR.NAMES[t]}</div>${tag}`;
        if (blocked) opt.title = `Incompatible : la configuration utilise déjà l'archétype ${CR.ARCH_NAMES[used[0]]}`;
        opt.onclick = () => {
          if (blocked) { toast(`Un seul archétype par configuration : retirez d'abord les pièces ${CR.ARCH_NAMES[used[0]]}`); return; }
          this.choose(key);
        };
        opt.onmouseenter = () => { this.preview = key; this.renderDiagram(); };
        opt.onmouseleave = () => { this.preview = null; this.renderDiagram(); };
        list.appendChild(opt);
      }
      panel.appendChild(list);
      panel.insertAdjacentHTML('beforeend', '<div class="opt-detail" id="opt-detail"></div>' +
        '<div class="diagram-title" id="diagram-title"></div><div class="diagram" id="diagram"></div>' +
        '<div class="legend"><span><i style="background:rgba(0,0,0,.35)"></i>déplacement et prise</span>' +
        '<span><i style="background:#2f7fd0"></i>déplacement seul</span>' +
        '<span><i style="border:2px solid #d0412f"></i>prise seule</span></div>');
      this.renderDiagram();
    },

    // Schéma des déplacements de la pièce (seule sur l'échiquier, ou avec une cible pour la prise)
    renderDiagram() {
      const grid = $('diagram');
      if (!grid || this.selected < 0) return;
      const key = this.preview || this.setup[CR.sqName(this.selected)];
      const t = CR.KEY_TO_TYPE[key];
      const pawnLike = CR.isPawn(t);
      const origin = CR.sqFromName(pawnLike ? 'd2' : 'd4');
      const moves = new Set(CR.patternFor(t, origin));
      const caps = new Set();
      for (let s = 0; s < CR.NMAIN; s++) {
        if (s === origin || !CR.isCore(s)) continue;
        const pos = new CR.Position();
        pos.b[origin] = t; pos.ids[origin] = origin;
        pos.b[s] = CR.P | 128; pos.ids[s] = s;
        pos._recount();
        pos.turn = WHITE;
        if (pos.gen([], true).some(m => CR.moveFrom(m) === origin && CR.moveTo(m) === s)) caps.add(s);
      }
      $('diagram-title').textContent = 'Déplacements de base et sans allié : ' + CR.NAMES[t];
      const arch = CR.ARCH[t];
      $('opt-detail').innerHTML = `<b>${CR.NAMES[t]}</b>${arch ? ` · <span class="arch-name a${arch}">${CR.ARCH_NAMES[arch]}</span>` : ''}<br>${escapeHtml(DESCRIPTIONS[key])}` +
        (arch ? `<div class="arch-desc">${escapeHtml(ARCH_DESCRIPTIONS[arch])}</div>` : '');
      grid.innerHTML = '';
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const s = CR.cellIdx(0, col + 1, 8 - row);
          const d = document.createElement('div');
          d.className = ((row + col) % 2 ? 'd' : 'l');
          if (s === origin) d.innerHTML = `<img src="${Art.typeURL(t, WHITE)}" alt="">`;
          else if (moves.has(s) && caps.has(s)) d.classList.add('both');
          else if (moves.has(s)) d.classList.add('mv-only');
          else if (caps.has(s)) d.classList.add('cap-only');
          grid.appendChild(d);
        }
      }
    },

    saveDialog() {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      wrap.innerHTML = '<label class="field-label" for="save-name">Nom de la configuration</label>';
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'save-name';
      input.maxLength = 40;
      input.placeholder = 'Ma configuration';
      input.value = this.name;
      wrap.appendChild(input);
      wrap.insertAdjacentHTML('beforeend', '<div class="field-label" style="margin-top:6px">Choisissez un emplacement</div>');
      let close;
      getSlots().forEach((slot, i) => wrap.appendChild(slotButton(slot, i, {
        emptyText: 'Cliquez pour enregistrer ici',
        onPick: idx => {
          const slots = getSlots();
          const name = input.value.trim() || `Configuration ${idx + 1}`;
          slots[idx] = { name, setup: Object.assign({}, this.setup), date: Date.now() };
          setSlots(slots);
          this.name = name;
          this.persist();
          this.render();
          close();
          toast(`Configuration enregistrée dans l'emplacement ${idx + 1}`);
        }
      })));
      close = openModal({ title: 'Sauvegarder', sub: 'Un emplacement occupé sera remplacé', body: wrap, wide: true });
      setTimeout(() => input.focus(), 30);
    },

    loadDialog() {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      let close;
      getSlots().forEach((slot, i) => wrap.appendChild(slotButton(slot, i, {
        disableEmpty: true,
        onPick: (idx, s) => {
          close();
          this.selected = -1;
          if (!this.change(s.setup, s.name || `Configuration ${idx + 1}`)) this.render();
          toast(`Emplacement ${idx + 1} chargé`);
        }
      })));
      close = openModal({ title: 'Charger', sub: 'Choisissez une configuration enregistrée', body: wrap, wide: true });
    },

    exportDialog() {
      const json = exportJSON(this.setup, this.name);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      const ta = document.createElement('textarea');
      ta.readOnly = true;
      ta.value = json;
      wrap.appendChild(ta);
      openModal({
        title: 'Exporter', sub: 'Configuration actuelle au format JSON', body: wrap, wide: true,
        actions: [{
          label: 'Copier configuration', cls: 'btn-primary', onClick: () => {
            const done = () => toast('Configuration copiée dans le presse-papiers');
            const fallback = () => { ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Copie impossible : sélectionnez le texte manuellement'); } };
            if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(json).then(done, fallback);
            else fallback();
            return false;
          }
        }]
      });
    },

    importDialog() {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      const ta = document.createElement('textarea');
      ta.placeholder = 'Collez ici le JSON d\'une configuration…';
      const err = document.createElement('div');
      err.className = 'error-msg';
      wrap.appendChild(ta);
      wrap.appendChild(err);
      openModal({
        title: 'Importer', sub: 'Collez une configuration exportée', body: wrap, wide: true,
        actions: [{
          label: "Valider l'import", cls: 'btn-primary', onClick: () => {
            try {
              const { setup, name } = parseImport(ta.value);
              this.selected = -1;
              if (!this.change(setup, name || this.name)) this.render();
              toast('Configuration importée');
              return true;
            } catch (e) {
              err.textContent = e.message;
              return false;
            }
          }
        }]
      });
      setTimeout(() => ta.focus(), 30);
    }
  };

  // ======================= Démarrage =======================
  // Téléphone : le plan secondaire passe sous l'échiquier, la partie se lit par onglets
  if (window.GACHESS_MOBILE) {
    const col = document.querySelector('.board-col');
    // bouton « Pouvoir spécial » juste sous l'échiquier, au-dessus des onglets
    const powerSlot = document.createElement('div');
    powerSlot.className = 'mobile-power';
    powerSlot.appendChild($('btn-power'));
    col.appendChild(powerSlot);
    col.appendChild($('plan-box'));
    for (const b of document.querySelectorAll('#mobile-tabs button')) b.onclick = () => Game.setMobileTab(b.dataset.tab);
  }
  // Application installable : cache hors connexion (uniquement en ligne, pour ne pas figer le développement local)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  Menu.init();
  Game.init();
  Custom.init();
  initEngines();
})();
