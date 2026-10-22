#!/usr/bin/env python3
"""Prepare separately illustrated plates and chroma-key cutouts for Godot.

This processes artwork only; it does not render a movie. Final movie renders run in GitHub Actions.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

PROJECT = Path(__file__).resolve().parents[1]
PREVIEW = PROJECT / "assets" / "preview"
SOURCE = PROJECT / "assets" / "production"
OUT = PROJECT / "assets" / "ready"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 720, 1280


def remove_green(src: Path, dst: Path, crop=None, remove_checker=False):
    image = Image.open(src).convert("RGB")
    if crop:
        image = image.crop(crop)
    rgb = np.asarray(image, dtype=np.uint8)
    r, g, b = [rgb[..., i].astype(np.int16) for i in range(3)]
    green = ((g > 75) & (r < 165) & (b < 165) &
             ((g-r) > 32) & ((g-b) > 25) &
             (g > r*1.14) & (g > b*1.14))
    key = green.copy()
    if remove_checker:
        high = np.maximum(np.maximum(r, g), b)
        low = np.minimum(np.minimum(r, g), b)
        # The generated cockpit asset contains a literal checker pattern in its glazing.
        # Remove only bright, nearly neutral pixels; the dark olive structure and sight remain.
        checker = ((high-low) < 14) & (low > 176) & (high < 250)
        key |= checker
    alpha = np.where(key, 0, 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.55)
    out_rgb = rgb.astype(np.float32)
    edge = (alpha > 0) & (alpha < 250)
    # De-spill green from the anti-aliased edge pixels.
    neutral = np.maximum(out_rgb[..., 0], out_rgb[..., 2]) + 8.0
    out_rgb[..., 1][edge] = np.minimum(out_rgb[..., 1][edge], neutral[edge])
    rgba = np.dstack((np.clip(out_rgb, 0, 255).astype(np.uint8), alpha))
    ys, xs = np.where(alpha > 5)
    if len(xs) == 0:
        raise RuntimeError(f"Keying removed the entire asset: {src}")
    margin = 10
    box = (max(0, int(xs.min())-margin), max(0, int(ys.min())-margin),
           min(image.width, int(xs.max())+margin+1), min(image.height, int(ys.max())+margin+1))
    Image.fromarray(rgba, "RGBA").crop(box).save(dst, optimize=True)
    print(f"cutout {src.name} -> {dst.relative_to(PROJECT)} size={Image.open(dst).size}")


def crop_family(src: Path, dst: Path):
    # The source illustration contains two matching alternatives side-by-side.
    # Keep one complete pair only so the animation gets one mother and one child.
    im = Image.open(src)
    x0, x1 = int(im.width*0.53), int(im.width*0.99)
    remove_green(src, dst, crop=(x0, 0, x1, im.height))


def fit_background(src: Path, dst: Path):
    im = Image.open(src).convert("RGB")
    scale = max(W / im.width, H / im.height)
    rw, rh = round(im.width*scale), round(im.height*scale)
    im = im.resize((rw, rh), Image.Resampling.LANCZOS)
    x, y = (rw-W)//2, (rh-H)//2
    im.crop((x, y, x+W, y+H)).save(dst, optimize=True)
    print(f"background {src.name} -> {dst.relative_to(PROJECT)}")


# Separate environment plates.
backgrounds = {
    "golden_gate_bg.png": PREVIEW / "golden_gate_background.png",
    "airfield_bg.png": SOURCE / "airfield_hamilton_background.png",
    "neighborhood_bg.png": SOURCE / "sf_neighborhood_background.png",
    "operations_bg.png": SOURCE / "operations_room_background.png",
    "pacific_map_bg.png": SOURCE / "pacific_chart_background.png",
    "battle_bg.png": SOURCE / "pacific_battle_background.png",
    "award_bg.png": SOURCE / "award_hall_background.png",
    "winter_home_bg.png": SOURCE / "winter_home_background.png",
    "newspaper_desk_bg.png": SOURCE / "newspaper_desk_background.png",
    "memorial_bg.png": SOURCE / "memorial_dusk_background.png",
}
for name, path in backgrounds.items():
    fit_background(path, OUT / name)

# Individual moving assets; no whole-frame AI plates are used as animated shots.
cutouts = {
    "clouds.png": (PREVIEW / "clouds_cutout.png", None, False),
    "p38_flying.png": (PREVIEW / "p38_lightning_cutout.png", None, False),
    "p38_parked.png": (SOURCE / "p38_parked_cutout.png", None, False),
    "bong_walking.png": (SOURCE / "richard_bong_pilot_cutout.png", None, False),
    "zero_fighter.png": (SOURCE / "zero_fighter_cutout.png", None, False),
    "p80_jet.png": (SOURCE / "p80_shooting_star_cutout.png", None, False),
    "falling_pilot.png": (SOURCE / "falling_pilot_cutout.png", None, False),
    "parachute_canopy.png": (SOURCE / "parachute_canopy_cutout.png", None, False),
    "medal.png": (SOURCE / "medal_of_honor_cutout.png", None, False),
    "cockpit_frame.png": (SOURCE / "p38_cockpit_frame_clean.png", None, False),
}
for name, (path, crop, remove_checker) in cutouts.items():
    remove_green(path, OUT / name, crop=crop, remove_checker=remove_checker)

crop_family(SOURCE / "homecoming_family_cutout.png", OUT / "homecoming_family.png")

# Patch a model-generated tail serial on the P-80 so it is not mistaken for a real number.
# The area is intentionally small and does not alter its silhouette or markings.
p80_path = OUT / "p80_jet.png"
p80 = cv2.imread(str(p80_path), cv2.IMREAD_UNCHANGED)
if p80 is not None and p80.shape[2] == 4:
    # Work only on opaque pixels over the fin; preserve its silhouette and star marking.
    h, w = p80.shape[:2]
    # The serial is on the upper vertical tail in the keyed source. A soft inpaint mask
    # replaces only the tiny lettering with nearby weathered metal texture.
    x0, x1 = max(0, int(w*0.19)), min(w, int(w*0.29))
    y0, y1 = max(0, int(h*0.25)), min(h, int(h*0.34))
    mask = np.zeros((h, w), np.uint8)
    roi = p80[y0:y1, x0:x1, :3]
    # Dark glyphs only; do not touch panel boundaries or rivets.
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    glyphs = (gray < 95).astype(np.uint8)*255
    glyphs = cv2.dilate(glyphs, np.ones((2,2), np.uint8), iterations=1)
    mask[y0:y1, x0:x1] = glyphs
    bgr = p80[..., :3]
    p80[..., :3] = cv2.inpaint(bgr, mask, 3, cv2.INPAINT_TELEA)
    cv2.imwrite(str(p80_path), p80)

print(f"Prepared {len(backgrounds)} backgrounds and {len(cutouts)+1} cutouts in {OUT}")
