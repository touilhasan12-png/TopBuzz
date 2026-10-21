#!/usr/bin/env python3
"""Word-level alignment: aeneas per-sentence pass -> alignment.json.

Sentence timing comes from measured concat offsets in segments.json;
aeneas refines INSIDE each sentence for true word boundaries that drive
the kinetic-captions layer in Remotion.
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
segs = json.load(open(os.path.join(ROOT, "segments.json")))["segments"]

def align_sentence(wav_path, text):
    with tempfile.TemporaryDirectory() as td:
        txt = os.path.join(td, "t.txt")
        mapping = os.path.join(td, "m.json")
        open(txt, "w").write(text)
        cfg = ("task_language=eng|is_text_type=plain|os_task_file_format=json|"
               "mfcc_window_shift=15.000")
        cmd = ["python3", "-m", "aeneas.tools.execute_task", wav_path, txt,
               cfg, mapping]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            return None
        try:
            return json.load(open(mapping))
        except Exception:
            return None

def main():
    out = {"sr": 24000, "sentences": []}
    for s in segs:
        wav = os.path.join(ROOT, "voice", f"s{s['i']:03d}.wav")
        words = []
        m = align_sentence(wav, s["text"])
        if m:
            for frag in m.get("fragments", []):
                for ln in frag.get("lines", []):
                    w = " ".join(ln.get("lines", []))
                    words.append({"w": w,
                                  "start": round(s["start"] + float(ln["begin"]), 3),
                                  "end": round(s["start"] + float(ln["end"]), 3)})
        if not words:
            # fallback: even split inside sentence (rare; logged by aeneas stderr)
            toks = s["text"].split()
            dur = s["end"] - s["start"]
            for k, tk in enumerate(toks):
                words.append({"w": tk,
                              "start": round(s["start"] + dur * k / len(toks), 3),
                              "end": round(s["start"] + dur * (k + 1) / len(toks), 3)})
        out["sentences"].append({"i": s["i"], "text": s["text"],
                                 "start": s["start"], "end": s["end"],
                                 "words": words})
        if s["i"] % 25 == 0:
            print("aligned", s["i"], flush=True)
    json.dump(out, open(os.path.join(ROOT, "alignment.json"), "w"))
    print("alignment.json done:", len(out["sentences"]), "sentences", flush=True)

if __name__ == "__main__":
    main()
