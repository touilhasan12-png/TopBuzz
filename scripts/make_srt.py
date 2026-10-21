#!/usr/bin/env python3
"""emit captions.srt + description chapters from segments/alignment."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
segs = json.load(open(os.path.join(ROOT, "segments.json")))["segments"]

def ts(t):
    h = int(t // 3600); t -= 3600 * h
    m = int(t // 60); t -= 60 * m
    s = int(t); ms = int(round((t - s) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def yt(t):
    h = int(t // 3600); t -= 3600 * h
    m = int(t // 60); s = int(t % 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"

lines, chapters = [], []
n = 0
for s in segs:
    n += 1
    text = s["text"]
    if re.match(r"^(Part (one|two|three|four|five|six)|Cold open)\.", text):
        chapters.append((s["start"], text.strip(".")))
        continue  # chapter lines still get captioned only if they carry content
    if len(text) > 85:
        mid = len(text) // 2
        cut = text.rfind(" ", 0, mid)
        chunks = [text[:cut], text[cut + 1:]]
    else:
        chunks = [text]
    for j, c in enumerate(chunks):
        lines.append(f"{n}")
        if len(chunks) > 1:
            a = s["start"] + (s["end"] - s["start"]) * (0 if j == 0 else 0.55)
            b = s["end"] if j else s["start"] + (s["end"] - s["start"]) * 0.55
        else:
            a, b = s["start"], s["end"]
        lines.append(f"{ts(a)} --> {ts(b)}")
        lines.append(c)
        lines.append("")
        if len(chunks) > 1:
            n += 1

open(os.path.join(ROOT, "captions.srt"), "w").write("\n".join(lines))
ch = "\n".join(f"{yt(t)} {title}" for t, title in chapters)
open(os.path.join(ROOT, "chapters.txt"), "w").write(ch)
print("captions.srt + chapters.txt written")
