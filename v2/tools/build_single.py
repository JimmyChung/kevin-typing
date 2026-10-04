#!/usr/bin/env python3
"""把 index.html 和 audio/manifest.json 引用的 mp3 打包成單一檔案 dist/index.single.html。

音檔轉成 data URI，放進 window.AUDIO_INLINE（格式同 manifest，路徑換成 data URI），
遊戲會優先讀這個物件。給 claude.ai artifact 等不能放資料夾的地方用。

用法：
  python tools/gen_audio.py        # 先確認音檔是最新的
  python tools/build_single.py
"""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_HTML = ROOT / "index.html"
MANIFEST = ROOT / "audio" / "manifest.json"
OUT = ROOT / "dist" / "index.single.html"
SCRIPT_TAG = "\n<script>\n"   # 遊戲主程式的 <script>（第一個沒有 src 的）


def to_data_uri(rel: str) -> str | None:
    path = (ROOT / rel).resolve()
    if ROOT.resolve() not in path.parents or not path.is_file():
        return None
    return "data:audio/mpeg;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def main() -> int:
    try:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"錯誤：讀不到 {MANIFEST.relative_to(ROOT).as_posix()}（{e}），請先跑 tools/gen_audio.py")
        return 1

    inline: dict[str, dict[str, str]] = {}
    missing = []
    for kind in ("en", "letters", "zh"):
        inline[kind] = {}
        for key, rel in (manifest.get(kind) or {}).items():
            uri = to_data_uri(rel)
            if uri:
                inline[kind][key] = uri
            else:
                missing.append(rel)

    html = INDEX_HTML.read_text(encoding="utf-8")
    if html.count(SCRIPT_TAG) != 1:
        print("錯誤：index.html 裡找不到唯一的主程式 <script>，無法插入 AUDIO_INLINE")
        return 1
    payload = json.dumps(inline, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = html.replace(SCRIPT_TAG, f"\n<script>window.AUDIO_INLINE={payload};</script>{SCRIPT_TAG}", 1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")

    count = sum(len(v) for v in inline.values())
    size_mb = OUT.stat().st_size / 1024 / 1024
    print(f"已輸出 {OUT.relative_to(ROOT).as_posix()}：{count} 個音檔，{size_mb:.1f} MB")
    if missing:
        print(f"⚠️  {len(missing)} 個音檔找不到，這些會改用瀏覽器語音：")
        for rel in missing:
            print(f"  {rel}")
    return 0


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    sys.exit(main())
