/* 主題:星球(太空) — 一個主題 = 一個檔案。複製這個檔案就能做新主題。 */
KT.registerTheme({
  id: 'space',                 // 英文代號(不可和其他主題重複,進度用它來存)
  name: '星球',                // 主題名稱
  title: '星球探險',           // 關卡地圖上的標題
  emoji: '🪐',
  description: '開著火箭去太空,打掉隕石!',

  // 顏色(CSS 顏色)
  colors: {
    primary: '#7c4dff',        // 主要按鈕顏色
    accent: '#ffd54f',         // 強調色(星星、進度)
    text: '#ffffff',           // 背景上的文字顏色
    panel: 'rgba(22, 20, 70, 0.94)',   // 卡片/面板底色
    panelText: '#ffffff',
    objectBg: '#fff3c4',       // 題目(字母牌)底色
    objectText: '#3a2a00'
  },

  // 背景:任何 CSS background 寫法都可以(這裡用漸層畫星空,不需要圖片)
  background:
    'radial-gradient(circle, rgba(255,255,255,.95) 1px, transparent 2px) 0 0 / 90px 90px,' +
    'radial-gradient(circle, rgba(255,255,255,.6) 1px, transparent 2px) 40px 55px / 130px 130px,' +
    'radial-gradient(circle, rgba(180,200,255,.7) 1.5px, transparent 2.5px) 70px 20px / 210px 210px,' +
    'radial-gradient(ellipse at 80% 110%, #6a3fb5 0%, transparent 55%),' +
    'linear-gradient(180deg, #070b2a 0%, #1b1450 55%, #3a2378 100%)',

  // 背景裝飾(emoji,位置用 %)
  decorations: [
    { emoji: '🪐', x: '4%', y: '10%', size: '5.5rem' },
    { emoji: '🌙', x: '90%', y: '6%', size: '4rem' },
    { emoji: '🛸', x: '86%', y: '42%', size: '3.2rem' },
    { emoji: '🌍', x: '2%', y: '48%', size: '3.5rem' },
    { emoji: '✨', x: '50%', y: '4%', size: '2rem' },
    { emoji: '⭐', x: '72%', y: '14%', size: '1.8rem' }
  ],

  // 題目物件的圖案:keys = 單一字母關卡,words = 單字關卡,sentences = 句子關卡
  objects: {
    keys: ['☄️', '🌑', '☄️', '🪨'],
    words: ['🪐', '🌍', '🌕', '🛰️', '🌟', '👽'],
    sentences: ['👩‍🚀', '🚀', '👨‍🚀']
  },
  hitEffect: '💥',             // 打對時的特效
  runner: '🚀',                // 進度條上跑的角色
  goal: '🪐',                  // 進度條終點
  cheers: ['好厲害!', '火箭加速!', '太空英雄!', '超棒的!', '繼續衝!'],

  // 主題專屬關卡(會接在共同基礎課程後面)
  levels: [
    { id: 'space-words1', stage: 'theme', type: 'words', title: '太空單字 1', count: 10,
      words: ['sun', 'moon', 'star', 'mars', 'sky', 'ship', 'ufo', 'dust', 'ring', 'nova'],
      tip: '太陽 sun、月亮 moon、星星 star、火星 mars!' },
    { id: 'space-words2', stage: 'theme', type: 'words', title: '太空單字 2', count: 10,
      words: ['earth', 'venus', 'comet', 'pluto', 'orbit', 'rocket', 'planet', 'saturn', 'alien', 'space', 'galaxy'],
      tip: '地球 earth、金星 venus、彗星 comet、火箭 rocket!' },
    { id: 'space-sentences', stage: 'sentence', type: 'sentences', title: '太空短句', count: 3,
      sentences: ['The sun is hot.', 'I see the moon.', 'Mars is red.', 'My rocket can fly.',
                  'Look at the stars.', 'Earth is our home.', 'I like space.'],
      tip: '句子裡的空白要用大拇指按空白鍵。大寫字母打小寫也算對喔!' }
  ]
});
