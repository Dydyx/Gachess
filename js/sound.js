// Sons synthétisés (aucun fichier audio) : coup, prise, échec, roque, promotion, début/fin de partie.
(function (G) {
  'use strict';
  let ctx = null;
  const ac = () => {
    if (!ctx) {
      try { ctx = new (G.AudioContext || G.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function knock(t0, { freq = 180, decay = 0.07, gain = 0.5, noise = 0.35 } = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + t0;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.03);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + decay + 0.02);
    // claquement bref (bruit filtré)
    const len = Math.floor(c.sampleRate * 0.03);
    const buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g2 = c.createGain();
    src.buffer = buf;
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    g2.gain.value = noise;
    src.connect(f).connect(g2).connect(c.destination);
    src.start(t);
  }
  function tone(t0, freq, dur, gain = 0.18) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + t0;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  G.Sound = {
    move: () => knock(0),
    capture: () => { knock(0, { freq: 140, gain: 0.6, noise: 0.6, decay: 0.09 }); knock(0.045, { freq: 220, gain: 0.25, noise: 0.25 }); },
    castle: () => { knock(0); knock(0.09, { freq: 200 }); },
    check: () => { knock(0); tone(0.02, 880, 0.18, 0.12); },
    promote: () => { knock(0); tone(0.03, 660, 0.12, 0.1); tone(0.12, 990, 0.16, 0.1); },
    start: () => { tone(0, 523, 0.18); tone(0.12, 784, 0.25); },
    end: () => { tone(0, 784, 0.2); tone(0.15, 659, 0.2); tone(0.3, 523, 0.35); },
    unlock: () => ac()
  };
})(window);
