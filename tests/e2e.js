/* 自動測試:node tests/e2e.js  (需要 playwright-core 與 Chrome/Chromium)
 * 環境變數:CHROME=瀏覽器路徑, BASE=http://127.0.0.1:8765/ */
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'screenshots');
const BASE = process.env.BASE || 'http://127.0.0.1:8765/';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

const errors = [];
function assert(c, m) { if (!c) throw new Error('ASSERT: ' + m); console.log('  ✔ ' + m); }

async function typeLevel(page, { stopAfter = Infinity, mistakes = 0 } = {}) {
  let n = 0;
  while (n < stopAfter) {
    const exp = await page.evaluate(() => KT.debug.expected());
    if (exp == null) break;
    if (mistakes > 0 && n % 5 === 2) { await page.keyboard.press(exp === 'q' ? 'w' : 'q'); mistakes--; }
    const key = exp === ' ' ? 'Space' : exp;
    await page.keyboard.press(key);
    await page.waitForTimeout(process.env.FAST ? 25 : 140 + Math.random() * 120);
    n++;
  }
  return n;
}

async function startLevel(page, idx) {
  await page.click(`.lvl[data-i="${idx}"]`, { force: true });
  await page.waitForSelector('#overlay.show');
  await page.keyboard.press('Space');
  await page.waitForSelector('#overlay:not(.show)', { state: 'attached' });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('requestfailed', r => errors.push('[requestfailed] ' + r.url()));

  console.log('HTTP: ' + BASE);
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.theme-card');
  assert((await page.$$('.theme-card')).length === 2, '首頁顯示 2 個主題');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, '01-home.png') });

  for (const theme of ['space', 'zoo']) {
    console.log('主題 ' + theme);
    await page.click(`.theme-card[data-id="${theme}"]`);
    await page.waitForSelector('.map-grid');
    assert((await page.$$('.lvl')).length === 17, '17 個關卡');
    assert(await page.$eval('.lvl[data-i="1"]', e => e.classList.contains('locked')), '第 2 關一開始是鎖住的');
    if (theme === 'space') { await page.waitForTimeout(300); await page.screenshot({ path: path.join(SHOTS, '02-space-map.png') }); }
    // 第 1 關完整打完(含 2 個錯誤)
    await startLevel(page, 0);
    if (theme === 'space') {
      await typeLevel(page, { stopAfter: 7, mistakes: 1 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOTS, '03-space-level1-home-row.png') });
    }
    await typeLevel(page, { mistakes: 2 });
    await page.waitForSelector('.result-card', { timeout: 5000 });
    const stars = await page.$$eval('.bigstar.on', a => a.length);
    assert(stars >= 1 && stars <= 3, `第 1 關結束,得到 ${stars} 顆星`);
    const saved = await page.evaluate(t => JSON.parse(localStorage.getItem('kevinTyping.progress.v1')).progress[t]['home-fj'], theme);
    assert(saved && saved.stars === stars, 'localStorage 已儲存星星');
    await page.waitForTimeout(1000);
    if (theme === 'zoo') await page.screenshot({ path: path.join(SHOTS, '06-result.png') });
    // 按 Enter 進第 2 關 → 確認已解鎖,打完
    await page.keyboard.press('Enter');
    await page.waitForSelector('#overlay.show');
    await page.keyboard.press('Space');
    await typeLevel(page);
    await page.waitForSelector('.result-card');
    assert(true, '第 2 關(D 和 K)也能完成');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForSelector('.map-grid');
    assert(!(await page.$eval('.lvl[data-i="2"]', e => e.classList.contains('locked'))), '第 3 關已解鎖');
    await page.click('[data-act="home"]');
    await page.waitForSelector('.theme-card');
  }

  // 家長專區:解鎖全部,之後玩主題關卡
  await page.click('[data-act="parent"]');
  await page.waitForSelector('.parent-body');
  await page.click('[data-act="unlockall"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '07-parent.png'), fullPage: true });
  await page.click('[data-act="home"]');

  // 星球:主題單字 2 進行中 + 太空句子完整
  await page.keyboard.press('1');
  await page.waitForSelector('.map-grid');
  await startLevel(page, 15);
  await typeLevel(page, { stopAfter: 13, mistakes: 1 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(SHOTS, '04-space-level-words.png') });
  await typeLevel(page);
  await page.waitForSelector('.result-card');
  assert(true, '星球「太空單字 2」完成');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter'); // 下一關:句子
  await page.waitForSelector('#overlay.show');
  await page.keyboard.press('Space');
  await typeLevel(page, { stopAfter: 9 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '04b-space-sentence.png') });
  await typeLevel(page);
  await page.waitForSelector('.result-card');
  assert(true, '星球「太空短句」完成');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.click('[data-act="home"]');

  // 動物園:動物單字 1 進行中並完成
  await page.keyboard.press('2');
  await page.waitForSelector('.map-grid');
  await startLevel(page, 14);
  await typeLevel(page, { stopAfter: 5 });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(SHOTS, '05-zoo-level-words.png') });
  // 暫停/繼續測試
  await page.keyboard.press('Escape');
  await page.waitForSelector('#overlay.show');
  await page.keyboard.press('Space');
  await page.waitForSelector('#overlay:not(.show)', { state: 'attached' });
  await typeLevel(page);
  await page.waitForSelector('.result-card');
  assert(true, '動物園「動物單字 1」完成(含暫停/繼續)');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.waitForSelector('.map-grid');
  await startLevel(page, 16);
  await typeLevel(page, { stopAfter: 6 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS, '05b-zoo-sentence.png') });
  await typeLevel(page);
  await page.waitForSelector('.result-card');
  assert(true, '動物園「動物短句」完成');

  // 音效開關
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await page.click('[data-act="mute"]');
  assert(await page.evaluate(() => JSON.parse(localStorage.getItem('kevinTyping.progress.v1')).settings.muted === true), '靜音設定已儲存');

  // file:// 離線測試
  console.log('file://');
  const fpage = await ctx.newPage();
  fpage.on('console', m => { if (m.type() === 'error') errors.push(`[file:// console] ${m.text()}`); });
  fpage.on('pageerror', e => errors.push('[file:// pageerror] ' + e.message));
  await fpage.goto('file://' + path.join(ROOT, 'index.html'));
  await fpage.waitForSelector('.theme-card');
  await fpage.click('.theme-card[data-id="zoo"]');
  await fpage.waitForSelector('.lvl');
  await startLevel(fpage, 0);
  await typeLevel(fpage);
  await fpage.waitForSelector('.result-card');
  assert(true, 'file:// 開啟可以玩完第 1 關');

  // 小螢幕(iPad 橫向 1024x768 扣掉瀏覽器列)排版檢查
  const small = await browser.newPage({ viewport: { width: 1024, height: 700 } });
  await small.goto(BASE);
  await small.click('.theme-card[data-id="space"]');
  await small.click(".lvl[data-i=\"0\"]", { force: true });
  await small.keyboard.press('Space');
  await small.waitForTimeout(300);
  const overflow = await small.evaluate(() => document.querySelector('.hint').getBoundingClientRect().bottom <= window.innerHeight + 1);
  assert(overflow, '1024x700 時整個遊戲畫面放得下');
  await small.screenshot({ path: path.join(SHOTS, '08-ipad-1024x700.png') });

  await browser.close();
  console.log('\nConsole errors/warnings: ' + errors.length);
  errors.forEach(e => console.log('  ' + e));
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); console.log(errors); process.exit(2); });
