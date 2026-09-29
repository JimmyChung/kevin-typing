/* 進度儲存:localStorage(無法使用時自動改用記憶體,不會壞掉) */
(function () {
  'use strict';
  var KT = window.KT = window.KT || {};
  var KEY = 'kevinTyping.progress.v1';

  function defaults() {
    return {
      version: 1,
      name: 'Kevin',
      settings: { muted: false, unlockAll: false },
      progress: {},      // progress[themeId][levelId] = {stars,bestWpm,bestAcc,plays,last,lastWpm,lastAcc}
      keyErrors: {},     // 打錯次數(以「應該打的鍵」計)
      totalChars: 0,
      totalMs: 0,
      sessions: 0,
      history: []        // 最近 60 次練習
    };
  }

  var canUse = false;
  try {
    var t = '__kt_test__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    canUse = true;
  } catch (e) { canUse = false; }

  var Store = KT.Store = {
    available: canUse,
    data: defaults(),
    load: function () {
      if (!canUse) return;
      try {
        var raw = window.localStorage.getItem(KEY);
        if (raw) {
          var d = JSON.parse(raw), base = defaults();
          for (var k in base) if (!(k in d)) d[k] = base[k];
          for (var s in base.settings) if (!(s in d.settings)) d.settings[s] = base.settings[s];
          this.data = d;
        }
      } catch (e) { this.data = defaults(); }
    },
    save: function () {
      if (!canUse) return;
      try { window.localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* 空間滿了也不影響遊戲 */ }
    },
    getLevel: function (themeId, levelId) {
      var p = this.data.progress[themeId];
      return (p && p[levelId]) || { stars: 0, bestWpm: 0, bestAcc: 0, plays: 0, last: 0 };
    },
    recordResult: function (themeId, levelId, r) {
      var p = this.data.progress[themeId] = this.data.progress[themeId] || {};
      var L = p[levelId] = p[levelId] || { stars: 0, bestWpm: 0, bestAcc: 0, plays: 0, last: 0 };
      var prevStars = L.stars;
      L.stars = Math.max(L.stars, r.stars);
      L.bestWpm = Math.max(L.bestWpm, r.wpm);
      L.bestAcc = Math.max(L.bestAcc, r.acc);
      L.lastWpm = r.wpm; L.lastAcc = r.acc;
      L.plays += 1; L.last = Date.now();
      var ek = r.errorKeys || {};
      for (var k in ek) this.data.keyErrors[k] = (this.data.keyErrors[k] || 0) + ek[k];
      this.data.totalChars += r.chars || 0;
      this.data.totalMs += r.ms || 0;
      this.data.sessions += 1;
      this.data.history.push({ t: L.last, theme: themeId, level: levelId, stars: r.stars, wpm: r.wpm, acc: r.acc });
      if (this.data.history.length > 60) this.data.history = this.data.history.slice(-60);
      this.save();
      return { prevStars: prevStars, newBest: r.stars > prevStars };
    },
    setSetting: function (k, v) { this.data.settings[k] = v; this.save(); },
    reset: function () {
      var keep = { name: this.data.name, muted: this.data.settings.muted };
      this.data = defaults();
      this.data.name = keep.name; this.data.settings.muted = keep.muted;
      this.save();
    }
  };
  Store.load();
})();
