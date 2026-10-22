#!/usr/bin/env python3
"""Build a 12-frame 2D cut-out walk cycle from the same pilot drawing.

The source illustration is smoothly mesh-warped around two leg paths, preserving
identity, linework, alpha edges, and clothing. Every output is a separate transparent
PNG frame; no movie is rendered here. The actual sequence is played by Godot on GitHub.
"""
from __future__ import annotations
import math
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets" / "bong_walking.png"
OUT = ROOT / "assets" / "walk_cycle"
FRAME_COUNT = 12
LEG_SWING_DEGREES = 20.0
FOOT_LIFT_PIXELS = 23.0
PAD_X = 32
PAD_Y = 40

# Approximate lower-leg centerlines traced from the isolated pilot drawing.
REAR_PATH = ((129.0, 535.0), (112.0, 580.0), (86.0, 630.0), (54.0, 676.0))
FRONT_PATH = ((225.0, 535.0), (239.0, 580.0), (261.0, 630.0), (282.0, 676.0))
REAR_KNEE = (129.0, 542.0)
FRONT_KNEE = (225.0, 542.0)


def smoothstep(a: float, b: float, values: np.ndarray) -> np.ndarray:
    t = np.clip((values - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def polyline_distance(x: np.ndarray, y: np.ndarray, points: tuple[tuple[float, float], ...]) -> np.ndarray:
    distance = np.full_like(x, np.inf, dtype=np.float32)
    for p0, p1 in zip(points[:-1], points[1:]):
        ax, ay = p0
        bx, by = p1
        vx, vy = bx - ax, by - ay
        denom = vx * vx + vy * vy
        t = np.clip(((x-ax)*vx + (y-ay)*vy) / denom, 0.0, 1.0)
        px, py = ax + t*vx, ay + t*vy
        distance = np.minimum(distance, np.sqrt((x-px)**2 + (y-py)**2))
    return distance


def limb_field(x: np.ndarray, y: np.ndarray, points: tuple[tuple[float, float], ...], knee: tuple[float, float], swing: float, lift: float) -> tuple[np.ndarray, np.ndarray]:
    dist = polyline_distance(x, y, points)
    # Feather the deformation into the hips and along the trouser silhouette; no hard cut seams.
    weight = np.exp(-0.5 * (dist / 28.0)**2) * smoothstep(505.0 + PAD_Y, 590.0 + PAD_Y, y)
    progress = np.clip((y - knee[1]) / (715.0 + PAD_Y - knee[1]), 0.0, 1.0)
    angle = math.radians(swing) * progress * weight
    dx0, dy0 = x - knee[0], y - knee[1]
    ca, sa = np.cos(angle), np.sin(angle)
    dx = (ca - 1.0) * dx0 - sa * dy0
    dy = sa * dx0 + (ca - 1.0) * dy0
    # A small alternating foot lift gives each stride a clear contact/pass/recovery phase.
    dy -= lift * (progress ** 1.8) * weight
    return dx.astype(np.float32), dy.astype(np.float32)


def main() -> None:
    source = np.asarray(Image.open(SOURCE).convert("RGBA"), dtype=np.uint8)
    sh, sw = source.shape[:2]
    # Padding gives swinging boots room and prevents clipping at the original crop edge.
    rgba = np.pad(source, ((PAD_Y, PAD_Y), (PAD_X, PAD_X), (0, 0)), mode="constant")
    h, w = rgba.shape[:2]
    rear_path = tuple((px + PAD_X, py + PAD_Y) for px, py in REAR_PATH)
    front_path = tuple((px + PAD_X, py + PAD_Y) for px, py in FRONT_PATH)
    rear_knee = (REAR_KNEE[0] + PAD_X, REAR_KNEE[1] + PAD_Y)
    front_knee = (FRONT_KNEE[0] + PAD_X, FRONT_KNEE[1] + PAD_Y)
    x, y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    alpha0 = rgba[..., 3].astype(np.float32) / 255.0
    # Premultiply RGB by alpha before interpolation to prevent dark/green edge fringes.
    premul = np.dstack((rgba[..., :3].astype(np.float32) * alpha0[..., None], rgba[..., 3].astype(np.float32)))
    OUT.mkdir(parents=True, exist_ok=True)
    for i in range(FRAME_COUNT):
        phase = 2.0 * math.pi * i / FRAME_COUNT
        rear_swing = LEG_SWING_DEGREES * math.sin(phase)
        front_swing = -rear_swing
        rear_lift = FOOT_LIFT_PIXELS * max(0.0, math.sin(phase))
        front_lift = FOOT_LIFT_PIXELS * max(0.0, -math.sin(phase))
        dxr, dyr = limb_field(x, y, rear_path, rear_knee, rear_swing, rear_lift)
        dxf, dyf = limb_field(x, y, front_path, front_knee, front_swing, front_lift)
        # Blend the two smooth deformation fields so the character stays continuous.
        rear_w = np.exp(-0.5 * (polyline_distance(x, y, rear_path) / 27.0)**2) * smoothstep(505.0 + PAD_Y, 595.0 + PAD_Y, y)
        front_w = np.exp(-0.5 * (polyline_distance(x, y, front_path) / 27.0)**2) * smoothstep(505.0 + PAD_Y, 595.0 + PAD_Y, y)
        total = rear_w + front_w
        blend = np.maximum(total, 1.0)
        dx = (dxr * rear_w + dxf * front_w) / blend
        dy = (dyr * rear_w + dyf * front_w) / blend
        map_x = (x - dx).astype(np.float32)
        map_y = (y - dy).astype(np.float32)
        warped = cv2.remap(premul, map_x, map_y, interpolation=cv2.INTER_LINEAR,
                           borderMode=cv2.BORDER_CONSTANT, borderValue=(0.0, 0.0, 0.0, 0.0))
        alpha = np.clip(warped[..., 3:4] / 255.0, 0.0, 1.0)
        rgb = np.divide(warped[..., :3], np.maximum(alpha, 1e-6), out=np.zeros_like(warped[..., :3]), where=alpha > 1e-6)
        frame = np.dstack((np.clip(rgb, 0, 255), alpha[..., 0] * 255.0)).astype(np.uint8)
        Image.fromarray(frame, "RGBA").save(OUT / f"pilot_walk_{i:02d}.png", optimize=True)
    print(f"Created {FRAME_COUNT} separate transparent walk-cycle frames at {OUT}; source canvas {sw}x{sh}, output {w}x{h}")


if __name__ == "__main__":
    main()
