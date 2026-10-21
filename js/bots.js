/*
 * Adversaires :
 *  - StockfishBot : Stockfish 19 (WASM) pour les parties classiques.
 *  - VariantBot   : moteur alpha-bêta maison (js/ai-worker.js) pour les parties avec pièces
 *                   personnalisées, que Stockfish ne sait pas jouer.
 */
(function (G) {
  'use strict';
  const CR = G.ChessRules;

  class StockfishBot {
    constructor(url) {
      this.url = url;
      this.listeners = new Set();
      this.eloMin = 1320;
      this.eloMax = 3190;
      this.name = 'Stockfish 19';
      this.queue = Promise.resolve();
      this.ready = this._init();
    }

    _init() {
      return new Promise((resolve, reject) => {
        let worker;
        try { worker = new Worker(this.url); } catch (e) { reject(e); return; }
        this.worker = worker;
        worker.onmessage = e => {
          const line = typeof e.data === 'string' ? e.data : String(e.data);
          for (const l of this.listeners) l(line);
        };
        worker.onerror = e => reject(e.message || 'Erreur du worker');
        const timer = setTimeout(() => reject('Délai de chargement dépassé'), 90000);
        const off = this._on(line => {
          const m = line.match(/^option name UCI_Elo type spin default \d+ min (\d+) max (\d+)/);
          if (m) { this.eloMin = +m[1]; this.eloMax = +m[2]; }
          const id = line.match(/^id name (.+)/);
          if (id) this.engineId = id[1];
          if (line === 'uciok') this.send('isready');
          if (line === 'readyok') { clearTimeout(timer); off(); resolve(); }
        });
        this.send('uci');
      });
    }

    _on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    send(cmd) { this.worker.postMessage(cmd); }
    _waitFor(pred) {
      return new Promise(resolve => {
        const off = this._on(line => { if (pred(line)) { off(); resolve(line); } });
      });
    }

    newGame() {
      this.queue = this.queue.then(async () => {
        await this.ready;
        this.send('ucinewgame');
        this.send('isready');
        await this._waitFor(l => l === 'readyok');
      });
      return this.queue;
    }

    // Arrête la recherche en cours (la réponse sera ignorée par la partie)
    stop() { if (this.worker) this.send('stop'); }

    /* Sous 1320 Elo (minimum de UCI_Elo), on affaiblit Stockfish : Skill Level 0, profondeur
       très réduite et une part de coups aléatoires qui imite les gaffes d'un débutant. */
    params(elo) {
      if (elo >= this.eloMin) {
        return { limit: true, elo, skill: 20, go: `go movetime ${Math.round(500 + (elo - this.eloMin) / (2800 - this.eloMin) * 900)}`, blunder: 0 };
      }
      const t = Math.max(0, (elo - 400) / (this.eloMin - 400));
      const depth = Math.max(1, Math.round(1 + t * 5));
      return { limit: false, skill: 0, go: `go depth ${depth}`, blunder: 0.03 + 0.42 * (1 - t) };
    }

    // pos : Position (pour les coups légaux), uciMoves : historique depuis la position initiale
    chooseMove(pos, uciMoves, elo) {
      const job = this.queue.then(async () => {
        await this.ready;
        const legal = pos.legal();
        const p = this.params(elo);
        if (p.blunder && Math.random() < p.blunder) return legal[Math.floor(Math.random() * legal.length)];
        this.send(`setoption name UCI_LimitStrength value ${p.limit}`);
        if (p.limit) this.send(`setoption name UCI_Elo value ${p.elo}`);
        this.send(`setoption name Skill Level value ${p.skill}`);
        this.send('position startpos' + (uciMoves.length ? ' moves ' + uciMoves.join(' ') : ''));
        this.send(p.go);
        const line = await this._waitFor(l => l.startsWith('bestmove'));
        const uci = line.split(/\s+/)[1];
        return pos.fromUci(uci, legal) || legal[0];
      });
      this.queue = job.catch(() => {});
      return job;
    }
  }

  class VariantBot {
    constructor(url) {
      this.url = url;
      this.name = 'Moteur variantes';
      this.seq = 0;
      this.pending = new Map();
      this._spawn();
    }
    _spawn() {
      this.worker = new Worker(this.url);
      this.worker.onmessage = e => {
        const { id, move } = e.data;
        const cb = this.pending.get(id);
        if (cb) { this.pending.delete(id); cb(move); }
      };
    }
    newGame() { this.worker.postMessage({ type: 'new' }); return Promise.resolve(); }
    stop() {
      // on relance le worker pour interrompre net une recherche en cours
      if (this.pending.size) {
        this.worker.terminate();
        this.pending.clear();
        this._spawn();
      }
    }
    chooseMove(game, elo) {
      const id = ++this.seq;
      return new Promise(resolve => {
        this.pending.set(id, resolve);
        this.worker.postMessage({ type: 'think', id, setupW: game.setupW, setupB: game.setupB, moves: game.moves, elo });
      });
    }
  }

  G.Bots = { StockfishBot, VariantBot };
})(window);
