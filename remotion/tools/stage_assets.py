#!/usr/bin/env python3
"""Stage media into remotion/public and regenerate src/data/assets.gen.json.
Scenes degrade gracefully to procedural backgrounds for any missing slot."""
import json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
GEN = os.path.join(ROOT, "src", "data", "assets.gen.json")

PHOTO_SLOTS = [
    "hormuz_aerial", "tanker_night", "mine", "iran_boat", "convoy",
    "ais_screen", "oil_terminal", "strait_ships", "gulf_map_air", "insurance_city",
]
HERO_SLOTS = ["h1_flag.mp4", "h2_mine.mp4", "h3_tanker.mp4", "h4_strait.mp4", "h5_convoy.mp4", "h6_oilrig.mp4"]

KEYS = {
    "hormuz_aerial": ["aerial", "hormuz", "strait"],
    "tanker_night": ["tanker", "night", "vlcc", "oil"],
    "mine": ["mine", "naval_mine"],
    "iran_boat": ["iran", "boat", "irgc", "fast"],
    "convoy": ["convoy", "escort", "warship", "navy"],
    "ais_screen": ["ais", "radar", "screen", "tracking"],
    "oil_terminal": ["terminal", "refinery", "kharg", "depot"],
    "strait_ships": ["ships", "shipping", "fleet", "anchorage"],
    "gulf_map_air": ["gulf", "map", "satellite"],
    "insurance_city": ["london", "city", "lloyds", "finance"],
}

def pick(dirpath, keys, exts):
    if not os.path.isdir(dirpath):
        return None
    best, score_best = None, -1
    for fn in sorted(os.listdir(dirpath)):
        low = fn.lower()
        if not any(low.endswith(e) for e in exts):
            continue
        score = sum(1 for k in keys if k in low)
        if score > score_best:
            best, score_best = fn, score
    return best

def main():
    os.makedirs(os.path.join(PUB, "photos"), exist_ok=True)
    os.makedirs(os.path.join(PUB, "heroes"), exist_ok=True)
    photos, heroes = {}, {}

    src_photos = os.path.join(ROOT, "..", "footage", "photos")
    for slot in PHOTO_SLOTS:
        found = pick(src_photos, KEYS[slot], (".jpg", ".jpeg", ".png"))
        if found:
            dst = f"{slot}.jpg"
            shutil.copy(os.path.join(src_photos, found), os.path.join(PUB, "photos", dst))
            photos[slot] = True
        else:
            photos[slot] = False

    src_heroes = os.path.join(ROOT, "..", "heroes")
    for slot in HERO_SLOTS:
        src = os.path.join(src_heroes, slot)
        ok = os.path.isfile(src) and os.path.getsize(src) > 500_000
        if ok:
            shutil.copy(src, os.path.join(PUB, "heroes", slot))
        heroes[slot] = ok

    with open(GEN, "w") as f_:
        json.dump({"photos": photos, "heroes": heroes, "charts": {}, "map": False}, f_, indent=2)
    print("assets.gen.json:", json.dumps({"photos": photos, "heroes": heroes}, indent=2))

if __name__ == "__main__":
    sys.exit(main())
