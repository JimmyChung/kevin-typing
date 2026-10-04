#!/usr/bin/env python3
"""產生打字遊戲的語音檔（edge-tts）。

從 index.html 解析出所有要念的內容：
  - THEMES[].words 的英文單字      -> audio/en/<word>.mp3
  - a–z 26 個字母                  -> audio/letters/<a-z>.mp3
  - THEMES[].cheers 與 RESULT_LINES -> audio/zh/<sha1 前 10 碼>.mp3
並寫出 audio/manifest.json。

只會產生還不存在（或聲音設定改過）的檔案，可以重複執行。

用法：
  python tools/gen_audio.py            # 產生缺少的檔案，列出沒在用的檔案
  python tools/gen_audio.py --prune    # 同上，並刪除沒在用的檔案
  python tools/gen_audio.py --force    # 全部重新產生
  python tools/gen_audio.py --dry-run  # 只列出會做什麼，不連網
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

# ============================================================
# 聲音設定（要換聲音改這裡；改了之後再跑一次，受影響的檔案會自動重做）
# ============================================================
EN_VOICE = "en-US-AnaNeural"        # 小朋友聲音
EN_RATE = "-10%"
ZH_VOICE = "zh-TW-HsiaoYuNeural"    # 台灣口音女聲
ZH_RATE = "+0%"

# 字母念法：單一小寫字母容易被念成別的音（例如 a 念成「呃」），
# 所以傳大寫加句點，例如 "F."
LETTER_TEXT = "{upper}."

# 個別單字的念法修正（key 是 THEMES 裡的單字，value 是實際送去 TTS 的文字）
SAY_AS = {
    "ufo": "U.F.O.",   # 照字母念，不要念成 "oofo"
    "bow": "beau",     # 蝴蝶結的 bow 念 /boʊ/，不是鞠躬的 /baʊ/
}

CONCURRENCY = 4
RETRIES = 3
# ============================================================

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML = ROOT / "index.html"
AUDIO_DIR = ROOT / "audio"
MANIFEST = AUDIO_DIR / "manifest.json"
GEN_CACHE = AUDIO_DIR / ".gen-cache.json"   # 記錄每個檔案是用什麼設定產生的
KIND_DIRS = {"en": "en", "letters": "letters", "zh": "zh"}

WORD_RE = re.compile(r"^[a-z]+$")


@dataclass(frozen=True)
class Item:
    kind: str     # en / letters / zh
    key: str      # manifest 裡的 key：單字、字母、中文句子
    say: str      # 實際送去 TTS 的文字
    voice: str
    rate: str

    @property
    def rel(self) -> str:
        if self.kind == "zh":
            name = hashlib.sha1(self.key.encode("utf-8")).hexdigest()[:10]
        else:
            name = self.key
        return f"audio/{KIND_DIRS[self.kind]}/{name}.mp3"

    @property
    def signature(self) -> str:
        return f"{self.voice}|{self.rate}|{self.say}"


# ---------------- 解析 index.html ----------------

def extract_block(html: str, name: str) -> str:
    m = re.search(rf"/\*\s*{name}-START\s*\*/(.*?)/\*\s*{name}-END\s*\*/", html, re.S)
    if not m:
        raise SystemExit(f"錯誤：index.html 裡找不到 /* {name}-START */ ... /* {name}-END */ 標記")
    return m.group(1)


NODE_JS = r"""
let s='';process.stdin.setEncoding('utf8');
process.stdin.on('data',d=>s+=d).on('end',()=>{
  const r=require('vm').runInNewContext(s+';({themes:THEMES,result:RESULT_LINES})');
  process.stdout.write(JSON.stringify({
    themes:r.themes.map(t=>({id:t.id,words:t.words.map(w=>w[0]),cheers:t.cheers})),
    result:Object.values(r.result)
  }));
});
"""


def parse_with_node(code: str) -> dict:
    out = subprocess.run(["node", "-e", NODE_JS], input=code.encode("utf-8"),
                         capture_output=True, timeout=30, check=True)
    return json.loads(out.stdout.decode("utf-8"))


def parse_with_regex(themes_code: str, lines_code: str) -> dict:
    themes = []
    for chunk in re.split(r"\n\s*\{\s*\n", themes_code)[1:]:
        tid = re.search(r"id\s*:\s*'([^']+)'", chunk)
        cheers = re.search(r"cheers\s*:\s*\[([^\]]*)\]", chunk)
        words = re.findall(r"\[\s*'([^']*)'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*\]", chunk)
        if not (tid and cheers and words):
            raise SystemExit("錯誤：regex 解析 THEMES 失敗，請安裝 Node.js 再試")
        themes.append({"id": tid.group(1), "words": words,
                       "cheers": re.findall(r"'([^']+)'", cheers.group(1))})
    result = re.findall(r"\w+\s*:\s*'([^']+)'", lines_code)
    return {"themes": themes, "result": result}


def load_content() -> dict:
    html = INDEX_HTML.read_text(encoding="utf-8")
    themes_code = extract_block(html, "THEMES")
    lines_code = extract_block(html, "RESULT-LINES")
    if shutil.which("node"):
        try:
            return parse_with_node(themes_code + "\n" + lines_code)
        except (subprocess.SubprocessError, json.JSONDecodeError) as e:
            print(f"⚠️  用 node 解析失敗（{e}），改用 regex")
    else:
        print("⚠️  找不到 node，改用 regex 解析 THEMES")
    return parse_with_regex(themes_code, lines_code)


def build_items(content: dict, en_voice: str, zh_voice: str) -> list[Item]:
    words: dict[str, None] = {}
    zh: dict[str, None] = {}
    for t in content["themes"]:
        for w in t["words"]:
            if not WORD_RE.match(w):
                raise SystemExit(f"錯誤：主題 {t['id']} 的單字 {w!r} 不是純小寫 a–z")
            words[w] = None
        for c in t["cheers"]:
            zh[c] = None
    for line in content["result"]:
        zh[line] = None
    for s in zh:
        if not s or s != s.strip():
            raise SystemExit(f"錯誤：中文句子 {s!r} 是空的或前後有空白")
    if not words or not zh:
        raise SystemExit("錯誤：沒有解析到任何單字或中文句子，請檢查 index.html 的 THEMES 標記")

    items = [Item("en", w, SAY_AS.get(w, w), en_voice, EN_RATE) for w in sorted(words)]
    items += [Item("letters", c, LETTER_TEXT.format(upper=c.upper(), lower=c), en_voice, EN_RATE)
              for c in "abcdefghijklmnopqrstuvwxyz"]
    items += [Item("zh", s, s, zh_voice, ZH_RATE) for s in zh]
    return items


# ---------------- 聲音確認 ----------------

async def resolve_voices() -> tuple[str, str]:
    import edge_tts
    try:
        names = {v["ShortName"] for v in await edge_tts.list_voices()}
    except Exception as e:  # 網路問題時就照設定試試看
        print(f"⚠️  無法取得聲音清單（{e}），直接使用設定的聲音")
        return EN_VOICE, ZH_VOICE

    def pick(wanted: str, prefix: str) -> str:
        if wanted in names:
            return wanted
        alts = sorted(n for n in names if n.startswith(prefix))
        if not alts:
            raise SystemExit(f"錯誤：找不到 {wanted}，也沒有任何 {prefix}* 聲音")
        print(f"⚠️  提醒：找不到聲音 {wanted}，改用 {alts[0]}（請修改 gen_audio.py 上方的設定）")
        return alts[0]

    return pick(EN_VOICE, "en-US-"), pick(ZH_VOICE, "zh-TW-")


# ---------------- 產生 ----------------

async def synth(item: Item, sem: asyncio.Semaphore) -> tuple[Item, bool, str]:
    import edge_tts
    dest = ROOT / item.rel
    tmp = dest.with_suffix(".mp3.tmp")
    last_err = ""
    async with sem:
        for attempt in range(1, RETRIES + 1):
            try:
                await edge_tts.Communicate(item.say, item.voice, rate=item.rate).save(str(tmp))
                if tmp.stat().st_size < 500:
                    raise RuntimeError("產生的檔案太小")
                os.replace(tmp, dest)
                return item, True, ""
            except Exception as e:
                last_err = f"{type(e).__name__}: {e}"
                tmp.unlink(missing_ok=True)
                if attempt < RETRIES:
                    await asyncio.sleep(1.5 * attempt)
    return item, False, last_err


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def write_json_if_changed(path: Path, data: dict) -> bool:
    text = json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    if path.exists() and path.read_bytes() == text.encode("utf-8"):
        return False
    with open(path, "w", encoding="utf-8", newline="\n") as f:   # 固定 LF，避免 Windows 上 diff 一直變
        f.write(text)
    return True


def find_unused(items: list[Item]) -> list[Path]:
    wanted = {(ROOT / i.rel).resolve() for i in items}
    unused = []
    for d in KIND_DIRS.values():
        folder = AUDIO_DIR / d
        if folder.is_dir():
            unused += [p for p in sorted(folder.iterdir())
                       if p.is_file() and p.resolve() not in wanted]
    return unused


async def main() -> int:
    ap = argparse.ArgumentParser(description="用 edge-tts 產生遊戲語音檔")
    ap.add_argument("--prune", action="store_true", help="刪除不再被使用的音檔")
    ap.add_argument("--force", action="store_true", help="全部重新產生")
    ap.add_argument("--dry-run", action="store_true", help="只列出要做的事，不產生檔案")
    args = ap.parse_args()

    content = load_content()
    if args.dry_run:
        en_voice, zh_voice = EN_VOICE, ZH_VOICE
    else:
        en_voice, zh_voice = await resolve_voices()
    items = build_items(content, en_voice, zh_voice)
    print(f"聲音：英文 {en_voice}（{EN_RATE}）／中文 {zh_voice}（{ZH_RATE}）")
    print(f"內容：{sum(i.kind == 'en' for i in items)} 個單字、26 個字母、"
          f"{sum(i.kind == 'zh' for i in items)} 句中文")

    if not args.dry_run:
        for d in KIND_DIRS.values():
            (AUDIO_DIR / d).mkdir(parents=True, exist_ok=True)

    cache = read_json(GEN_CACHE)
    todo, skipped = [], 0
    for it in items:
        dest = ROOT / it.rel
        exists = dest.is_file() and dest.stat().st_size > 0
        if exists and not args.force and cache.get(it.rel, it.signature) == it.signature:
            skipped += 1
        else:
            todo.append(it)

    created, failed = 0, []
    if args.dry_run:
        for it in todo:
            print(f"  會產生 {it.rel}  ←  {it.say!r}")
    elif todo:
        sem = asyncio.Semaphore(CONCURRENCY)
        for n, fut in enumerate(asyncio.as_completed([synth(i, sem) for i in todo]), 1):
            it, ok, err = await fut
            if ok:
                created += 1
                cache[it.rel] = it.signature
                print(f"  [{n}/{len(todo)}] ✅ {it.rel}  ←  {it.say}")
            else:
                failed.append(it)
                print(f"  [{n}/{len(todo)}] ❌ {it.rel}  ←  {it.say}  ({err})")

    # 已存在但沒有紀錄的檔案，補上目前的設定
    for it in items:
        if (ROOT / it.rel).is_file():
            cache.setdefault(it.rel, it.signature)

    manifest: dict[str, dict[str, str]] = {k: {} for k in KIND_DIRS}
    for it in items:
        if (ROOT / it.rel).is_file():
            manifest[it.kind][it.key] = it.rel

    unused = find_unused(items)
    if not args.dry_run:
        wanted = {i.rel for i in items}
        cache = {k: v for k, v in cache.items() if k in wanted}
        write_json_if_changed(GEN_CACHE, cache)
        if write_json_if_changed(MANIFEST, manifest):
            print(f"已更新 {MANIFEST.relative_to(ROOT).as_posix()}")

    if unused:
        verb = "刪除" if args.prune and not args.dry_run else "沒在用（加 --prune 刪除）"
        print(f"\n{len(unused)} 個檔案{verb}：")
        for p in unused:
            print(f"  {p.relative_to(ROOT).as_posix()}")
            if args.prune and not args.dry_run:
                p.unlink()

    print(f"\n統計：新增 {created}／略過 {skipped}／失敗 {len(failed)}"
          + (f"／待產生 {len(todo)}" if args.dry_run else ""))
    if failed:
        print("失敗的項目會在遊戲中改用瀏覽器內建語音；再執行一次腳本會重試。")
    return 1 if failed else 0


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    sys.exit(asyncio.run(main()))
