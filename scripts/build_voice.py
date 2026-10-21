#!/usr/bin/env python3
"""Build the full verbatim voice-over with Kokoro (am_adam, American male).

- Reads data/narration_verbatim.txt (the sacred script, Section 1).
- Markers become spoken chapter lines (nothing deleted, nothing added).
- Acronyms are mapped to natural pronunciation FOR AUDIO ONLY; the text
  stays byte-identical on screen. Logged to tts_notes.json.
- Emits per-sentence wavs, vo_full.wav (concat with exact offsets),
  segments.json, and a COLD-OPEN preview mp3 for the approval gate.
"""
import json, os, re, sys, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = open(os.path.join(ROOT, "data", "narration_verbatim.txt")).read()
OUT_V = os.path.join(ROOT, "voice")
os.makedirs(OUT_V, exist_ok=True)

ACRONYMS = {
    r"\bCENTCOM\b": "Sent-com", r"\bUKMTO\b": "U K M T O",
    r"\bJMIC\b": "J M I C", r"\bAIS\b": "A I S", r"\bS&P\b": "S and P",
    r"\bIRNA\b": "Ear-nah", r"\bIMO\b": "I M O", r"\bLNG\b": "L N G",
    r"\bIEA\b": "I E A", r"\bIMF\b": "I M F", r"\bUNCLOS\b": "UN-klos",
    r"\bCNN\b": "C N N", r"\bAFP\b": "A F P", r"\bLSEG\b": "L S E G",
    r"\bGFS\b": "G F S", r"(?<![A-Za-z])US(?![A-Za-z])": "U S",
    r"\bUAE\b": "U A E", r"\bUN\b": "U N",
}

def markers_speak(text: str) -> str:
    words = {"ONE": "one", "TWO": "two", "THREE": "three", "FOUR": "four",
             "FIVE": "five", "SIX": "six", "SEVEN": "seven"}
    def num_no(m):
        return f"Part {words[m.group(1)]}. {m.group(2).title()}."
    text = re.sub(r"---\s*COLD OPEN\s*---", "Cold open.", text)
    text = re.sub(r"---\s*PART (\w+): (.+?)\s*---", num_no, text)
    text = re.sub(r"---\s*END OF NARRATION\s*---", "", text)
    text = re.sub(r"^LEVER (\w+): (.+)$",
                  lambda m: f"Lever {words[m.group(1)]}. {m.group(2).title()}.",
                  text, flags=re.M)
    return text

def split_sentences(text: str):
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\"'])", text)
    return [p.strip() for p in parts if p.strip()]

body = markers_speak(RAW)
sentences = split_sentences(body)
print(f"sentences: {len(sentences)}", flush=True)

notes = {"markers_spoken": "chapter lines narrated; nothing removed",
         "acronym_map_for_audio_only": ACRONYMS}
json.dump(notes, open(os.path.join(ROOT, "tts_notes.json"), "w"), indent=2)

def tts_form(s: str) -> str:
    for pat, rep in ACRONYMS.items():
        s = re.sub(pat, rep, s)
    return s

def main():
    from kokoro import KPipeline
    import numpy as np
    import soundfile as sf
    pipe = KPipeline(lang_code="a")
    segs, auds = [], []
    t = 0.0
    sr = 24000
    for i, s in enumerate(sentences):
        gen = pipe(tts_form(s), voice="am_adam", speed=0.97)
        clip = np.concatenate([a for _, _, a in gen])
        pad = np.zeros(int(0.33 * sr), dtype=np.float32)
        fn = os.path.join(OUT_V, f"s{i:03d}.wav")
        sf.write(fn, clip, sr)
        auds.append(np.concatenate([clip, pad]))
        segs.append({"i": i, "text": s, "start": round(t, 3)})
        t += (len(clip) + len(pad)) / sr
        if i % 25 == 0:
            print(f"vo {i}/{len(sentences)} {t/60:.1f}min", flush=True)
    full = np.concatenate(auds)
    sf.write(os.path.join(ROOT, "vo_full.wav"), full, sr)
    for k, s in enumerate(segs[:-1]):
        s["end"] = segs[k + 1]["start"]
    segs[-1]["end"] = round(len(full) / sr, 3)
    json.dump({"sr": sr, "duration": segs[-1]["end"], "segments": segs},
              open(os.path.join(ROOT, "segments.json"), "w"))
    # cold-open preview (through the last cold-open sentence)
    co_end = 0
    for s in segs:
        if s["text"].startswith("Part one"):
            break
        co_end = s["end"]
    prev = full[: int((co_end + 0.5) * sr)]
    sf.write(os.path.join(ROOT, "cold_open_preview.wav"), prev, sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error",
                    "-i", os.path.join(ROOT, "cold_open_preview.wav"),
                    "-b:a", "128k", os.path.join(ROOT, "cold_open_preview.mp3")], check=False)
    print(f"vo_full duration {len(full)/sr/60:.2f} min; preview {co_end:.1f}s",
          flush=True)

if __name__ == "__main__":
    main()
