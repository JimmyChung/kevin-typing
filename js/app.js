/* 主程式:畫面切換、遊戲邏輯、家長專區 */
(function () {
  'use strict';
  var KT = window.KT;
  var Store = KT.Store, Sfx = KT.Sfx, KB = KT.Keyboard;
  var app = document.getElementById('app');
  var decoEl = document.getElementById('deco');
  var toastEl = document.getElementById('toast');

  var DEFAULT_COLORS = {
    primary: '#ff6f91', accent: '#ffc75f', text: '#3b2c5a',
    panel: 'rgba(255,255,255,.9)', panelText: '#3b2c5a', objectBg: '#fff', objectText: '#333'
  };
  var HOME_BG = 'radial-gradient(circle at 15% 20%, #ffe29a 0 60px, transparent 61px),' +
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 40%, #fbc2eb 100%)';

  var S = { screen: 'home', theme: null, levels: [], li: 0, game: null, result: null, resultAt: 0, ticker: null };

  /* ---------- 小工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel) { return app.querySelector(sel); }
  function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function starsHTML(n, max) {
    var s = ''; max = max || 3;
    for (var i = 0; i < max; i++) s += '<span class="st ' + (i < n ? 'on' : 'off') + '">★</span>';
    return s;
  }
  function fmtTime(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function fmtDate(t) {
    if (!t) return '—';
    var d = new Date(t);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 1300);
  }
  function muteBtn() {
    return '<button class="btn btn-mute" data-act="mute" title="音效開關">' + (Sfx.muted ? '🔇 音效關' : '🔊 音效開') + '</button>';
  }
  function kidName() { return Store.data.name || 'Kevin'; }

  /* ---------- 主題 / 關卡 ---------- */
  function themes() {
    return (window.THEMES || []).filter(function (t) { return t && t.id && t.name; });
  }
  function levelsOf(t) {
    return (t.useBaseLevels === false ? [] : KT.BASE_LEVELS).concat(t.levels || []);
  }
  function isUnlocked(t, i) {
    if (i === 0 || Store.data.settings.unlockAll) return true;
    var prev = levelsOf(t)[i - 1];
    return Store.getLevel(t.id, prev.id).stars > 0;
  }
  function themeStars(t) {
    var lv = levelsOf(t), got = 0;
    lv.forEach(function (l) { got += Store.getLevel(t.id, l.id).stars; });
    return { got: got, total: lv.length * 3 };
  }
  function nextPlayable(t) {
    var lv = levelsOf(t);
    for (var i = 0; i < lv.length; i++) {
      if (isUnlocked(t, i) && Store.getLevel(t.id, lv[i].id).stars === 0) return i;
    }
    for (i = 0; i < lv.length; i++) if (isUnlocked(t, i) && Store.getLevel(t.id, lv[i].id).stars < 3) return i;
    return 0;
  }

  function applyTheme(t) {
    var c = {}, k;
    for (k in DEFAULT_COLORS) c[k] = DEFAULT_COLORS[k];
    if (t && t.colors) for (k in t.colors) c[k] = t.colors[k];
    var st = document.documentElement.style;
    st.setProperty('--primary', c.primary);
    st.setProperty('--accent', c.accent);
    st.setProperty('--text', c.text);
    st.setProperty('--panel', c.panel);
    st.setProperty('--panel-text', c.panelText);
    st.setProperty('--obj-bg', c.objectBg);
    st.setProperty('--obj-text', c.objectText);
    document.body.style.background = (t && t.background) || HOME_BG;
    document.body.dataset.theme = t ? t.id : 'home';
    var h = '';
    ((t && t.decorations) || [
      { emoji: '⭐', x: '6%', y: '8%', size: '3rem' }, { emoji: '🌈', x: '86%', y: '6%', size: '4rem' },
      { emoji: '🎈', x: '90%', y: '70%', size: '3rem' }, { emoji: '✏️', x: '4%', y: '72%', size: '2.6rem' }
    ]).forEach(function (d, i) {
      h += '<span class="deco" style="left:' + d.x + ';top:' + d.y + ';font-size:' + (d.size || '3rem') +
        ';animation-delay:' + (i * 0.7) + 's">' + d.emoji + '</span>';
    });
    decoEl.innerHTML = h;
  }

  function stopTicker() { if (S.ticker) { clearInterval(S.ticker); S.ticker = null; } }

  function show(screen) {
    stopTicker();
    S.screen = screen;
    document.body.dataset.screen = screen;
    window.scrollTo(0, 0);
  }

  /* ---------- 首頁 ---------- */
  function renderHome() {
    show('home');
    S.theme = null; S.game = null;
    applyTheme(null);
    var cards = '';
    themes().forEach(function (t, i) {
      var st = themeStars(t), pct = st.total ? Math.round(st.got / st.total * 100) : 0;
      var c = t.colors || {};
      cards += '<button class="theme-card" data-act="theme" data-id="' + esc(t.id) + '" style="background:' + esc(t.background) +
        ';color:' + esc(c.text || '#fff') + '">' +
        '<span class="tc-key">' + (i < 9 ? '按 ' + (i + 1) : '') + '</span>' +
        '<span class="tc-emoji">' + t.emoji + '</span>' +
        '<span class="tc-name">' + esc(t.name) + '</span>' +
        '<span class="tc-desc">' + esc(t.description || '') + '</span>' +
        '<span class="tc-stars">⭐ ' + st.got + ' / ' + st.total + '</span>' +
        '<span class="tc-bar"><i style="width:' + pct + '%"></i></span>' +
        '</button>';
    });
    app.innerHTML =
      '<section class="screen home">' +
      '<header class="home-head"><div class="logo">⌨️</div><h1><span class="kid">' + esc(kidName()) + '</span> 的打字冒險</h1>' +
      '<p>選一個世界開始練習吧!(用手指點,或按數字鍵)</p></header>' +
      '<div class="theme-cards">' + cards + '</div>' +
      '<footer class="home-foot">' +
      '<button class="btn" data-act="parent">👨‍👩‍👦 家長專區</button>' + muteBtn() +
      '</footer>' +
      '<p class="home-tip">💡 小提醒:坐正、手指放在 <b>A S D F</b> 和 <b>J K L ;</b> 上,眼睛看螢幕。</p>' +
      '</section>';
  }

  /* ---------- 關卡地圖 ---------- */
  function renderMap(themeId) {
    var t = themes().filter(function (x) { return x.id === themeId; })[0] || S.theme || themes()[0];
    if (!t) return renderHome();
    show('map');
    S.theme = t; S.levels = levelsOf(t); S.game = null;
    applyTheme(t);
    var next = nextPlayable(t), st = themeStars(t);
    var cards = '', lastStage = null;
    S.levels.forEach(function (lv, i) {
      var p = Store.getLevel(t.id, lv.id), un = isUnlocked(t, i);
      var stage = KT.STAGES[lv.stage] || lv.stage || '';
      cards += '<button class="lvl' + (un ? '' : ' locked') + (i === next ? ' current' : '') + (p.stars === 3 ? ' perfect' : '') +
        '" data-act="level" data-i="' + i + '"' + (un ? '' : ' aria-disabled="true"') + '>' +
        (i === next ? '<span class="lvl-arrow">👇</span>' : '') +
        '<span class="lvl-stage' + (stage !== lastStage ? ' first' : '') + '">' + esc(stage) + '</span>' +
        '<span class="lvl-num">' + (un ? (i + 1) : '🔒') + '</span>' +
        '<span class="lvl-title">' + esc(lv.title) + '</span>' +
        '<span class="lvl-stars">' + starsHTML(p.stars) + '</span>' +
        '</button>';
      lastStage = stage;
    });
    app.innerHTML =
      '<section class="screen map">' +
      '<div class="topbar"><button class="btn" data-act="home">⬅ 首頁</button>' +
      '<h2>' + t.emoji + ' ' + esc(t.title || t.name) + '</h2><div class="spacer"></div>' +
      '<span class="pill">⭐ ' + st.got + ' / ' + st.total + '</span>' + muteBtn() + '</div>' +
      '<div class="map-grid">' + cards + '</div>' +
      '<p class="map-hint">點一關開始,或按 <kbd>Enter</kbd> 玩第 ' + (next + 1) + ' 關「' + esc(S.levels[next].title) + '」</p>' +
      '</section>';
  }

  /* ---------- 遊戲 ---------- */
  function buildItems(lv) {
    var n = lv.count || 10, items = [];
    if (lv.type === 'keys') {
      var pool = (lv.keys || 'asdfjkl;').split('');
      var fresh = (lv.newKeys || '').split('').filter(Boolean);
      var weighted = pool.concat(fresh, fresh, fresh);
      for (var i = 0; i < n; i++) {
        var c, tries = 0;
        do { c = weighted[Math.floor(Math.random() * weighted.length)]; tries++; }
        while (tries < 20 && i >= 2 && items[i - 1] === c && items[i - 2] === c);
        items.push(c);
      }
      // 確保新學的鍵每個至少出現兩次
      fresh.forEach(function (k, j) {
        var cnt = items.filter(function (x) { return x === k; }).length;
        for (var m = cnt; m < 2 && items.length; m++) items[(j * 5 + m * 3 + 1) % items.length] = k;
      });
    } else {
      var src = lv.type === 'sentences' ? (lv.sentences || []) : (lv.words || []);
      var bag = [];
      while (bag.length < n && src.length) bag = bag.concat(shuffle(src));
      items = bag.slice(0, n);
    }
    return items;
  }

  function startLevel(i) {
    var t = S.theme; if (!t) return renderHome();
    if (!isUnlocked(t, i)) { toast('🔒 先完成前一關才能玩喔!'); return; }
    show('game');
    S.li = i;
    var lv = S.levels[i];
    S.game = {
      lv: lv, items: buildItems(lv), idx: 0, pos: 0, correct: 0, errors: 0, posErr: false,
      started: false, t0: 0, pausedAt: 0, pausedTotal: 0, paused: false, intro: true, done: false,
      errorKeys: {}, streak: 0, bestStreak: 0, justDone: false
    };
    renderGame();
  }

  function renderGame() {
    var g = S.game, t = S.theme, lv = g.lv;
    app.innerHTML =
      '<section class="screen game type-' + lv.type + '">' +
      '<div class="topbar">' +
      '<button class="btn" data-act="pause">⏸ 暫停</button>' +
      '<h2>第 ' + (S.li + 1) + ' 關:' + esc(lv.title) + '</h2><div class="spacer"></div>' +
      '<span class="pill stat" id="st-acc">🎯 準確率 <b>100%</b></span>' +
      '<span class="pill stat" id="st-wpm">⚡ 速度 <b>0</b> 字/分</span>' +
      '<span class="pill stat" id="st-time">⏱ <b>0:00</b></span>' + muteBtn() +
      '</div>' +
      '<div class="stage">' +
      '<div class="objects" id="objects"></div>' +
      '<div class="track"><span class="track-goal">' + (t.goal || '🏁') + '</span><span class="track-runner' + (t.runnerFlip ? ' flip' : '') + '" id="runner">' + (t.runner || '🏃') + '</span><span class="track-count" id="count"></span></div>' +
      '</div>' +
      '<div class="kb-area"><div id="hand-l"></div><div id="kb"></div><div id="hand-r"></div></div>' +
      '<div class="hint" id="hint"></div>' +
      '<div class="overlay" id="overlay"></div>' +
      '</section>';
    KB.render($('#kb'));
    KB.renderHands($('#hand-l'), $('#hand-r'));
    renderQueue();
    updateHint(); updateStats(); updateProgress();
    showIntro();
  }

  function showIntro() {
    var g = S.game, lv = g.lv, t = S.theme;
    var what = lv.type === 'keys' ? '打出每個' + (t.id === 'space' ? '隕石' : '牌子') + '上的字母'
      : lv.type === 'words' ? '打出完整的單字' : '打出整個句子(包含空白和句點)';
    var ov = $('#overlay');
    ov.className = 'overlay show';
    ov.innerHTML = '<div class="ov-card">' +
      '<div class="ov-emoji">' + pick((t.objects && t.objects[lv.type]) || [t.emoji], S.li) + '</div>' +
      '<h2>第 ' + (S.li + 1) + ' 關:' + esc(lv.title) + '</h2>' +
      (lv.tip ? '<p class="ov-tip">' + esc(lv.tip) + '</p>' : '') +
      '<p>任務:' + what + ',共 ' + g.items.length + ' 題。</p>' +
      '<p class="ov-small">先把手指放好在基本列(F 和 J 有小凸點)</p>' +
      '<button class="btn big primary" data-act="begin">按 <kbd>空白鍵</kbd> 開始 ▶</button>' +
      '</div>';
  }

  function hideOverlay() { var ov = $('#overlay'); if (ov) { ov.className = 'overlay'; ov.innerHTML = ''; } }

  function beginGame() {
    var g = S.game; if (!g || !g.intro) return;
    g.intro = false;
    hideOverlay();
    Sfx.unlock(); Sfx.click();
    stopTicker();
    S.ticker = setInterval(updateStats, 500);
  }

  function pauseGame() {
    var g = S.game; if (!g || g.done || g.intro || g.paused) return;
    g.paused = true; g.pausedAt = performance.now();
    var ov = $('#overlay');
    ov.className = 'overlay show';
    ov.innerHTML = '<div class="ov-card"><div class="ov-emoji">☕</div><h2>休息一下</h2>' +
      '<p>準備好了就繼續吧!</p>' +
      '<div class="ov-btns"><button class="btn big primary" data-act="resume">▶ 繼續 (空白鍵)</button>' +
      '<button class="btn big" data-act="restart">🔁 重新開始</button>' +
      '<button class="btn big" data-act="map">🗺️ 回地圖 (Esc)</button></div></div>';
  }
  function resumeGame() {
    var g = S.game; if (!g || !g.paused) return;
    if (g.started) g.pausedTotal += performance.now() - g.pausedAt;
    g.paused = false; hideOverlay();
  }

  function objHTML(text, i, isCurrent, pos) {
    var t = S.theme, lv = S.game.lv;
    var emo = pick((t.objects && t.objects[lv.type]) || [t.emoji || '⭐'], i);
    var label = '';
    for (var k = 0; k < text.length; k++) {
      var ch = text[k];
      var cls = isCurrent ? (k < pos ? 'done' : (k === pos ? 'cur' : '')) : '';
      label += '<span class="ch ' + cls + (ch === ' ' ? ' sp' : '') + '">' + (ch === ' ' ? '&nbsp;' : esc(ch)) + '</span>';
    }
    return '<div class="obj' + (isCurrent ? ' current' : '') + '" style="animation-delay:' + ((i % 5) * -0.4) + 's">' +
      '<div class="obj-emoji">' + emo + '</div><div class="obj-label">' + label + '</div></div>';
  }

  function renderQueue() {
    var g = S.game, box = $('#objects'); if (!box) return;
    var show = g.lv.type === 'sentences' ? 1 : (g.lv.type === 'words' ? 3 : 5);
    var h = '';
    for (var i = g.idx; i < Math.min(g.items.length, g.idx + show); i++) h += objHTML(g.items[i], i, i === g.idx, g.pos);
    box.innerHTML = h;
  }

  function updateCurrent() {
    var g = S.game, cur = app.querySelector('.obj.current'); if (!cur) return;
    var chs = cur.querySelectorAll('.ch');
    for (var k = 0; k < chs.length; k++) {
      chs[k].classList.toggle('done', k < g.pos);
      chs[k].classList.toggle('cur', k === g.pos);
    }
  }

  function popCurrent() {
    var cur = app.querySelector('.obj.current'), box = $('#objects');
    if (!cur || !box) return;
    var br = box.getBoundingClientRect(), r = cur.getBoundingClientRect();
    var ghost = cur.cloneNode(true);
    ghost.className = 'obj ghost';
    ghost.style.left = (r.left - br.left) + 'px';
    ghost.style.top = (r.top - br.top) + 'px';
    ghost.style.width = r.width + 'px';
    var fx = document.createElement('div');
    fx.className = 'hitfx'; fx.textContent = S.theme.hitEffect || '✨';
    ghost.appendChild(fx);
    box.appendChild(ghost);
    setTimeout(function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 600);
  }

  function expected() {
    var g = S.game; var it = g.items[g.idx];
    return it ? it.charAt(g.pos) : null;
  }

  function updateHint() {
    var g = S.game, el = $('#hint'); if (!el || !g) return;
    var ch = expected();
    KB.highlight(ch);
    if (!ch) { el.innerHTML = ''; return; }
    var f = KB.fingerOf(ch), fn = f ? KB.FINGERS[f] : null;
    el.innerHTML = fn
      ? '用 <b class="fname" style="background:' + fn.color + '">' + fn.name + '</b> 按 <b class="kname">' + esc(KB.keyLabel(ch)) + '</b>'
      : '請按 <b class="kname">' + esc(KB.keyLabel(ch)) + '</b>';
  }

  function elapsed() {
    var g = S.game; if (!g || !g.started) return 0;
    var now = g.paused ? g.pausedAt : performance.now();
    return Math.max(1, now - g.t0 - g.pausedTotal);
  }
  function calcWpm(chars, ms) { return ms < 1000 ? 0 : Math.round((chars / 5) / (ms / 60000)); }
  function calcAcc(g) { var tot = g.correct + g.errors; return tot ? Math.round(g.correct / tot * 100) : 100; }

  function updateStats() {
    var g = S.game; if (!g || S.screen !== 'game') return;
    var ms = elapsed();
    var a = $('#st-acc b'), w = $('#st-wpm b'), tm = $('#st-time b');
    if (a) a.textContent = calcAcc(g) + '%';
    if (w) w.textContent = ms > 2000 ? calcWpm(g.correct, ms) : 0;
    if (tm) tm.textContent = fmtTime(ms);
  }

  function updateProgress() {
    var g = S.game, r = $('#runner'), c = $('#count'); if (!r) return;
    var pct = g.items.length ? g.idx / g.items.length : 0;
    r.style.left = 'calc(' + (pct * 100) + '% * 0.9)';
    if (c) c.textContent = g.idx + ' / ' + g.items.length;
  }

  function onChar(ch) {
    var g = S.game; if (!g || g.done) return;
    if (g.intro) { if (ch === ' ') beginGame(); return; }
    if (g.paused) { if (ch === ' ') resumeGame(); return; }
    var exp = expected(); if (exp == null) return;
    if (g.justDone && ch === ' ' && g.lv.type === 'words') { g.justDone = false; return; } // 單字後順手按空白不算錯
    g.justDone = false;
    if (!g.started) { g.started = true; g.t0 = performance.now(); }

    if (ch === exp.toLowerCase()) {
      g.correct++; g.pos++; g.posErr = false;
      g.streak++; g.bestStreak = Math.max(g.bestStreak, g.streak);
      KB.flash(exp, 'hit');
      if (g.pos >= g.items[g.idx].length) {
        completeItem();
      } else {
        Sfx.good(g.streak);
        updateCurrent();
      }
      if (g.streak > 0 && g.streak % 15 === 0) toast('🔥 連續打對 ' + g.streak + ' 個!' + pick(S.theme.cheers || ['好棒!'], g.streak));
    } else {
      if (!g.posErr) {
        g.errors++; g.posErr = true;
        g.errorKeys[exp.toLowerCase()] = (g.errorKeys[exp.toLowerCase()] || 0) + 1;
      }
      g.streak = 0;
      Sfx.bad();
      KB.flash(ch, 'oops');
      var cur = app.querySelector('.obj.current');
      if (cur) { cur.classList.remove('shake'); void cur.offsetWidth; cur.classList.add('shake'); }
    }
    updateHint(); updateStats();
  }

  function completeItem() {
    var g = S.game;
    Sfx.item();
    popCurrent();
    g.idx++; g.pos = 0; g.posErr = false; g.justDone = true;
    updateProgress();
    if (g.idx >= g.items.length) return finishLevel();
    if (g.lv.type !== 'keys' && g.idx % 4 === 0) toast(pick(S.theme.cheers || ['好棒!'], g.idx));
    renderQueue();
  }

  function calcStars(lv, wpm, acc) {
    var target = lv.targetWpm || KT.DEFAULT_TARGET_WPM[lv.type] || 6;
    if (acc >= 95 && wpm >= target) return 3;
    if (acc >= 85) return 2;
    return 1;
  }

  function finishLevel() {
    var g = S.game; g.done = true;
    stopTicker();
    var ms = elapsed(), wpm = calcWpm(g.correct, ms), acc = calcAcc(g);
    var stars = calcStars(g.lv, wpm, acc);
    var rec = Store.recordResult(S.theme.id, g.lv.id, { stars: stars, wpm: wpm, acc: acc, errorKeys: g.errorKeys, chars: g.correct, ms: ms });
    var nextUnlocked = S.li + 1 < S.levels.length && rec.prevStars === 0 && !Store.data.settings.unlockAll;
    S.result = { stars: stars, wpm: wpm, acc: acc, ms: ms, errorKeys: g.errorKeys, newBest: rec.newBest && rec.prevStars > 0,
      unlocked: nextUnlocked, bestStreak: g.bestStreak, lv: g.lv, li: S.li };
    KB.highlight(null);
    Sfx.win(stars);
    setTimeout(renderResult, 650);
  }

  /* ---------- 結果 ---------- */
  function renderResult() {
    var r = S.result, t = S.theme; if (!r || !t) return renderHome();
    show('result');
    S.resultAt = Date.now();
    var msg = r.stars === 3 ? '完美!你是打字小高手!' : r.stars === 2 ? '很棒!再練一次就能拿到 3 顆星!' : '過關了!慢慢來,打對最重要喔!';
    var errs = Object.keys(r.errorKeys).sort(function (a, b) { return r.errorKeys[b] - r.errorKeys[a]; }).slice(0, 5);
    var tip = errs.length
      ? '要多練習的鍵:' + errs.map(function (k) { return '<kbd>' + esc(KB.keyLabel(k)) + '</kbd>'; }).join(' ')
      : '全部一次就打對,太厲害了!🎉';
    var target = r.lv.targetWpm || KT.DEFAULT_TARGET_WPM[r.lv.type] || 6;
    var hasNext = r.li + 1 < S.levels.length;
    app.innerHTML =
      '<section class="screen result">' +
      '<div class="result-card">' +
      '<div class="res-emoji">' + (r.stars === 3 ? '🏆' : t.emoji) + '</div>' +
      '<h2>' + esc(r.lv.title) + ' — ' + msg + '</h2>' +
      '<div class="res-stars">' + [0, 1, 2].map(function (i) {
        return '<span class="bigstar ' + (i < r.stars ? 'on' : 'off') + '" style="animation-delay:' + (0.2 + i * 0.3) + 's">★</span>';
      }).join('') + '</div>' +
      (r.newBest ? '<p class="res-badge">🆕 新紀錄!</p>' : '') +
      (r.unlocked ? '<p class="res-badge">🔓 解鎖第 ' + (r.li + 2) + ' 關:' + esc(S.levels[r.li + 1].title) + '</p>' : '') +
      '<div class="res-stats">' +
      '<div><b>' + r.wpm + '</b><small>速度(字/分)</small></div>' +
      '<div><b>' + r.acc + '%</b><small>準確率</small></div>' +
      '<div><b>' + fmtTime(r.ms) + '</b><small>時間</small></div>' +
      '<div><b>' + r.bestStreak + '</b><small>最多連續打對</small></div>' +
      '</div>' +
      '<p class="res-tip">' + tip + '</p>' +
      '<p class="res-rule">⭐⭐⭐ 三顆星:準確率 95% 以上,而且速度 ' + target + ' 字/分以上 ・ ⭐⭐ 兩顆星:準確率 85% 以上</p>' +
      '<div class="res-btns">' +
      '<button class="btn big" data-act="retry">🔁 再玩一次 <kbd>R</kbd></button>' +
      '<button class="btn big" data-act="map">🗺️ 關卡地圖 <kbd>Esc</kbd></button>' +
      (hasNext ? '<button class="btn big primary" data-act="next">下一關 ➜ <kbd>Enter</kbd></button>' : '<button class="btn big primary" data-act="map">🎉 全部完成!</button>') +
      '</div></div></section>';
  }

  /* ---------- 家長專區 ---------- */
  function renderParent() {
    show('parent');
    applyTheme(null);
    var d = Store.data, totalStars = 0, totalMax = 0, cleared = 0, levelsCount = 0, bestWpm = 0;
    var tables = '';
    themes().forEach(function (t) {
      var rows = '';
      levelsOf(t).forEach(function (lv, i) {
        var p = Store.getLevel(t.id, lv.id);
        totalStars += p.stars; totalMax += 3; levelsCount++;
        if (p.stars > 0) cleared++;
        bestWpm = Math.max(bestWpm, p.bestWpm || 0);
        rows += '<tr class="' + (p.plays ? '' : 'dim') + '"><td>' + (i + 1) + '</td><td>' + esc(KT.STAGES[lv.stage] || '') + '</td><td>' + esc(lv.title) +
          '</td><td class="stars">' + starsHTML(p.stars) + '</td><td>' + (p.plays ? p.bestWpm : '—') + '</td><td>' + (p.plays ? p.bestAcc + '%' : '—') +
          '</td><td>' + (p.plays || 0) + '</td><td>' + fmtDate(p.last) + '</td></tr>';
      });
      var st = themeStars(t);
      tables += '<details class="ptable"' + (tables ? '' : ' open') + '><summary>' + t.emoji + ' ' + esc(t.name) + ' — ⭐ ' + st.got + ' / ' + st.total + '</summary>' +
        '<table><thead><tr><th>關</th><th>階段</th><th>名稱</th><th>星星</th><th>最佳速度</th><th>最佳準確率</th><th>次數</th><th>最後練習</th></tr></thead><tbody>' +
        rows + '</tbody></table></details>';
    });
    var ek = d.keyErrors, keysSorted = Object.keys(ek).sort(function (a, b) { return ek[b] - ek[a]; }).slice(0, 10);
    var last = d.history.length ? d.history[d.history.length - 1].t : 0;
    var recent = d.history.slice(-8).reverse().map(function (h) {
      var t = themes().filter(function (x) { return x.id === h.theme; })[0];
      var lv = t ? levelsOf(t).filter(function (l) { return l.id === h.level; })[0] : null;
      return '<li>' + fmtDate(h.t) + ' ・ ' + (t ? t.emoji + ' ' + esc(t.name) : esc(h.theme)) + ' ・ ' + esc(lv ? lv.title : h.level) +
        ' ・ ' + starsHTML(h.stars) + ' ・ ' + h.wpm + ' 字/分 ・ ' + h.acc + '%</li>';
    }).join('');
    app.innerHTML =
      '<section class="screen parent">' +
      '<div class="topbar"><button class="btn" data-act="home">⬅ 首頁</button><h2>👨‍👩‍👦 家長專區 — ' + esc(kidName()) + ' 的學習進度</h2><div class="spacer"></div></div>' +
      '<div class="parent-body">' +
      '<div class="summary">' +
      '<div><b>⭐ ' + totalStars + ' / ' + totalMax + '</b><small>總星星</small></div>' +
      '<div><b>' + cleared + ' / ' + levelsCount + '</b><small>已過關卡</small></div>' +
      '<div><b>' + d.sessions + '</b><small>練習次數</small></div>' +
      '<div><b>' + Math.round(d.totalMs / 60000) + ' 分</b><small>累計練習時間</small></div>' +
      '<div><b>' + bestWpm + '</b><small>最佳速度(字/分)</small></div>' +
      '<div><b>' + fmtDate(last) + '</b><small>最近練習</small></div>' +
      '</div>' +
      '<div class="pcols"><div class="pbox"><h3>最常打錯的鍵</h3>' +
      (keysSorted.length ? '<div class="errkeys">' + keysSorted.map(function (k) {
        return '<span><kbd>' + esc(KB.keyLabel(k)) + '</kbd><small>' + ek[k] + ' 次</small></span>';
      }).join('') + '</div>' : '<p class="muted">還沒有資料</p>') + '</div>' +
      '<div class="pbox"><h3>最近練習</h3>' + (recent ? '<ul class="recent">' + recent + '</ul>' : '<p class="muted">還沒有資料</p>') + '</div></div>' +
      tables +
      '<div class="pbox"><h3>設定</h3><div class="psettings">' +
      '<button class="btn" data-act="rename">✏️ 更改孩子名字(目前:' + esc(kidName()) + ')</button>' +
      '<button class="btn" data-act="unlockall">' + (d.settings.unlockAll ? '🔓 已解鎖全部關卡(點一下恢復)' : '🔒 解鎖全部關卡') + '</button>' +
      muteBtn() +
      '<button class="btn danger" data-act="reset">🗑️ 重設所有進度</button>' +
      '</div>' + (Store.available ? '' : '<p class="warn">⚠️ 這個瀏覽器無法使用 localStorage,關掉網頁後進度不會保存。</p>') + '</div>' +
      '<div class="pbox tips"><h3>給家長的小建議</h3><ul>' +
      '<li>每天練習 10–15 分鐘,比一次練很久更有效。</li>' +
      '<li>先求「正確」再求「速度」:準確率 95% 以上再挑戰更快。</li>' +
      '<li>提醒孩子眼睛看螢幕、不看鍵盤;手指打完要回到基本列(F、J 有凸點)。</li>' +
      '<li>速度「字/分」= 每分鐘打的英文字數(5 個字母算 1 個字),國小初學者 5–10 字/分就很棒了。</li>' +
      '</ul></div>' +
      '</div></section>';
  }

  /* ---------- 事件 ---------- */
  function act(name, el) {
    Sfx.unlock();
    switch (name) {
      case 'mute':
        Sfx.setMuted(!Sfx.muted);
        Array.prototype.forEach.call(document.querySelectorAll('.btn-mute'), function (b) { b.textContent = Sfx.muted ? '🔇 音效關' : '🔊 音效開'; });
        if (!Sfx.muted) Sfx.click();
        break;
      case 'home': Sfx.click(); renderHome(); break;
      case 'parent': Sfx.click(); renderParent(); break;
      case 'theme': Sfx.click(); renderMap(el.dataset.id); break;
      case 'level':
        var i = +el.dataset.i;
        if (!isUnlocked(S.theme, i)) { Sfx.bad(); toast('🔒 先完成前一關才能玩喔!'); return; }
        Sfx.click(); startLevel(i); break;
      case 'begin': beginGame(); break;
      case 'pause': pauseGame(); break;
      case 'resume': resumeGame(); break;
      case 'restart': startLevel(S.li); break;
      case 'map': renderMap(S.theme && S.theme.id); break;
      case 'retry': startLevel(S.li); break;
      case 'next':
        if (S.li + 1 < S.levels.length) startLevel(S.li + 1); else renderMap(S.theme.id);
        break;
      case 'rename':
        var n = window.prompt('孩子的名字:', kidName());
        if (n && n.trim()) { Store.data.name = n.trim().slice(0, 20); Store.save(); }
        renderParent(); break;
      case 'unlockall': Store.setSetting('unlockAll', !Store.data.settings.unlockAll); renderParent(); break;
      case 'reset':
        if (window.confirm('確定要清除所有星星和練習紀錄嗎?這個動作無法復原。')) { Store.reset(); renderParent(); toast('已重設進度'); }
        break;
    }
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (el) { e.preventDefault(); act(el.dataset.act, el); }
  });

  var CODE_MAP = { Space: ' ', Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=' };
  function normKey(e) {
    var k = e.key;
    if (k && k.length === 1) {
      var cc = k.charCodeAt(0);
      if (cc >= 32 && cc < 127) return k.toLowerCase();
    }
    // 中文輸入法 / 注音鍵盤配置時,改用實體鍵位置判斷
    var c = e.code || '';
    if (/^Key[A-Z]$/.test(c)) return c.charAt(3).toLowerCase();
    if (/^Digit[0-9]$/.test(c)) return c.charAt(5);
    return CODE_MAP[c] || null;
  }

  var imeWarned = false;
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;   // 保留瀏覽器快捷鍵
    var key = e.key;
    if (key === 'Process' || e.keyCode === 229 || e.isComposing) {
      if (!imeWarned && S.screen === 'game') { imeWarned = true; toast('好像開著中文輸入法,請切換成英文(按 Shift)', 2600); }
    }
    var ch = normKey(e);
    if (S.screen === 'game') {
      // 避免空白鍵捲動、' / 開啟尋找、Backspace 回上一頁
      if (ch || key === 'Backspace' || key === 'Tab') e.preventDefault();
      if (e.repeat) return;
      var g = S.game;
      if (key === 'Escape') { if (g && g.paused) renderMap(S.theme.id); else if (g && g.intro) renderMap(S.theme.id); else pauseGame(); return; }
      if (key === 'Enter') { if (g && g.intro) beginGame(); else if (g && g.paused) resumeGame(); return; }
      if (ch) onChar(ch);
      return;
    }
    if (e.repeat) return;
    if (S.screen === 'home') {
      if (/^[1-9]$/.test(key)) { var th = themes()[+key - 1]; if (th) { Sfx.unlock(); Sfx.click(); renderMap(th.id); } }
      else if (key === 'Enter' && themes()[0]) { e.preventDefault(); renderMap(themes()[0].id); }
    } else if (S.screen === 'map') {
      if (key === 'Enter' || key === ' ') { e.preventDefault(); Sfx.unlock(); startLevel(nextPlayable(S.theme)); }
      else if (key === 'Escape') renderHome();
    } else if (S.screen === 'result') {
      if (Date.now() - S.resultAt < 900) { if (key === ' ') e.preventDefault(); return; } // 防止還在打字時誤觸
      if (key === 'Enter' || key === ' ') { e.preventDefault(); act('next'); }
      else if (ch === 'r') act('retry');
      else if (key === 'Escape') act('map');
    } else if (S.screen === 'parent') {
      if (key === 'Escape') renderHome();
    }
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseGame(); });

  // 給測試用的唯讀介面
  KT.debug = {
    state: S,
    expected: function () { return S.game && !S.game.done ? expected() : null; },
    themes: themes, levelsOf: levelsOf
  };

  if (!themes().length) {
    app.innerHTML = '<p style="padding:2rem;font-size:1.5rem">找不到任何主題,請確認 index.html 有載入 themes/ 裡的檔案。</p>';
  } else {
    renderHome();
  }
})();
