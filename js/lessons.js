/*
 * 共同的基礎課程(每個主題都會先有這些關卡),以及主題註冊用的 THEMES 清單。
 * 關卡格式:
 *   { id, stage, type:'keys'|'words'|'sentences', title, tip,
 *     keys:'可出現的鍵', newKeys:'新學的鍵(出現機率較高)', count:題數,
 *     words:[...], sentences:[...], targetWpm:三顆星需要的速度 }
 */
(function () {
  'use strict';
  var KT = window.KT = window.KT || {};
  window.THEMES = window.THEMES || [];

  /* 給主題檔使用的註冊函式(也可以直接 THEMES.push) */
  KT.registerTheme = function (theme) { window.THEMES.push(theme); };

  KT.STAGES = {
    home: '基本列', top: '上排', bottom: '下排', words: '單字', theme: '主題單字', sentence: '短句'
  };

  /* 三顆星需要的速度(WPM,每 5 個字母算 1 個字)— 針對國小初學者設定得比較寬鬆 */
  KT.DEFAULT_TARGET_WPM = { keys: 6, words: 7, sentences: 7 };

  var HOME = 'asdfghjkl;';
  var TOP1 = HOME + 'ei', TOP2 = TOP1 + 'rtyu', TOP3 = TOP2 + 'qwop';
  var BOT1 = TOP3 + 'vbnm', BOT2 = BOT1 + 'cxz,.';

  KT.BASE_LEVELS = [
    { id: 'home-fj', stage: 'home', type: 'keys', title: 'F 和 J', keys: 'fj', newKeys: 'fj', count: 16,
      tip: '摸摸看,F 和 J 上面有小凸點!左手食指放 F,右手食指放 J。' },
    { id: 'home-dk', stage: 'home', type: 'keys', title: 'D 和 K', keys: 'fjdk', newKeys: 'dk', count: 20,
      tip: '中指放在 D 和 K 上面,食指還是在 F、J 喔。' },
    { id: 'home-sl', stage: 'home', type: 'keys', title: 'S 和 L', keys: 'fjdksl', newKeys: 'sl', count: 20,
      tip: '無名指負責 S 和 L。' },
    { id: 'home-a', stage: 'home', type: 'keys', title: 'A 和 ;', keys: 'fjdksla;', newKeys: 'a;', count: 20,
      tip: '小指負責 A 和 ;(分號)。八根手指都回家了!' },
    { id: 'home-gh', stage: 'home', type: 'keys', title: 'G 和 H', keys: HOME, newKeys: 'gh', count: 20,
      tip: '食指往中間伸一下就按到 G 和 H,按完要回到 F、J 喔!' },
    { id: 'home-all', stage: 'home', type: 'keys', title: '基本列大挑戰', keys: HOME, count: 30,
      tip: '眼睛看螢幕,不要偷看鍵盤,你一定可以!' },
    { id: 'home-words', stage: 'home', type: 'words', title: '基本列單字', count: 10,
      words: ['dad', 'sad', 'add', 'ask', 'all', 'fall', 'hall', 'glad', 'flag', 'gas', 'has', 'had', 'half', 'salad', 'flask', 'lad'],
      tip: '只用基本列就能打出英文單字喔!' },
    { id: 'top-ei', stage: 'top', type: 'keys', title: 'E 和 I', keys: TOP1, newKeys: 'ei', count: 24,
      tip: '中指往上伸,就按到 E 和 I。' },
    { id: 'top-rtyu', stage: 'top', type: 'keys', title: 'R T Y U', keys: TOP2, newKeys: 'rtyu', count: 24,
      tip: '食指往上伸:左手 R、T,右手 Y、U。' },
    { id: 'top-qwop', stage: 'top', type: 'keys', title: 'Q W O P', keys: TOP3, newKeys: 'qwop', count: 24,
      tip: '小指按 Q、P,無名指按 W、O。' },
    { id: 'top-words', stage: 'top', type: 'words', title: '上排單字', count: 10,
      words: ['red', 'hat', 'kite', 'fire', 'tree', 'yes', 'top', 'pig', 'egg', 'sky', 'toy', 'you', 'sheep', 'happy', 'water', 'hello', 'pretty', 'tiger'],
      tip: '用基本列和上排來打單字!' },
    { id: 'bot-vbnm', stage: 'bottom', type: 'keys', title: 'V B N M', keys: BOT1, newKeys: 'vbnm', count: 24,
      tip: '食指往下彎:左手 V、B,右手 N、M。' },
    { id: 'bot-cxz', stage: 'bottom', type: 'keys', title: 'C X Z , .', keys: BOT2, newKeys: 'cxz,.', count: 24,
      tip: '中指按 C 和逗號,無名指按 X 和句點,小指按 Z。' },
    { id: 'simple-words', stage: 'words', type: 'words', title: '簡單單字', count: 12,
      words: ['cat', 'dog', 'sun', 'bus', 'box', 'cup', 'zoo', 'van', 'milk', 'book', 'mom', 'ice', 'map', 'jam', 'zip', 'nice', 'come', 'jump', 'bed', 'cake'],
      tip: '全部的字母都學會了,來打單字吧!' }
  ];
})();
