# Kevin 的打字大冒險 — 專案交接

> 給 Claude Code 的專案說明。放在 repo 根目錄，Claude Code 會自動讀取。
> 第 1～4 節是長期有效的專案背景，第 5 節是語音功能的規格（已完成，留作參考），第 6 節是之後可能的工作。

## 1. 專案概要

- 給國小三年級（Kevin）電腦課練**英文打字**的網頁遊戲，主題化、遊戲化。
- 使用環境：**平板＋實體鍵盤**（iPad Safari／Android Chrome），也要能在一般電腦瀏覽器玩。
- 部署：**GitHub Pages**，靜態檔案，沒有後端、沒有 build 流程。
- 介面語言：**繁體中文（台灣用語）**；遊戲內容是英文字母與英文單字。

## 2. 檔案結構（目前）

```
index.html             # 整個遊戲：HTML + CSS + JS 都在這一個檔案
CLAUDE.md              # 本文件
audio/                 # gen_audio.py 產生的語音檔與 manifest.json（.gen-cache.json 記錄產生時的聲音設定）
tools/gen_audio.py     # 產生語音：python tools/gen_audio.py [--prune] [--force] [--dry-run]
tools/build_single.py  # 打包成 dist/index.single.html（音檔 inline）
tools/requirements.txt
```

外部資源只有 Google Fonts（Fredoka、Noto Sans TC），其餘都是 inline。
本機測試語音要用 http server（例如 `python -m http.server`），直接開 `file://` 會讀不到 manifest，改用瀏覽器內建語音。

## 3. index.html 架構重點

**資料設定（檔案中 `<script>` 開頭）**
- `THEMES`：主題陣列。每個主題的欄位：
  - `id`（進度存檔用的 key，**改了會讓已存的進度消失**）、`name`、`icon`、`tagline`
  - `bg`、`ground`、`textOnBg`、`accent`：視覺設定
  - `decor`（地面裝飾）、`skyDecor`（背景裝飾）、`carriers`（字母關掉落物）、`particles`（打中時的粒子）
  - `cheers`：中文鼓勵語，連擊 5 的倍數時顯示
  - `words`：`[英文單字, emoji, 中文]`，英文**只用小寫 a–z**
- 目前的主題：`space` 星球探險、`zoo` 動物園、`ocean` 海底世界、`plane` 飛機環遊世界、`ice` 冰雪公主、`unicorn` 彩虹獨角獸、
  `bunny` 白兔班、`spider` 蜘蛛小英雄、`race` 賽車大賽、`snowwhite` 白雪公主、`butterfly` 蝴蝶花園。
- `LEVELS`：9 關，所有主題共用。關卡分兩種：
  - `type:'letters'`：練字母，用 `keys` 指定要練的鍵。
  - `type:'words'`：練單字，用 `maxLen` 限制單字長度（第 8 關 ≤4 字母，第 9 關全部）。
- `SPEEDS`：慢／普通／挑戰，對應掉落時間的倍率。`FINGERS`、`KEY_FINGER`：指法顏色。

**主要函式流程**
- `renderHome()` → `openTheme(i)` → `startLevel(li)` → `countdown()` → `loop()`（requestAnimationFrame）
- `spawn()` 產生一個掉落目標（同時只有一個）→ `handleChar(ch)` 處理按鍵 → 打完呼叫 `hit()`，掉到地上呼叫 `miss()` → `next()` → 全部完成呼叫 `endGame(win)`
- `togglePause()`、`cleanupGame()`；`visibilitychange` 時自動暫停。
- 音效：`beep()` / `chord()` 用 WebAudio 合成，受 `settings.sound` 控制。
- 語音：`voice` 模組（`voice.say(kind,key)`／`sayAll()`／`stop()`／`preload()`），受 `settings.voice` 控制。
  用 WebAudio 播 mp3（會自動裁掉前後靜音），沒有檔案時改用 `speechSynthesis`。
  `THEMES` 與 `RESULT_LINES` 前後有 `/* XXX-START */`、`/* XXX-END */` 標記，`gen_audio.py` 靠它解析，**不要刪掉**。
  `tools/gen_audio.py` 裡的 `SAY_AS` 可以修正個別單字的念法（例如 `bow` 送 `beau`）。

**存檔（localStorage，所有讀寫都包 try/catch）**
- `kevin-typing-progress-v1`：`{ [themeId]: { [levelIndex]: stars } }`
- `kevin-typing-settings-v1`：`{ speed, sound, voice }`（`voice` 預設 `true`）
- **不要改這兩個 key 的名稱**，否則 Kevin 已經拿到的星星會不見。要新增設定欄位，請沿用同一個 key 並給預設值。

**規則**
- 解鎖：前一關至少 1 顆星。
- 星星：正確率 ≥95% 且沒漏接 → 3 顆；正確率 ≥85% 且最多漏接 1 個 → 2 顆；其他過關 → 1 顆。
- 5 顆愛心，漏接一個扣一顆；打錯字不扣愛心，只影響正確率。

## 4. 開發原則

- **維持零 build**：不引入框架、bundler 或 npm 相依套件；Python／Node 腳本只用於離線產生素材。
- **主題不能使用有版權的角色或品牌**（例如迪士尼角色名稱、外觀特徵）。風格可以參考，但名稱、角色都要原創或通用。
- 介面要是大字、高對比、適合觸控；手機與平板的 safe-area 處理已寫好，請保留。
- 版面要在手機橫拿（高度約 390px）時不用捲動也看得到整個螢幕鍵盤：CSS 的 `@media (max-height:480px)` 是這個用途，改版面時記得一起調。
- 新增主題：在 `THEMES` 加一個區塊即可，單字 10～14 個，其中至少 4 個 ≤4 個字母（第 8 關要用到）。
- 每次修改後，至少用桌面瀏覽器跑過一個字母關和一個單字關。

## 5. 語音功能（單字發音／字母念法／中文鼓勵）— 已完成（2026-10-04）

以下是當初的規格，留作參考。2026-10-07 檢查結果：`audio/manifest.json` 與 11 個主題的單字、26 個字母、鼓勵語和結算語句完全對得上，沒有缺檔或多餘檔案；桌面瀏覽器實際跑過字母關與單字關，語音檔會正常載入，沒有錯誤。

### 5.1 目標
- 單字關：目標出現時念出英文單字。
- 字母關：目標出現時念出字母名稱（例如 "F"）。
- 連擊 5 的倍數時用中文念鼓勵語（只念 `theme.cheers` 裡的句子，不念「連擊 N」）。
- 結算畫面念結果：`過關了！`、`很棒喔！`、`完美！超厲害！`、`差一點點！再試一次`、`下一關解鎖了！`、`新紀錄！`。

### 5.2 做法：預先產生音檔
用 **edge-tts**（Python，免費、不需要 API key）產生 mp3，放進 repo 的 `audio/` 資料夾。

**`tools/gen_audio.py` 規格**
- 從 `index.html` 解析出所有內容：`THEMES[].words` 的英文單字、`THEMES[].cheers`、a–z 26 個字母、5.1 列出的結算語句。
  - 建議在 `THEMES` 前後加上註解標記 `/* THEMES-START */`、`/* THEMES-END */`，方便解析（可以用 `node -e` 把那段 eval 成 JSON，或用穩健的 regex）。
- **只產生還不存在的檔案**（可重複執行），並刪除或列出不再被使用的檔案（預設只列出，加 `--prune` 才刪除）。
- 輸出結構：
  ```
  audio/en/<word>.mp3          # 英文單字
  audio/letters/<a-z>.mp3      # 字母名稱
  audio/zh/<hash>.mp3          # 中文句子；hash = sha1(文字) 取前 10 碼
  audio/manifest.json          # { en:{word:path}, letters:{a:path}, zh:{文字:path} }
  ```
- 聲音設定放在腳本最上面，方便日後更換：
  - 英文：小朋友聲音的 en-US voice（例如 `en-US-AnaNeural`），語速 `-10%`。
  - 中文：台灣口音女聲（例如 `zh-TW-HsiaoYuNeural` 或 `zh-TW-HsiaoChenNeural`）。
  - 實際的 voice 名稱要先用 `edge-tts --list-voices` 確認，找不到的話改用同語系的其他聲音，並在執行輸出中印出提醒。
- 字母念法：直接傳單一字母可能念得怪，可以改傳 "F." 或大寫字母，試聽後選念起來最清楚的方式。
- 並行數量要限制（例如 4 個），失敗要重試，最後印出統計（新增／略過／失敗的數量）。

**`tools/build_single.py`（選用）**
- 把 `index.html` 與 `audio/manifest.json` 引用到的所有 mp3 轉成 data URI，inline 成 `dist/index.single.html`，做出一個完全獨立的單一檔案（給 claude.ai artifact 等不能放資料夾的地方用）。
- inline 版用 `window.AUDIO_INLINE = {...manifest，路徑換成 data URI}`，遊戲程式優先讀這個物件。

### 5.3 遊戲端（index.html）修改
- 新增 `settings.voice`（預設 `true`），存在同一個 `kevin-typing-settings-v1` 裡；首頁設定區加一個「🗣️ 發音開／關」按鈕，**跟音效開關分開**。
- 讀取 manifest 的順序：先找 `window.AUDIO_INLINE`，沒有就 `fetch('audio/manifest.json')`；失敗時（例如直接開 `file://`）要能靜默降級。
- **預載**：`startLevel()` 時預先載入本主題的單字音檔、本關會用到的字母，以及中文句子。
- 播放：
  - 同一時間只播一段語音，新的語音會中斷舊的（音效 `beep` 不受影響，可以同時響）。
  - iOS 必須在使用者手勢之後才能播放：在第一次 click／keydown 時解鎖（播放一段極短的靜音或 resume AudioContext）。
  - 暫停、離開關卡、`cleanupGame()` 時要停止語音。
  - 語音延遲不能拖慢遊戲：播放失敗只記錄在 console，不能丟出例外打斷 `spawn()` 或 `handleChar()`。
- **備援**：manifest 裡沒有對應檔案時，改用 `speechSynthesis`（英文 `en-US`、rate 0.85；中文 `zh-TW`），找不到可用的聲音就不出聲。這樣新增主題但還沒跑腳本時，也有聲音可聽。
- 觸發時機：
  - `spawn()`：單字關念單字；字母關念字母。
  - `hit()`：連擊為 5 的倍數時，念目前顯示的那句 cheer（要跟畫面上的文字一致）。
  - `endGame()`：念標題，延遲約 0.6 秒，避開過關音效。

### 5.4 驗收清單
- [x] `python tools/gen_audio.py` 第一次執行會產生所有檔案（音檔都在 repo 裡）；重跑時略過已存在的檔案（2026-10-07 未重新執行驗證）。
- [ ] 在 THEMES 新增一個單字後再跑腳本，只會產生那一個檔案。
- [x] 所有主題（現在 11 個）的單字與字母都有對應音檔，沒有錯字或漏字（逐一核對 manifest 與檔案；實際發音沒有逐一試聽）。
- [x] 「🗣️ 發音」關掉後完全沒有語音，音效開關各自獨立。
- [ ] 刪掉某個 mp3 後，該字會改用 speechSynthesis 念出，遊戲不會壞掉。
- [ ] iPad Safari＋實體鍵盤：第一次點螢幕之後就有聲音；切換到其他 App 再回來時遊戲已暫停、語音已停止。
- [x] 原本的進度（星星）在更新後仍然保留（存檔 key 沒有改）。
- [ ] 若有做 `build_single.py`：`dist/index.single.html` 直接打開就能玩，而且有語音。

### 5.5 完成後的 repo 結構
```
index.html
CLAUDE.md
audio/
  manifest.json
  en/  letters/  zh/
tools/
  gen_audio.py
  build_single.py      # 選用
  requirements.txt     # edge-tts
dist/                  # 加進 .gitignore，或只在需要時產生
```

## 6. 之後可能的工作（還沒做）
- 新增主題（恐龍、交通工具……），流程：改 `THEMES` → 跑 `gen_audio.py` → push。
- 句子關卡（包含空白鍵）。
- 中文鼓勵語改用 Gemini TTS 錄得更生動（Gemini 要用 AI Studio 的 API key，**key 不要 commit 進 repo**）。
