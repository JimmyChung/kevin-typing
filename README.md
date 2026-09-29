# ⌨️ Kevin 的打字冒險

給國小三年級初學者的英文打字練習遊戲。全部是靜態檔案,**不用安裝、不用網路**。

## 怎麼開始

- **最簡單**:直接用瀏覽器(Chrome / Edge / Safari)打開 `index.html` 就可以玩(離線也可以)。
- 也可以放到任何網站空間,或在這個資料夾執行 `python3 -m http.server`,再打開 `http://localhost:8000`。
- 建議:平板(iPad / Android)**接實體鍵盤、橫向**使用;筆電也可以。遊戲不使用輸入框,所以不會跳出螢幕鍵盤。
- 如果電腦開著注音輸入法,遊戲會自動用「實體按鍵位置」判斷,但還是建議切換成英文輸入。

## 操作方式

| 畫面 | 鍵盤 | 觸控/滑鼠 |
|---|---|---|
| 首頁 | 按 `1`、`2` 選主題 | 點主題卡片 |
| 關卡地圖 | `Enter` 玩下一個該玩的關卡、`Esc` 回首頁 | 點關卡 |
| 遊戲中 | `空白鍵` 開始、`Esc` 暫停 | 點「暫停」 |
| 結果 | `Enter` 下一關、`R` 再玩一次、`Esc` 回地圖 | 點按鈕 |

## 關卡(每個主題都有 17 關)

前 14 關是共同的基礎課程(`js/lessons.js`),後 3 關是主題專屬(在主題檔裡):

| # | 階段 | 關卡 |
|---|---|---|
| 1 | 基本列 | F 和 J |
| 2 | 基本列 | D 和 K |
| 3 | 基本列 | S 和 L |
| 4 | 基本列 | A 和 ; |
| 5 | 基本列 | G 和 H |
| 6 | 基本列 | 基本列大挑戰 |
| 7 | 基本列 | 基本列單字(dad, sad, flag…) |
| 8 | 上排 | E 和 I |
| 9 | 上排 | R T Y U |
| 10 | 上排 | Q W O P |
| 11 | 上排 | 上排單字(red, kite, tree…) |
| 12 | 下排 | V B N M |
| 13 | 下排 | C X Z , . |
| 14 | 單字 | 簡單單字(cat, bus, jump…) |
| 15 | 主題單字 | 3–4 個字母(星球:sun, moon… / 動物園:cat, lion…) |
| 16 | 主題單字 | 5–6 個字母(星球:planet, rocket… / 動物園:tiger, monkey…) |
| 17 | 短句 | 主題短句(The sun is hot. / I like pandas.) |

- 完成一關(至少 1 顆星)就會解鎖下一關。
- ⭐⭐⭐:準確率 95% 以上**而且**速度達標(字母關 6 字/分、單字與句子關 7 字/分);⭐⭐:準確率 85% 以上;⭐:完成。
- 同一個字打錯很多次只算一次錯;大寫字母打小寫也算對(不需要按 Shift)。
- 打錯時只會輕輕搖一下、發出很小的提示音,並提示正確的鍵和手指。

## 家長專區

首頁按「👨‍👩‍👦 家長專區」可以看到:總星星、每關星星/最佳速度/準確率/次數、最常打錯的鍵、最近練習紀錄。
也可以更改孩子名字、解鎖全部關卡、開關音效、重設進度。
進度存在瀏覽器的 localStorage(換瀏覽器或清除網站資料會不見)。

---

## 🧩 如何新增主題(只要 2 步)

1. 複製 `themes/space.js`,改名成例如 `themes/ocean.js`,修改裡面的內容。
2. 打開 `index.html`,在「主題」那一區加一行:
   ```html
   <script src="themes/ocean.js"></script>
   ```
完成!首頁會自動出現新主題(按鍵 `3` 也能選)。不需要改其他任何程式。

### 主題檔欄位說明

```js
KT.registerTheme({
  id: 'ocean',              // 英文代號,不可和其他主題重複(進度用它存)
  name: '海洋',             // 主題名稱
  title: '海底大探險',      // 地圖標題
  emoji: '🐳',              // 代表圖案
  description: '潛到海底和魚兒一起打字!',
  colors: {
    primary: '#0288d1',     // 按鈕顏色
    accent: '#ffd54f',      // 強調色(目前題目的外框)
    text: '#ffffff',        // 背景上的文字顏色
    panel: 'rgba(0,40,80,.9)', panelText: '#ffffff',   // 上方列/卡片
    objectBg: '#e1f5fe', objectText: '#01579b'         // 題目牌子
  },
  background: 'linear-gradient(#4fc3f7, #01579b)',     // 任何 CSS background 寫法
  decorations: [ { emoji: '🐠', x: '5%', y: '20%', size: '4rem' } ],  // 背景裝飾
  objects: {                // 題目上方的圖案(會輪流出現)
    keys: ['🫧', '🐚'], words: ['🐟', '🐙', '🦀'], sentences: ['🧜‍♀️']
  },
  hitEffect: '💦',          // 打對時的特效
  runner: '🐢', runnerFlip: false, goal: '🏝️',          // 進度條角色與終點
  cheers: ['好棒!', '游得好快!'],                        // 鼓勵的話
  // useBaseLevels: false,  // 若不想要共同的 14 關基礎課程,設為 false
  levels: [                 // 主題專屬關卡(接在基礎課程後面)
    { id: 'ocean-words1', stage: 'theme', type: 'words', title: '海洋單字', count: 10,
      words: ['fish', 'crab', 'shark', 'whale'], tip: '魚 fish、螃蟹 crab!' },
    { id: 'ocean-sent', stage: 'sentence', type: 'sentences', title: '海洋短句', count: 3,
      sentences: ['I see a fish.', 'The whale is big.'] }
  ]
});
```

關卡種類 `type`:
- `'keys'`:單一字母,要給 `keys`(會出現的鍵)、可選 `newKeys`(新鍵,出現機率較高)、`count`(題數)。
- `'words'`:單字,給 `words` 陣列與 `count`(建議只用小寫字母)。
- `'sentences'`:句子,給 `sentences` 陣列與 `count`(建議只用字母、空白、逗號、句點)。
- 可選 `targetWpm`:三顆星需要的速度。`stage` 可用 `home / top / bottom / words / theme / sentence`。
- 注意:關卡 `id` 改了之後,那一關的舊紀錄就不會顯示。

## 檔案結構

```
index.html          入口(用一般 <script> 載入,file:// 也能用)
css/style.css       樣式
js/storage.js       進度儲存(localStorage)
js/audio.js         Web Audio 合成音效(沒有音效檔)
js/keyboard.js      螢幕鍵盤、手指顏色、手的圖
js/lessons.js       共同基礎課程 + 主題註冊
js/app.js           畫面與遊戲邏輯、家長專區
themes/space.js     主題:星球
themes/zoo.js       主題:動物園
tests/e2e.js        自動測試(開發用,需要 Node + playwright-core + Chrome)
```

手指顏色:小指=粉紅、無名指=橘、中指=黃、食指=綠、大拇指=紫。
