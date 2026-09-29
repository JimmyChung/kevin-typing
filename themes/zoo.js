/* 主題:動物園 */
KT.registerTheme({
  id: 'zoo',
  name: '動物園',
  title: '動物園大冒險',
  emoji: '🦁',
  description: '幫動物朋友舉牌子,一起逛動物園!',

  colors: {
    primary: '#ff8a3d',
    accent: '#ffcc00',
    text: '#1f3b12',
    panel: 'rgba(255, 255, 255, 0.88)',
    panelText: '#2d3a1f',
    objectBg: '#ffffff',
    objectText: '#5a3200'
  },

  background:
    'radial-gradient(circle at 12% 18%, rgba(255,255,255,.9) 0 26px, transparent 27px),' +
    'radial-gradient(circle at 16% 16%, rgba(255,255,255,.9) 0 34px, transparent 35px),' +
    'radial-gradient(ellipse at 50% 100%, #5fb33e 0%, transparent 60%),' +
    'linear-gradient(180deg, #7fd0ff 0%, #bfe9ff 52%, #a6e27f 52%, #72c74b 100%)',

  decorations: [
    { emoji: '☀️', x: '90%', y: '4%', size: '4.5rem' },
    { emoji: '☁️', x: '60%', y: '6%', size: '3.5rem' },
    { emoji: '🌳', x: '1%', y: '38%', size: '5rem' },
    { emoji: '🌴', x: '91%', y: '36%', size: '4.5rem' },
    { emoji: '🌻', x: '6%', y: '62%', size: '2.2rem' },
    { emoji: '🎈', x: '30%', y: '8%', size: '2.4rem' }
  ],

  objects: {
    keys: ['🐶', '🐱', '🐰', '🐻', '🐼', '🐨', '🐯', '🦊', '🐸', '🐵'],
    words: ['🦁', '🦒', '🐘', '🦓', '🐒', '🦛', '🐧', '🦜'],
    sentences: ['🧑‍🌾', '🦁', '🐼']
  },
  hitEffect: '💖',
  runner: '🚌',
  runnerFlip: true,           // 角色圖案面向左邊時設 true,讓它往右跑
  goal: '🎪',
  cheers: ['好棒喔!', '動物們在拍手!', '你好厲害!', '太讚了!', '加油加油!'],

  levels: [
    { id: 'zoo-words1', stage: 'theme', type: 'words', title: '動物單字 1', count: 10,
      words: ['cat', 'dog', 'pig', 'cow', 'fox', 'owl', 'bear', 'lion', 'frog', 'duck', 'goat', 'seal'],
      tip: '貓 cat、狗 dog、獅子 lion、熊 bear!' },
    { id: 'zoo-words2', stage: 'theme', type: 'words', title: '動物單字 2', count: 10,
      words: ['tiger', 'zebra', 'panda', 'koala', 'horse', 'monkey', 'rabbit', 'turtle', 'parrot', 'snake', 'camel'],
      tip: '老虎 tiger、斑馬 zebra、熊貓 panda、猴子 monkey!' },
    { id: 'zoo-sentences', stage: 'sentence', type: 'sentences', title: '動物短句', count: 3,
      sentences: ['I like pandas.', 'The lion is big.', 'A duck can swim.', 'The monkey is funny.',
                  'I see a tiger.', 'Cats can jump.', 'The zebra runs fast.'],
      tip: '句子裡的空白要用大拇指按空白鍵。大寫字母打小寫也算對喔!' }
  ]
});
