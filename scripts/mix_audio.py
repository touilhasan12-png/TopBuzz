#!/usr/bin/env python3
"""mix_final.wav = VO + music bed (side-chain ducked) + cue-mapped SFX,
loudness-normalized to YouTube's -14 LUFS with two-pass loudnorm.

Cues are derived from the narration itself (keyword -> sfx, at sentence
start), so the sound design follows the script with zero manual timing.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets_out")
segs = json.load(open(os.path.join(ROOT, "segments.json")))["segments"]

SFXD = os.path.join(ASSETS, "sfx")
MUSD = os.path.join(ASSETS, "music")

CUES = [
    (r"Cold open", "braam", 0.7, 0),
    (r"Strait of Hormuz is closed, and that passage is prohibited",
     "impact", 0.8, 0),
    (r"controlled by the United States", "whoosh", 0.5, 0),
    (r"single digits to a dozen", "telex", 0.5, 0),
    (r"closed by law", "tick", 0.6, 0),
    (r"Part one", "riser", 0.55, 0),
    (r"Part two", "whoosh", 0.55, 0),
    (r"Part three", "whoosh", 0.55, 0),
    (r"23,000 anomalous", "telex", 0.5, 0),
    (r"Part four", "riser", 0.6, 0),
    (r"LEVER ONE|Lever one", "tick", 0.55, 0),
    (r"Lever two", "tick", 0.55, 0),
    (r"Lever three", "sonar_ping", 0.85, 0),
    (r"Bridgeton", "sonar_ping", 0.7, 0),
    (r"Lever four", "whoosh", 0.5, 0),
    (r"Lever five", "tick", 0.55, 0),
    (r"Lever six", "tick", 0.55, 0),
    (r"Lever seven", "whoosh", 0.5, 0),
    (r"Part five", "riser", 0.5, 0),
    (r"Part six", "riser", 0.5, 0),
    (r"closes like a market", "braam", 0.6, 0),
    (r"October 18th, 2026. This situation", "telex", 0.4, 0),
]

def find_music():
    if os.path.isdir(MUSD):
        mp3s = sorted(f for f in os.listdir(MUSD) if f.endswith(".mp3"))
        if mp3s:
            return os.path.join(MUSD, mp3s[0])
    return None

def build_filter(music, cue_hits):
    ins = ["-i", os.path.join(ROOT, "vo_full.wav")]
    fx = ""
    if music:
        ins += ["-i", music]
        fx += "[1:a]volume=0.42[musraw];"
    parts, labels = [], []
    for k, (t, name, vol) in enumerate(cue_hits):
        p = os.path.join(SFXD, f"{name}.wav")
        if not os.path.exists(p):
            continue
        ins += ["-i", p]
        idx = len(ins) // 2 - 1
        ms = int(t * 1000)
        fx += f"[{idx}:a]volume={vol},adelay={ms}|{ms}[s{k}];"
        labels.append(f"[s{k}]")
    if music:
        base = "sidechaincompress=threshold=0.020:ratio=7:attack=35:release=420:makeup=1.3"
        if labels:
            fx += f"[musraw]{'[s0]' if not labels else ''}".replace("[s0]", "")
        mix_in = "[musraw]" + "".join(labels)
        fx += f"{mix_in}amix=inputs={1+len(labels)}:normalize=0[bed];"
        fx += f"[bed][0:a]{base}[ducked];"
        fx += "[ducked]apad[duckpad];"
        fx += f"[0:a][duckpad]amix=inputs=2:normalize=0[out]"
    else:
        if labels:
            fx += "".join(labels) + f"amix=inputs={len(labels)}:normalize=0[bed];"
            fx += f"[0:a][bed]amix=inputs=2:normalize=0[out]"
        else:
            fx = "[0:a]acopy[out]"
    return ins, fx

def main():
    hits = []
    for pat, name, vol, _ in CUES:
        r = pat if isinstance(pat, str) else pat.pattern
        for s in segs:
            if re.search(r.split("|")[0] if "|" not in r else r,
                         s["text"], re.I if r.startswith("(?i)") else 0):
                hits.append((s["start"], name, vol))
                break
    # de-dup: keep first hit per sfx per ~3s window
    hits.sort()
    clean, last = [], {}
    for t, name, vol in hits:
        if t - last.get(name, -99) > 3:
            clean.append((t, name, vol))
            last[name] = t
    music = find_music()
    ins, fx = build_filter(music, clean)
    tmp = os.path.join(ROOT, "mix_raw.wav")
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + ins + \
          ["-filter_complex", fx, "-map", "[out]", "-ar", "48000", tmp]
    print("cue hits:", [(round(t,1), n) for t, n, _ in clean], flush=True)
    subprocess.run(cmd, check=True)
    # two-pass loudnorm to -14 LUFS
    meas = subprocess.run(
        ["ffmpeg", "-i", tmp, "-af",
         "loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True)
    m = re.search(r"\{[^}]+\}", meas.stderr[meas.stderr.rfind("{"):])
    vals = json.loads(m.group(0)) if m else {}
    fin = os.path.join(ROOT, "mix_final.wav")
    ln = (f"loudnorm=I=-14:TP=-1.0:LRA=9:measured_I={vals.get('input_i',-20)}:"
          f"measured_TP={vals.get('input_tp',-3)}:"
          f"measured_LRA={vals.get('input_lra',7)}:"
          f"measured_thresh={vals.get('input_thresh',-30)}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
                    "-af", ln, "-ar", "48000", fin], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", fin,
                    "-b:a", "160k", os.path.join(ROOT, "mix_final.mp3")],
                   check=False)
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "format=duration", "-of", "csv=p=0", fin],
                         capture_output=True, text=True).stdout.strip()
    print(f"mix_final.wav ready ({dur}s), music={'yes' if music else 'NO'}",
          flush=True)

if __name__ == "__main__":
    main()
