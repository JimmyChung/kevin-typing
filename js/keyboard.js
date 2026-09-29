/* 螢幕鍵盤 + 手指顏色 + 手的提示圖 */
(function () {
  'use strict';
  var KT = window.KT = window.KT || {};

  var FINGERS = {
    Lp: { name: '左手小指',   short: '小指',   color: '#ff8fab' },
    Lr: { name: '左手無名指', short: '無名指', color: '#ffb347' },
    Lm: { name: '左手中指',   short: '中指',   color: '#ffe066' },
    Li: { name: '左手食指',   short: '食指',   color: '#7ed957' },
    T:  { name: '大拇指',     short: '大拇指', color: '#b9a3f0' },
    Ri: { name: '右手食指',   short: '食指',   color: '#7ed957' },
    Rm: { name: '右手中指',   short: '中指',   color: '#ffe066' },
    Rr: { name: '右手無名指', short: '無名指', color: '#ffb347' },
    Rp: { name: '右手小指',   short: '小指',   color: '#ff8fab' }
  };

  var FMAP = {};
  function assign(chars, f) { chars.split('').forEach(function (c) { FMAP[c] = f; }); }
  assign('`1qaz', 'Lp'); assign('2wsx', 'Lr'); assign('3edc', 'Lm'); assign('45rtfgvb', 'Li');
  assign('67yuhjnm', 'Ri'); assign('8ik,', 'Rm'); assign('9ol.', 'Rr'); assign("0p;/'-=[]\\", 'Rp');
  FMAP[' '] = 'T';

  function keys(str) { return str.split('').map(function (c) { return { k: c }; }); }
  var ROWS = [
    [{ l: 'Tab', w: 1.5, f: 'Lp', fn: 1 }].concat(keys('qwertyuiop[]'), [{ k: '\\', w: 1.5 }]),
    [{ l: 'Caps', w: 1.8, f: 'Lp', fn: 1 }].concat(keys("asdfghjkl;'"), [{ l: 'Enter', w: 2.2, f: 'Rp', fn: 1 }]),
    [{ l: 'Shift', w: 2.3, f: 'Lp', fn: 1 }].concat(keys('zxcvbnm,./'), [{ l: 'Shift', w: 2.7, f: 'Rp', fn: 1 }]),
    [{ k: ' ', l: '空白鍵', w: 6.5 }]
  ];

  var keyEls = {}, fingerEls = {}, current = null;

  function fingerOf(ch) { return FMAP[(ch || '').toLowerCase()] || null; }
  function keyLabel(ch) {
    if (ch === ' ') return '空白鍵';
    if (ch === ';') return '; (分號)';
    if (ch === ',') return ', (逗號)';
    if (ch === '.') return '. (句點)';
    return (ch || '').toUpperCase();
  }

  function render(container) {
    keyEls = {};
    container.innerHTML = '';
    container.classList.add('kb');
    ROWS.forEach(function (row) {
      var r = document.createElement('div');
      r.className = 'kb-row';
      row.forEach(function (def) {
        var el = document.createElement('div');
        var f = def.f || FMAP[def.k] || 'Lp';
        el.className = 'key' + (def.fn ? ' fn' : '') + (def.k === ' ' ? ' space' : '');
        el.style.setProperty('--w', def.w || 1);
        el.style.setProperty('--fc', FINGERS[f].color);
        var label = def.l || (def.k ? def.k.toUpperCase() : '');
        el.innerHTML = '<span>' + label + '</span>' + ((def.k === 'f' || def.k === 'j') ? '<i class="bump"></i>' : '');
        if (def.k) { el.dataset.k = def.k; keyEls[def.k] = el; }
        r.appendChild(el);
      });
      container.appendChild(r);
    });
  }

  function handHTML(side) {
    var ids = side === 'L' ? ['Lp', 'Lr', 'Lm', 'Li'] : ['Ri', 'Rm', 'Rr', 'Rp'];
    var h = '<div class="hand-fingers">';
    ids.forEach(function (id) {
      h += '<div class="finger f-' + id.slice(1) + '" data-f="' + id + '" style="--fc:' + FINGERS[id].color + '"></div>';
    });
    h += '</div><div class="palm"><div class="finger thumb" data-f="T" style="--fc:' + FINGERS.T.color + '"></div></div>';
    h += '<div class="hand-label">' + (side === 'L' ? '左手' : '右手') + '</div>';
    return h;
  }

  function renderHands(leftEl, rightEl) {
    fingerEls = {};
    [[leftEl, 'L'], [rightEl, 'R']].forEach(function (p) {
      p[0].className = 'hand hand-' + p[1];
      p[0].innerHTML = handHTML(p[1]);
      Array.prototype.forEach.call(p[0].querySelectorAll('.finger'), function (el) {
        var f = el.dataset.f;
        (fingerEls[f] = fingerEls[f] || []).push(el);
      });
    });
  }

  function highlight(ch) {
    if (current && keyEls[current]) keyEls[current].classList.remove('next');
    Object.keys(fingerEls).forEach(function (f) { fingerEls[f].forEach(function (e) { e.classList.remove('active'); }); });
    current = ch ? ch.toLowerCase() : null;
    if (!current) return;
    if (keyEls[current]) keyEls[current].classList.add('next');
    var f = fingerOf(current);
    if (f && fingerEls[f]) fingerEls[f].forEach(function (e) { e.classList.add('active'); });
  }

  function flash(ch, cls) {
    var el = keyEls[(ch || '').toLowerCase()];
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 350);
  }

  KT.Keyboard = { FINGERS: FINGERS, fingerOf: fingerOf, keyLabel: keyLabel, render: render, renderHands: renderHands, highlight: highlight, flash: flash };
})();
