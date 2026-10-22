#!/usr/bin/env python3
"""Key the isolated green-screen standing-pose drawing into a transparent cutout.

This prepares an image asset only; it does not render or encode video.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "prototype" / "bong_standing_pose.png"
DEST = Path(__file__).resolve().parent / "assets" / "bong_standing.png"

im = Image.open(SOURCE).convert("RGB")
rgb = np.asarray(im, dtype=np.uint8)
r = rgb[..., 0].astype(np.int16)
g = rgb[..., 1].astype(np.int16)
b = rgb[..., 2].astype(np.int16)
key = ((g > 75) & (r < 165) & (b < 165) & ((g-r) > 32) & ((g-b) > 25) & (g > r*1.14) & (g > b*1.14))
alpha = np.where(key, 0, 255).astype(np.uint8)
rgba = np.dstack((rgb, alpha))
out = Image.fromarray(rgba, "RGBA").filter(ImageFilter.GaussianBlur(0.45))
# Remove green spill only in semi-transparent edge pixels.
pix = np.asarray(out).copy()
edge = (pix[..., 3] > 0) & (pix[..., 3] < 250)
neutral = np.maximum(pix[..., 0], pix[..., 2]) + 8
pix[..., 1][edge] = np.minimum(pix[..., 1][edge], neutral[edge])
out = Image.fromarray(pix, "RGBA")
alpha_arr = np.asarray(out.getchannel("A"))
y, x = np.where(alpha_arr > 5)
if not len(x):
    raise SystemExit("Keying removed the full standing pose")
margin = 12
box = (max(0, int(x.min())-margin), max(0, int(y.min())-margin), min(im.width, int(x.max())+margin+1), min(im.height, int(y.max())+margin+1))
out.crop(box).save(DEST, optimize=True)
print(f"Saved {DEST} size={Image.open(DEST).size}; alpha={Image.open(DEST).getchannel('A').getextrema()}")
