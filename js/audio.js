/* 音效:全部用 Web Audio 即時合成,不需要音效檔。錯誤音刻意做得很輕柔。 */
(function () {
  'use strict';
  var KT = window.KT = window.KT || {};
  var ctx = null, master = null;

  function ensure() {
    if (Sfx.muted) return null;
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.7;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended' && ctx.resume) { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, dur, opt) {
    opt = opt || {};
    var c = ensure(); if (!c) return;
    try {
      var t = c.currentTime + (opt.delay || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = opt.type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opt.vol || 0.08, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* 忽略音效錯誤 */ }
  }

  var SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // 五聲音階,怎麼按都好聽

  var Sfx = KT.Sfx = {
    muted: false,
    unlock: function () { ensure(); },
    good: function (streak) {
      var f = SCALE[(Math.max(1, streak || 1) - 1) % SCALE.length];
      tone(f, 0.13, { type: 'sine', vol: 0.07 });
    },
    item: function () {
      tone(784, 0.1, { type: 'triangle', vol: 0.06 });
      tone(1175, 0.16, { type: 'sine', vol: 0.06, delay: 0.06 });
    },
    bad: function () {
      tone(220, 0.16, { type: 'sine', vol: 0.05, slide: 180 });
    },
    click: function () { tone(660, 0.06, { type: 'sine', vol: 0.05 }); },
    win: function (stars) {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach(function (f, i) { tone(f, 0.22, { type: 'triangle', vol: 0.08, delay: i * 0.11 }); });
      for (var s = 0; s < (stars || 0); s++) {
        tone(1568 + s * 200, 0.18, { type: 'sine', vol: 0.05, delay: 0.55 + s * 0.28 });
      }
    },
    setMuted: function (m) {
      this.muted = !!m;
      if (KT.Store) KT.Store.setSetting('muted', this.muted);
    }
  };
  if (KT.Store) Sfx.muted = !!KT.Store.data.settings.muted;
})();
