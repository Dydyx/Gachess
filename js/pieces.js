/*
 * Sprites des pièces (SVG générés), style « néo » : formes pleines, contour épais, léger dégradé.
 * Les pièces classiques reprennent la géométrie libre de droits « cburnett » (CC BY-SA 3.0),
 * les pièces personnalisées sont dessinées avec le même vocabulaire graphique.
 */
(function (G) {
  'use strict';
  const CR = G.ChessRules;

  const PALETTE = [
    { top: '#ffffff', bottom: '#dcd7cc', S: '#302e2b', D: '#302e2b' },   // blancs
    { top: '#6f6b67', bottom: '#3b3836', S: '#191817', D: '#cfcac3' }    // noirs
  ];

  // Chaque dessin reçoit : F = remplissage principal, S = contour, D = détails intérieurs
  const DRAW = {};

  DRAW[CR.P] = ({ F, S }) => `
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="${F}" stroke="${S}"/>`;

  DRAW[CR.R] = ({ F, S, D }) => `
    <g fill="${F}" stroke="${S}">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 Z"/>
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 Z"/>
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 Z"/>
      <path d="M 34,14 L 31,17 L 14,17 L 11,14"/>
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"/>
      <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5"/>
    </g>
    <path d="M 14,17 L 31,17 M 14,29.5 L 31,29.5 M 12.5,32 L 32.5,32" fill="none" stroke="${D}" stroke-width="1.2"/>`;

  const KNIGHT_BODY = (F, S, D) => `
    <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="${F}" stroke="${S}"/>
    <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="${F}" stroke="${S}"/>
    <circle cx="9" cy="25.5" r="0.9" fill="${D}" stroke="${D}" stroke-width="0.6"/>
    <ellipse cx="14.5" cy="15.5" rx="0.6" ry="1.6" transform="rotate(30 14.5 15.5)" fill="${D}" stroke="${D}" stroke-width="0.6"/>
    <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5" fill="none" stroke="${D}" stroke-width="1" opacity="${D === S ? 0 : 0.85}"/>`;

  DRAW[CR.N] = ({ F, S, D }) => KNIGHT_BODY(F, S, D);

  DRAW[CR.B] = ({ F, S, D }) => `
    <g fill="${F}" stroke="${S}">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 Z"/>
      <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z"/>
      <circle cx="22.5" cy="8" r="2.5"/>
    </g>
    <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" fill="none" stroke="${D}"/>`;

  const QUEEN_LOWER = (F, S, D) => `
    <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 Z" fill="${F}" stroke="${S}"/>
    <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5 M 11,36 C 18,35 27,35 34,36" fill="none" stroke="${D}"/>`;

  DRAW[CR.Q] = ({ F, S, D }) => `
    <g fill="${F}" stroke="${S}">
      <circle cx="6" cy="12" r="2.2"/><circle cx="14" cy="9" r="2.2"/><circle cx="22.5" cy="8" r="2.2"/>
      <circle cx="31" cy="9" r="2.2"/><circle cx="39" cy="12" r="2.2"/>
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 Z"/>
    </g>
    ${QUEEN_LOWER(F, S, D)}`;

  const KING_BODY = (F, S, D) => `
    <path d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 Z" fill="${F}" stroke="${S}"/>
    <path d="M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37" fill="none" stroke="${D}"/>`;

  DRAW[CR.K] = ({ F, S, D }) => `
    <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" fill="none" stroke="${S}" stroke-width="1.9"/>
    <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="${F}" stroke="${S}"/>
    ${KING_BODY(F, S, D)}`;

  // ---------- Pièces personnalisées ----------

  // Biaiseur : pion à tête en losange (le biais), écharpe diagonale
  DRAW[CR.BI] = ({ F, S, D }) => `
    <path d="M 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,17.41 26.09,14.5 22.5,14.5 C 18.91,14.5 16,17.41 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 Z" fill="${F}" stroke="${S}"/>
    <path d="M 22.5,5.2 L 27.3,10 L 22.5,14.8 L 17.7,10 Z" fill="${F}" stroke="${S}"/>
    <path d="M 13.2,34.6 L 30.6,29.4 M 19.6,23.4 L 25.4,18.6" fill="none" stroke="${D}" stroke-width="1.4"/>`;

  // Rempart : muraille trapue à créneaux, porte voûtée et oriflamme
  DRAW[CR.RE] = ({ F, S, D }) => `
    <path d="M 22.5,15.5 L 22.5,6.5" fill="none" stroke="${S}" stroke-width="1.6"/>
    <path d="M 23,6.5 L 29.5,8.8 L 23,11.1 Z" fill="${F}" stroke="${S}" stroke-width="1.3"/>
    <g fill="${F}" stroke="${S}">
      <path d="M 7,39 L 38,39 L 38,35.5 L 7,35.5 Z"/>
      <path d="M 9,35.5 L 9,16 L 13.5,16 L 13.5,19 L 18,19 L 18,16 L 20.5,16 L 20.5,15.5 L 24.5,15.5 L 24.5,16 L 27,16 L 27,19 L 31.5,19 L 31.5,16 L 36,16 L 36,35.5 Z"/>
    </g>
    <path d="M 18.5,35.5 L 18.5,30.5 A 4,4 0 0 1 26.5,30.5 L 26.5,35.5 Z" fill="${S}" stroke="${S}"/>
    <path d="M 9,21.5 H 36 M 9,26.5 H 36 M 15,21.5 V 26.5 M 22.5,21.5 V 26.5 M 30,21.5 V 26.5 M 12,26.5 V 31 M 33,26.5 V 31 M 9,31 H 16 M 29,31 H 36" fill="none" stroke="${D}" stroke-width="1.1"/>`;

  // Voltigeur : cavalier ailé
  DRAW[CR.VO] = ({ F, S, D }) => `
    <path d="M 28.5,21 C 30.5,14.5 35.5,9 42.5,6.5 C 41.8,9 41.4,10.3 40,11.8 C 41.8,12 42.6,12.6 42.8,13.4 C 41,14.4 39.8,15.2 39.4,16.4 C 40.6,16.8 41,17.4 41,18.2 C 37.5,19.8 34.5,22.5 31.5,26 Z" fill="${F}" stroke="${S}"/>
    <path d="M 31.2,19.2 C 33.8,15.2 36.8,12.6 40,11.8 M 32.6,22.4 C 34.8,19.6 37,17.6 39.4,16.4" fill="none" stroke="${D}" stroke-width="1.1"/>
    ${KNIGHT_BODY(F, S, D)}`;

  // Louvoyeur : fou surmonté d'une voile, mitre à zigzag
  DRAW[CR.LO] = ({ F, S, D }) => `
    <path d="M 22.5,10.6 L 22.5,2.8" fill="none" stroke="${S}" stroke-width="1.5"/>
    <path d="M 23.3,3.2 L 29.2,8.9 L 23.3,8.9 Z" fill="${F}" stroke="${S}" stroke-width="1.3"/>
    <g fill="${F}" stroke="${S}">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 Z"/>
      <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z"/>
    </g>
    <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30" fill="none" stroke="${D}"/>
    <path d="M 20.2,14.8 L 24.8,17.4 L 20.2,20 L 24.8,22.6" fill="none" stroke="${D}" stroke-width="1.5"/>`;

  // Chimère : couronne crénelée (Rempart) flanquée de deux ailes (Voltigeur)
  const WING_L = 'M 10.5,23 C 6.5,20 3.2,15.5 1.6,9 C 3.9,10 5.2,10.8 6.4,12.3 C 6.5,10.8 7,10 8,9.4 C 8.6,12.6 9.8,15.4 11.6,17.6 Z';
  const WING_R = 'M 34.5,23 C 38.5,20 41.8,15.5 43.4,9 C 41.1,10 39.8,10.8 38.6,12.3 C 38.5,10.8 38,10 37,9.4 C 36.4,12.6 35.2,15.4 33.4,17.6 Z';
  DRAW[CR.CH] = ({ F, S, D }) => `
    <path d="${WING_L}" fill="${F}" stroke="${S}"/>
    <path d="${WING_R}" fill="${F}" stroke="${S}"/>
    <path d="M 4.6,12.6 C 6.2,16 8,18.6 10.6,20.8 M 40.4,12.6 C 38.8,16 37,18.6 34.4,20.8" fill="none" stroke="${D}" stroke-width="1"/>
    <path d="M 9,26 L 8.4,13.5 L 12.6,13.5 L 12.6,17 L 16.4,17 L 16.4,11 L 20.5,11 L 20.5,15 L 24.5,15 L 24.5,11 L 28.6,11 L 28.6,17 L 32.4,17 L 32.4,13.5 L 36.6,13.5 L 36,26 C 30,24.5 17.5,24.5 9,26 Z" fill="${F}" stroke="${S}"/>
    <path d="M 22.5,17.6 L 24.6,20.4 L 22.5,23.2 L 20.4,20.4 Z" fill="${D}" stroke="${D}" stroke-width="0.8"/>
    ${QUEEN_LOWER(F, S, D)}`;

  // Souverain : roi couronné d'un globe crucigère, couronne à pointes
  DRAW[CR.SO] = ({ F, S, D }) => `
    <path d="M 22.5,12.2 L 22.5,4.2 M 19.6,6.8 L 25.4,6.8" fill="none" stroke="${S}" stroke-width="1.9"/>
    <circle cx="22.5" cy="17" r="5" fill="${F}" stroke="${S}"/>
    <path d="M 17.5,17 H 27.5 M 22.5,12 V 22" fill="none" stroke="${D}" stroke-width="1.1"/>
    <path d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 Z" fill="${F}" stroke="${S}"/>
    <path d="M 12.5,30 L 15.5,27 L 18.5,29.6 L 22.5,26.4 L 26.5,29.6 L 29.5,27 L 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37" fill="none" stroke="${D}"/>`;

  // ---------- Archétypes : silhouette de base + emblème ----------
  const PAWN_BODY = (F, S) => `<path d="M 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,17.41 26.09,14.5 22.5,14.5 C 18.91,14.5 16,17.41 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 Z" fill="${F}" stroke="${S}"/>`;
  const BISHOP_BODY = (F, S, D, ball = true) => `
    <g fill="${F}" stroke="${S}">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 Z"/>
      <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z"/>
      ${ball ? '<circle cx="22.5" cy="8" r="2.5"/>' : ''}
    </g>
    <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30" fill="none" stroke="${D}"/>`;
  const ROOK_BODY = (F, S, D) => `
    <g fill="${F}" stroke="${S}">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 Z"/>
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 Z"/>
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 Z"/>
      <path d="M 34,14 L 31,17 L 14,17 L 11,14"/>
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"/>
      <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5"/>
    </g>
    <path d="M 14,17 L 31,17 M 14,29.5 L 31,29.5 M 12.5,32 L 32.5,32" fill="none" stroke="${D}" stroke-width="1.2"/>`;
  const QUEEN_CROWN = F => `
      <circle cx="6" cy="12" r="2.2"/><circle cx="14" cy="9" r="2.2"/><circle cx="22.5" cy="8" r="2.2"/>
      <circle cx="31" cy="9" r="2.2"/><circle cx="39" cy="12" r="2.2"/>
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 Z"/>`;
  const QUEEN_FULL = (F, S, D) => `<g fill="${F}" stroke="${S}">${QUEEN_CROWN(F)}</g>${QUEEN_LOWER(F, S, D)}`;
  const KING_TOP_CROSS = (F, S) => `
    <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" fill="none" stroke="${S}" stroke-width="1.9"/>
    <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="${F}" stroke="${S}"/>`;
  const KING_TOP_PLAIN = (F, S) => `
    <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" fill="${F}" stroke="${S}"/>`;
  // Médaillon posé sur le corps (dames et rois)
  const medal = (F, D, inner, cy = 33) => `<circle cx="22.5" cy="${cy}" r="4.6" fill="${F}" stroke="${D}" stroke-width="1.3"/><g fill="none" stroke="${D}" stroke-width="1.2">${inner}</g>`;
  const flame = (cx, cy, s, F, S, w = 1.4) => `<path d="M ${cx},${cy - 2 * s} C ${cx + 1.6 * s},${cy - 0.6 * s} ${cx + 1.5 * s},${cy + 0.9 * s} ${cx},${cy + 1.2 * s} C ${cx - 1.5 * s},${cy + 0.9 * s} ${cx - 1.6 * s},${cy - 0.6 * s} ${cx - 0.3 * s},${cy - 0.9 * s} C ${cx - 0.2 * s},${cy - 1.4 * s} ${cx},${cy - 1.6 * s} ${cx},${cy - 2 * s} Z" fill="${F}" stroke="${S}" stroke-width="${w}"/>`;
  const swapArrows = (cx, cy, w) => `M ${cx - w},${cy - 1.6} H ${cx + w} M ${cx + w - 2},${cy - 3.2} L ${cx + w},${cy - 1.6} L ${cx + w - 2},${cy} M ${cx + w},${cy + 1.6} H ${cx - w} M ${cx - w + 2},${cy} L ${cx - w},${cy + 1.6} L ${cx - w + 2},${cy + 3.2}`;
  const shield = (cx, cy, s) => `M ${cx - 4 * s},${cy - 4 * s} H ${cx + 4 * s} V ${cy} C ${cx + 4 * s},${cy + 3 * s} ${cx + 2 * s},${cy + 4.6 * s} ${cx},${cy + 5.4 * s} C ${cx - 2 * s},${cy + 4.6 * s} ${cx - 4 * s},${cy + 3 * s} ${cx - 4 * s},${cy} Z`;
  const CR_ = CR.archPiece;

  // Errants : trajectoires qui bifurquent, brume, reflets
  DRAW[CR_(1, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 17,37 L 26.2,29.2 M 22.8,28.8 L 26.6,28.8 L 26.6,32.6" fill="none" stroke="${D}" stroke-width="1.6"/>`;
  DRAW[CR_(1, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}
    <path d="M 33.5,9.5 C 37,8.5 40,9.5 42.5,12 M 36,14.5 C 39,14 41.5,15 43,17 M 38.5,20 C 40.5,19.8 42,20.6 43,22" fill="none" stroke="${S}" stroke-width="1.5"/>`;
  DRAW[CR_(1, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <ellipse cx="22.5" cy="19" rx="3.3" ry="4.4" fill="${F}" stroke="${D}" stroke-width="1.3"/>
    <path d="M 22.5,14.6 A 3.3,4.4 0 0 1 22.5,23.4 Z" fill="${D}" stroke="none"/>`;
  DRAW[CR_(1, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <circle cx="22.5" cy="26" r="1.5" fill="${D}" stroke="none"/>
    <path d="M 16.5,27.5 Q 22.5,15.5 28.5,27 M 26,25.4 L 28.6,27.4 L 29.4,24.2" fill="none" stroke="${D}" stroke-width="1.4"/>`;
  DRAW[CR_(1, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '<path d="M 19.6,35 Q 22.5,28.6 25.4,34.6 M 23.6,33.6 L 25.5,34.9 L 26.2,32.8"/>')}`;
  DRAW[CR_(1, CR.K)] = ({ F, S, D }) => `${KING_TOP_CROSS(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, '<path d="M 19.4,31.6 q 1.5,-1.2 3.1,0 t 3.1,0 M 19.4,34.6 q 1.5,-1.2 3.1,0 t 3.1,0"/>')}`;

  // Veilleurs : boucliers et flèches de relève
  DRAW[CR_(2, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="${shield(22.5, 31.6, 0.95)}" fill="${F}" stroke="${D}" stroke-width="1.3"/>
    <path d="M 22.5,28.6 V 36" stroke="${D}" stroke-width="1.1"/>`;
  DRAW[CR_(2, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}
    <path d="${shield(28.5, 31, 0.9)}" fill="${F}" stroke="${D}" stroke-width="1.3"/>
    <path d="M 28.5,28.2 V 35.4" stroke="${D}" stroke-width="1.1"/>`;
  DRAW[CR_(2, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 19.6,15.6 L 25.4,22 M 25.4,15.6 L 19.6,22 M 19,18.8 H 26" fill="none" stroke="${D}" stroke-width="1.3"/>`;
  DRAW[CR_(2, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="${swapArrows(22.5, 23.3, 5.2)}" fill="none" stroke="${D}" stroke-width="1.4"/>`;
  DRAW[CR_(2, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    <path d="${shield(22.5, 31.8, 0.95)}" fill="${F}" stroke="${D}" stroke-width="1.3"/>`;
  DRAW[CR_(2, CR.K)] = ({ F, S, D }) => `${KING_TOP_CROSS(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, `<path d="${swapArrows(22.5, 33, 2.9)}"/>`)}`;

  // Ravageurs : crocs, lames, fêlures
  DRAW[CR_(3, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 15,34 L 17.5,31 L 20,34 L 22.5,31 L 25,34 L 27.5,31 L 30,34" fill="none" stroke="${D}" stroke-width="1.4"/>`;
  DRAW[CR_(3, CR.N)] = ({ F, S, D }) => `
    <path d="M 8,41 L 39.5,8.5" stroke="${S}" stroke-width="1.8"/>
    <path d="M 41.5,6.5 L 35,8.4 L 39.4,12.8 Z M 36.5,12 L 34,11.2" fill="${F}" stroke="${S}" stroke-width="1.3"/>
    ${KNIGHT_BODY(F, S, D)}`;
  DRAW[CR_(3, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 13.5,25.5 L 30.5,11" stroke="${S}" stroke-width="1.6"/>
    <path d="M 32.6,9.2 L 27.4,10.4 L 30.6,13.6 Z" fill="${F}" stroke="${S}" stroke-width="1.2"/>
    <path d="M 13.5,25.5 L 11.4,24.4 M 13.5,25.5 L 12.8,27.6" stroke="${S}" stroke-width="1.2"/>`;
  DRAW[CR_(3, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="M 20.5,17.5 L 24,21 L 20.8,23.6 L 24.8,29.2" fill="none" stroke="${D}" stroke-width="1.5"/>
    <path d="M 25,9 L 25,11 L 27.5,11" fill="none" stroke="${D}" stroke-width="1"/>`;
  DRAW[CR_(3, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '<path d="M 22.5,29.6 V 35.6 M 20.6,34 H 24.4"/>')}`;
  DRAW[CR_(3, CR.K)] = ({ F, S, D }) => `${KING_TOP_CROSS(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, '<path d="M 19.9,30.4 L 25.1,35.6 M 25.1,30.4 L 19.9,35.6 M 19.3,33.4 L 20.9,35 M 25.7,33.4 L 24.1,35"/>')}`;

  // Pionniers : chevrons, fanions, aurore
  DRAW[CR_(4, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 18.5,33.2 L 22.5,29.6 L 26.5,33.2 M 18.5,37.2 L 22.5,33.6 L 26.5,37.2" fill="none" stroke="${D}" stroke-width="1.5"/>`;
  DRAW[CR_(4, CR.N)] = ({ F, S, D }) => `
    <path d="M 18.3,8.4 V 1.6" stroke="${S}" stroke-width="1.4"/>
    <path d="M 18.8,1.8 L 25,3.8 L 18.8,5.8 Z" fill="${F}" stroke="${S}" stroke-width="1.2"/>
    ${KNIGHT_BODY(F, S, D)}`;
  DRAW[CR_(4, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 22.5,1.6 V 3.6 M 17.6,3.4 L 19,4.8 M 27.4,3.4 L 26,4.8 M 16,8 H 18 M 29,8 H 27" fill="none" stroke="${S}" stroke-width="1.3"/>
    <path d="M 22.5,15.5 V 20.5 M 20,18 L 22.5,15.5 L 25,18" fill="none" stroke="${D}" stroke-width="1.3"/>`;
  DRAW[CR_(4, CR.R)] = ({ F, S, D }) => `
    <path d="M 11.5,17.5 C 6.5,15.5 4.2,21 7.6,23.2 C 9.8,24.6 11.8,22.4 10.4,20.8" fill="none" stroke="${S}" stroke-width="1.7"/>
    <path d="M 33.5,17.5 C 38.5,15.5 40.8,21 37.4,23.2 C 35.2,24.6 33.2,22.4 34.6,20.8" fill="none" stroke="${S}" stroke-width="1.7"/>
    ${ROOK_BODY(F, S, D)}
    <path d="M 18.5,25.5 L 22.5,21.5 L 26.5,25.5" fill="none" stroke="${D}" stroke-width="1.4"/>`;
  DRAW[CR_(4, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '<path d="M 22.5,35.6 V 29.8 M 22.9,30 L 26,31.2 L 22.9,32.4"/>')}`;
  DRAW[CR_(4, CR.K)] = ({ F, S, D }) => `
    <path d="M 22.5,12 V 2.6" stroke="${S}" stroke-width="1.7"/>
    <path d="M 23,2.8 L 30,5 L 23,7.2 Z" fill="${F}" stroke="${S}" stroke-width="1.3"/>
    ${KING_TOP_PLAIN(F, S)}${KING_BODY(F, S, D)}`;

  // Rémanents : flammes et cendres
  DRAW[CR_(5, CR.P)] = ({ F, S, D }) => `${PAWN_BODY(F, S)}
    ${flame(22.5, 10.6, 2.6, F, S, 1.6)}
    ${flame(22.5, 32, 1.4, D, D, 0.8)}`;
  DRAW[CR_(5, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}
    ${flame(29.5, 32.5, 1.6, D, D, 0.8)}`;
  DRAW[CR_(5, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D, false)}
    ${flame(22.5, 7.4, 1.9, F, S, 1.4)}
    ${flame(22.5, 19.4, 1.5, D, D, 0.8)}`;
  DRAW[CR_(5, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="M 19,28.6 H 26 L 25,22.6 H 20 Z" fill="${F}" stroke="${D}" stroke-width="1.2"/>
    ${flame(22.5, 20.6, 1.3, D, D, 0.8)}`;
  DRAW[CR_(5, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '')}${flame(22.5, 33.6, 1.5, D, D, 0.8)}`;
  DRAW[CR_(5, CR.K)] = ({ F, S, D }) => `${flame(22.5, 6.8, 2.2, F, S, 1.5)}
    ${KING_TOP_PLAIN(F, S)}${KING_BODY(F, S, D)}
    <path d="M 18.6,31.4 h 7.8 v 4.4 h -7.8 Z M 18.6,31.4 c -1.4,0 -1.4,1.6 0,1.6 M 26.4,35.8 c 1.4,0 1.4,-1.6 0,-1.6" fill="${F}" stroke="${D}" stroke-width="1.1"/>`;

  // Héliarques : soleils, halos, obélisque
  const sun = (cx, cy, r, F, S) => {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, x1 = cx + Math.cos(a) * (r + 1.2), y1 = cy + Math.sin(a) * (r + 1.2);
      const x2 = cx + Math.cos(a) * (r + 3), y2 = cy + Math.sin(a) * (r + 3);
      rays += `M ${x1.toFixed(2)},${y1.toFixed(2)} L ${x2.toFixed(2)},${y2.toFixed(2)} `;
    }
    return `<path d="${rays}" stroke="${S}" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}" stroke="${S}" stroke-width="1.4"/>`;
  };
  DRAW[CR_(6, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 22.5,3.6 V 6 M 16.4,7 L 18,8.5 M 28.6,7 L 27,8.5 M 14.6,13 H 16.8 M 30.4,13 H 28.2" stroke="${S}" stroke-width="1.4"/>
    <circle cx="22.5" cy="32.5" r="2.2" fill="${D}" stroke="none"/>`;
  DRAW[CR_(6, CR.N)] = ({ F, S, D }) => `<ellipse cx="22" cy="10" rx="13" ry="3.4" transform="rotate(-18 22 10)" fill="none" stroke="${S}" stroke-width="1.3"/>
    ${KNIGHT_BODY(F, S, D)}<circle cx="33.6" cy="5.6" r="1.8" fill="${F}" stroke="${S}" stroke-width="1.2"/>`;
  DRAW[CR_(6, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D, false)}${sun(22.5, 6.6, 2.6, F, S)}
    <circle cx="22.5" cy="19" r="2.3" fill="none" stroke="${D}" stroke-width="1.3"/>`;
  DRAW[CR_(6, CR.R)] = ({ F, S, D }) => `
    <g fill="${F}" stroke="${S}">
      <path d="M 9,39 L 36,39 L 36,35.5 L 9,35.5 Z"/>
      <path d="M 13,35.5 L 15.5,13 L 29.5,13 L 32,35.5 Z"/>
      <path d="M 15.5,13 L 22.5,4.5 L 29.5,13 Z"/>
    </g>
    <path d="M 18.5,18.5 H 26.5 M 18,24 H 27 M 17.4,29.5 H 27.6" fill="none" stroke="${D}" stroke-width="1.1"/>
    <path d="M 22.5,9 V 11" stroke="${D}" stroke-width="1.4"/>`;
  DRAW[CR_(6, CR.Q)] = ({ F, S, D }) => `<ellipse cx="22.5" cy="3.6" rx="7" ry="1.9" fill="none" stroke="${S}" stroke-width="1.5"/>
    ${QUEEN_FULL(F, S, D)}${medal(F, D, '<circle cx="22.5" cy="33" r="1.6"/>')}`;
  DRAW[CR_(6, CR.K)] = ({ F, S, D }) => `${sun(22.5, 7.4, 2.8, F, S)}${KING_TOP_PLAIN(F, S)}${KING_BODY(F, S, D)}`;

  // Palimpsestes : runes, sceaux, cartes
  DRAW[CR_(7, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 22.5,29 V 37 M 22.5,32 L 19.5,29.5 M 22.5,32 L 25.5,29.5 M 22.5,34.4 L 19.8,36.6 M 22.5,34.4 L 25.2,36.6" fill="none" stroke="${D}" stroke-width="1.3"/>`;
  DRAW[CR_(7, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}
    <circle cx="29" cy="32" r="3.8" fill="${F}" stroke="${D}" stroke-width="1.2"/>
    <path d="M 29,29 V 35 M 26.6,30.6 L 31.4,33.4" fill="none" stroke="${D}" stroke-width="1.1"/>`;
  DRAW[CR_(7, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <circle cx="22.5" cy="19" r="3.6" fill="${F}" stroke="${D}" stroke-width="1.2"/>
    <path d="M 22.5,16 L 23.4,18.2 L 25.6,18.4 L 23.9,19.8 L 24.4,22 L 22.5,20.8 L 20.6,22 L 21.1,19.8 L 19.4,18.4 L 21.6,18.2 Z" fill="${D}" stroke="none"/>`;
  DRAW[CR_(7, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="M 18,20 L 22.5,26.5 L 27,20 M 22.5,26.5 V 20" fill="none" stroke="${D}" stroke-width="1.4"/>`;
  DRAW[CR_(7, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    <rect x="19.3" y="28.6" width="6.4" height="8.8" rx="1" fill="${F}" stroke="${D}" stroke-width="1.2"/>
    <path d="M 22.5,30.6 L 24,33 L 22.5,35.4 L 21,33 Z" fill="${D}" stroke="none"/>`;
  DRAW[CR_(7, CR.K)] = ({ F, S, D }) => `${KING_TOP_CROSS(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, '<path d="M 19.6,33 H 25.4 M 20.4,30.4 L 24.6,35.6"/>')}`;

  // Voraces : gueules, crocs, mandibules
  DRAW[CR_(8, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 18.2,30.6 Q 22.5,37.4 26.8,30.6 Z" fill="${D}" stroke="${D}" stroke-width="0.8"/>
    <path d="M 19.6,31 L 20.4,32.6 L 21.4,31.2 L 22.5,32.8 L 23.6,31.2 L 24.6,32.6 L 25.4,31" fill="none" stroke="${F}" stroke-width="0.8"/>`;
  DRAW[CR_(8, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}
    <path d="M 31.5,27.2 A 4.6,4.6 0 1 0 31.5,36.4 A 3.6,3.6 0 1 1 31.5,27.2 Z" fill="${D}" stroke="none"/>`;
  DRAW[CR_(8, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 19.5,15.5 C 17.6,18 18.6,21.2 21.6,22.2 M 25.5,15.5 C 27.4,18 26.4,21.2 23.4,22.2" fill="none" stroke="${D}" stroke-width="1.5"/>`;
  DRAW[CR_(8, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="M 16.5,20.5 H 28.5 V 26.5 H 16.5 Z" fill="${D}" stroke="none"/>
    <path d="M 16.8,20.6 L 18.4,23 L 20,20.6 L 21.6,23 L 23.2,20.6 L 24.8,23 L 26.4,20.6 L 28.2,23 M 16.8,26.4 L 18.4,24.2 L 20,26.4 L 21.6,24.2 L 23.2,26.4 L 24.8,24.2 L 26.4,26.4 L 28.2,24.2" fill="none" stroke="${F}" stroke-width="0.9"/>`;
  DRAW[CR_(8, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '')}<path d="M 19.4,31.4 Q 22.5,37.2 25.6,31.4 Z" fill="${D}" stroke="none"/>
    <path d="M 20.4,31.6 L 21.2,33.2 L 22.5,31.6 L 23.8,33.2 L 24.6,31.6" fill="none" stroke="${F}" stroke-width="0.8"/>`;
  DRAW[CR_(8, CR.K)] = ({ F, S, D }) => `${KING_TOP_CROSS(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, '<path d="M 22.5,33 m -0.8,0 a 0.8,0.8 0 1 1 1.6,0 a 1.8,1.8 0 1 1 -3.6,0 a 2.8,2.8 0 1 1 5.6,0"/>')}`;

  // Géomanciens : pioches, fissures, briques, montagnes
  DRAW[CR_(9, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 18.5,36.5 L 26,29" stroke="${D}" stroke-width="1.6"/>
    <path d="M 22.6,27.6 Q 26.8,27 29,30.6" fill="none" stroke="${D}" stroke-width="1.8"/>`;
  DRAW[CR_(9, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}
    <path d="M 26.5,28 L 29.5,31 L 27,33.4 L 30.4,37.6" fill="none" stroke="${D}" stroke-width="1.5"/>
    <path d="M 3.5,41 L 8,37.5 L 11,41 Z M 39.5,41 L 42.5,38 L 44,41 Z" fill="${F}" stroke="${S}" stroke-width="1.1"/>`;
  DRAW[CR_(9, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 22.5,14.6 L 19.6,22.4 M 22.5,14.6 L 25.4,22.4 M 20.6,19.6 Q 22.5,20.6 24.4,19.6" fill="none" stroke="${D}" stroke-width="1.3"/>
    <circle cx="22.5" cy="14.6" r="1" fill="${D}" stroke="none"/>`;
  DRAW[CR_(9, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="M 14,21 H 31 M 14,25 H 31 M 19,17 V 21 M 26,17 V 21 M 16.5,21 V 25 M 22.5,21 V 25 M 28.5,21 V 25 M 19,25 V 29.5 M 26,25 V 29.5" fill="none" stroke="${D}" stroke-width="1"/>`;
  DRAW[CR_(9, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '<path d="M 23.6,29.4 L 21,33 L 23.8,33.4 L 21.4,36.8"/>')}`;
  DRAW[CR_(9, CR.K)] = ({ F, S, D }) => `<path d="M 16.6,12.2 L 21,5.4 L 23.2,8.6 L 25,6.6 L 28.4,12.2 Z" fill="${F}" stroke="${S}" stroke-width="1.5"/>
    ${KING_TOP_PLAIN(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, '<path d="M 22.5,30.4 V 35.6 M 19.9,33 H 25.1"/>')}`;

  // Outremondes : portails, anneaux, prismes
  DRAW[CR_(10, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <ellipse cx="22.5" cy="13" rx="7.2" ry="2.4" fill="none" stroke="${S}" stroke-width="1.4"/>
    <path d="M 22.5,28.6 m -3.4,3.6 a 3.4,3.4 0 1 1 6.8,0 a 2.2,2.2 0 1 1 -4.4,0" fill="none" stroke="${D}" stroke-width="1.3"/>`;
  DRAW[CR_(10, CR.N)] = ({ F, S, D }) => `<ellipse cx="31" cy="22" rx="10.5" ry="16" fill="none" stroke="${S}" stroke-width="1.5" stroke-dasharray="3 2"/>
    ${KNIGHT_BODY(F, S, D)}`;
  DRAW[CR_(10, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 22.5,15 L 26,21.8 H 19 Z" fill="${F}" stroke="${D}" stroke-width="1.2"/>
    <path d="M 13,17.5 L 20.6,19.2 M 24.6,19.2 L 31,16 M 24.8,19.6 L 31.6,19.6" stroke="${D}" stroke-width="0.9"/>`;
  DRAW[CR_(10, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}
    <path d="M 18,29.5 V 23 A 4.5,4.5 0 0 1 27,23 V 29.5 Z" fill="${D}" stroke="none"/>
    <path d="M 22.5,26.4 m -1.6,0 a 1.6,1.6 0 1 1 3.2,0 a 1,1 0 1 1 -2,0" fill="none" stroke="${F}" stroke-width="0.9"/>`;
  DRAW[CR_(10, CR.Q)] = ({ F, S, D }) => `<g opacity="0.45" transform="translate(3.2,-1.8)">${QUEEN_FULL('none', S, 'none')}</g>
    ${QUEEN_FULL(F, S, D)}${medal(F, D, '<circle cx="21.3" cy="33" r="2.2"/><circle cx="23.7" cy="33" r="2.2"/>')}`;
  DRAW[CR_(10, CR.K)] = ({ F, S, D }) => `<ellipse cx="22.5" cy="7.6" rx="5.4" ry="3.6" fill="none" stroke="${S}" stroke-width="1.6"/>
    <ellipse cx="22.5" cy="7.6" rx="2.4" ry="1.5" fill="${S}" stroke="none"/>
    ${KING_TOP_PLAIN(F, S)}${KING_BODY(F, S, D)}
    ${medal(F, D, '<path d="M 19.6,33 H 25.4 M 23.6,31.4 L 25.4,33 L 23.6,34.6"/>')}`;

  // Horlogers : engrenages, cadrans, balanciers
  const gear = (cx, cy, rr, F, D) => `<circle cx="${cx}" cy="${cy}" r="${rr + 0.9}" fill="none" stroke="${D}" stroke-width="2" stroke-dasharray="1.4 1.3"/>
    <circle cx="${cx}" cy="${cy}" r="${rr}" fill="${F}" stroke="${D}" stroke-width="1.1"/><circle cx="${cx}" cy="${cy}" r="${(rr / 3).toFixed(2)}" fill="${D}" stroke="none"/>`;
  DRAW[CR_(11, CR.P)] = ({ F, S, D }) => `${DRAW[CR.P]({ F, S })}
    <path d="M 18.4,29.6 Q 22.5,32.6 26.6,29.6" fill="none" stroke="${D}" stroke-width="1.2"/>
    <path d="M 22.5,29.4 L 24.2,34.8" stroke="${D}" stroke-width="1.2"/><circle cx="24.4" cy="35.6" r="1.6" fill="${D}" stroke="none"/>`;
  DRAW[CR_(11, CR.N)] = ({ F, S, D }) => `${KNIGHT_BODY(F, S, D)}${gear(29, 32.4, 3.4, F, D)}`;
  DRAW[CR_(11, CR.B)] = ({ F, S, D }) => `${BISHOP_BODY(F, S, D)}
    <path d="M 18.8,21.2 A 3.7,3.7 0 0 1 26.2,21.2 Z" fill="${F}" stroke="${D}" stroke-width="1.2"/>
    <path d="M 22.5,21.2 L 25,15.6 M 22.5,21.2 V 18.4 M 22.5,21.2 L 20.2,19" stroke="${D}" stroke-width="1"/>`;
  DRAW[CR_(11, CR.R)] = ({ F, S, D }) => `${ROOK_BODY(F, S, D)}${gear(22.5, 23.2, 3.6, F, D)}`;
  DRAW[CR_(11, CR.Q)] = ({ F, S, D }) => `${QUEEN_FULL(F, S, D)}
    ${medal(F, D, '<path d="M 22.5,33 V 29.8 M 22.5,33 L 24.8,34.2"/>')}`;
  DRAW[CR_(11, CR.K)] = ({ F, S, D }) => `<circle cx="22.5" cy="7.2" r="4.2" fill="${F}" stroke="${S}" stroke-width="1.6"/>
    <path d="M 22.5,7.2 V 4.4 M 22.5,7.2 L 24.6,8.4" stroke="${S}" stroke-width="1.2"/>
    ${KING_TOP_PLAIN(F, S)}${KING_BODY(F, S, D)}${gear(22.5, 33, 3, F, D)}`;

  function svg(type, color) {
    const pal = PALETTE[color];
    const gid = 'g' + type + color;
    const inner = DRAW[type]({ F: `url(#${gid})`, S: pal.S, D: pal.D });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${pal.top}"/><stop offset="1" stop-color="${pal.bottom}"/>
        </linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.9" stdDeviation="0.5" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#sh)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
    </svg>`;
  }

  const cache = {};
  // URL utilisable en background-image / src ; `piece` = code de pièce du moteur de règles
  function pieceURL(piece) {
    if (!cache[piece]) {
      cache[piece] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(piece & 127, piece >> 7));
    }
    return cache[piece];
  }
  const typeURL = (type, color) => pieceURL(type | (color << 7));

  G.PieceArt = { pieceURL, typeURL, svg };
})(window);
