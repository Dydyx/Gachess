# Gachess — échecs contre Stockfish 19, pièces et archétypes personnalisables

## Lancer l'application
Double-cliquez sur **Lancer.bat** (Node.js requis) : le serveur local démarre et le navigateur
s'ouvre sur http://localhost:8642. Un serveur est nécessaire, car Stockfish tourne dans un Web Worker
(ouvrir `index.html` directement depuis le disque ne fonctionne pas).

Ou, en ligne de commande : `node server.js` (et **Arreter.bat** pour l'éteindre).

## Sur smartphone
Gachess détecte les téléphones et adopte une disposition dédiée : une seule colonne, échiquier de 340 px
(cases de 34 px), onglets « Partie » / « Pouvoirs en jeu », plan secondaire sous l'échiquier. Au toucher :
touchez une pièce puis une case (ou faites-la glisser) ; un **appui long** marque une case (équivalent du clic droit).

En ligne (GitHub Pages), l'appli s'installe comme une application : sur Android, menu de Chrome →
« Ajouter à l'écran d'accueil » / « Installer l'application » ; sur iPhone, Safari → Partager →
« Sur l'écran d'accueil ». Elle fonctionne ensuite hors connexion.

Sur téléphone et en ligne, c'est **Stockfish 19 lite** (1,8 Mo) qui est utilisé ; la version complète (94 Mo)
ne sert qu'en local sur ordinateur et n'est pas publiée dans le dépôt. Les sauvegardes restent propres à chaque
appareil : utilisez Exporter / Importer pour transférer une configuration.

## Contenu
- `engine/` : Stockfish 19 (stockfish.js 19.0.1, versions WASM mono-thread complète et lite, licence GPL v3).
- `manifest.webmanifest`, `sw.js`, `icons/` : application installable et hors connexion (PWA).
- `js/rules.js` : règles complètes (roque, prise en passant, promotion, pat, 50 coups, triple
  répétition, matériel insuffisant) + les 6 pièces personnalisées.
- `js/ai-worker.js` : moteur alpha-bêta utilisé pour les parties personnalisées, car Stockfish ne connaît pas les pièces inventées.
- `js/board.js` : échiquier façon chess.com (aperçu des coups, anneaux de prise, glisser-déposer,
  flèches et marques au clic droit, coordonnées, promotion).
- `js/pieces.js` : sprites SVG des 12 pièces × 2 couleurs.

## Archétypes
Les pièces classiques et les 6 pièces Commun (Biaiseur, Rempart, Voltigeur, Louvoyeur, Chimère, Souverain)
vont avec tout. Les 11 archétypes (Errants, Veilleurs, Ravageurs, Pionniers, Rémanents, Héliarques, Palimpsestes, Voraces,
Géomanciens, Outremondes, Horlogers) ont chacun 6 pièces
qui gardent la marche de la pièce remplacée et y ajoutent un pouvoir. Une configuration ne peut contenir
qu'un seul archétype.
- Relèves, Bélier, Meneuse : cliquez la pièce puis la case alliée (anneau bleu).
- Pouvoirs après une prise (Vagabonde, Harpon, Vendetta, Duelarque) : après la prise, une barre propose
  les cases violettes ou « Sans pouvoir ».
- Résurrections (Rémanents), tracé de glyphe (Palimpsestes), Apothéose (Héliarques) : sélectionnez la pièce puis
  le bouton violet sous la liste des coups.
- Absorption (Voraces) : cliquez la pièce puis l'alliée à absorber (anneau bleu). La Dévoracle rejoue aussitôt.
- Glyphes : cercles pointillés sur les cases (turquoise = Blancs), rouge quand une Entrave est déclenchée.
  Une pièce transformée porte un badge de la marche héritée ; l'étoile qui tourne signale l'Apothéose.

## Plateau
Le plateau est un cadre fixe 10×10 (cases de 64 px) : seul le cœur a1–h8 existe au départ. Les Géomanciens
peuvent faire s'effondrer des cases (trous sombres) ou en créer, y compris hors du 8×8 (colonnes z et i,
rangées 0 et 9). Les Outremondes ouvrent un plan secondaire 8×8, affiché dans le panneau de gauche, où des
pièces des deux camps jouent pendant 8 demi-coups avant de revenir.

## Niveaux
- 1400 à 2800 Elo : réglage natif de Stockfish (`UCI_LimitStrength` / `UCI_Elo`).
- 400 à 1300 Elo : Stockfish descend au minimum à 1320 ; en dessous, l'appli combine Skill Level 0,
  une profondeur très faible et une part de coups aléatoires (gaffes de débutant).
- Parties personnalisées : le moteur maison règle temps, profondeur et « bruit » selon l'Elo ;
  son niveau réel plafonne plus bas que Stockfish aux niveaux élevés.

## Format d'export
```json
{ "format": "echecs-personnalises", "version": 1, "nom": "Ma config",
  "pieces": { "a1": "rempart", "b1": "cavalier", "...": "...", "h2": "pion" } }
```
Valeurs permises par case : pion/biaiseur (a2–h2), tour/rempart (a1, h1), cavalier/voltigeur (b1, g1),
fou/louvoyeur (c1, f1), dame/chimere (d1), roi/souverain (e1).

## Crédits et licences
- **Stockfish** : © les auteurs de Stockfish, licence GPL v3 (voir `engine/Copying.txt`). Portage WebAssembly
  stockfish.js par Nathan Rugg — code source : https://github.com/nmrugg/stockfish.js et
  https://github.com/official-stockfish/Stockfish
- **Pièces classiques** : géométrie inspirée du jeu « cburnett » (Colin M.L. Burnett, CC BY-SA 3.0),
  redessiné ; les pièces inventées sont dessinées dans le même style.
