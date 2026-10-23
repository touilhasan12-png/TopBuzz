#!/usr/bin/env python3
"""Broadcast & Optical-Flow Quality Gate for TopBuzz Master Renders."""
import json
import os
import re
import subprocess
import sys
import cv2
import numpy as np

mp4_path = sys.argv[1]
out_dir = os.path.dirname(os.path.abspath(mp4_path))

probe = json.loads(subprocess.check_output([
    "ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", mp4_path
]).decode())

vstream = next(s for s in probe["streams"] if s["codec_type"] == "video")
astream = next(s for s in probe["streams"] if s["codec_type"] == "audio")

width = int(vstream["width"])
height = int(vstream["height"])
fps = vstream["r_frame_rate"]
nb_frames = int(vstream.get("nb_frames", 0))
duration = float(probe["format"]["duration"])

ebur = subprocess.run(
    ["ffmpeg", "-nostats", "-i", mp4_path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"],
    capture_output=True, text=True
).stderr
m_i = re.findall(r"I:\s*([-\d.]+)\s*LUFS", ebur)
integrated_lufs = float(m_i[-1]) if m_i else None

# Seamless loop check: Frame 0 vs Last Frame pixel RMSE
cap = cv2.VideoCapture(mp4_path)
ok0, f0 = cap.read()
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, total - 1))
ok1, f_last = cap.read()
cap.release()
loop_rmse = float(np.sqrt(np.mean((f0.astype(np.float32) - f_last.astype(np.float32)) ** 2))) if (ok0 and ok1) else -1.0

# Run reelmimic optical-flow + CIE Lab style comparison against real reference fingerprint
our_fp = os.path.join(out_dir, "our_fingerprint.json")
dist_json = os.path.join(out_dir, "style_distance.json")
overlay_png = os.path.join(out_dir, "fingerprint_overlay.png")
ref_fp = os.path.join("tools", "perception", "reference_fingerprint.json")

subprocess.check_call([sys.executable, "tools/fingerprint.py", "extract", mp4_path, "--out", our_fp])
subprocess.check_call([
    sys.executable, "tools/fingerprint.py", "compare", ref_fp, our_fp,
    "--out", dist_json, "--plot", overlay_png
])

report = {
    "file": os.path.basename(mp4_path),
    "size_bytes": os.path.getsize(mp4_path),
    "width": width,
    "height": height,
    "fps": fps,
    "nb_frames": nb_frames,
    "duration_sec": round(duration, 3),
    "video_codec": vstream["codec_name"],
    "audio_codec": astream["codec_name"],
    "sample_rate": int(astream["sample_rate"]),
    "integrated_lufs": integrated_lufs,
    "seamless_loop_rmse_0_255": round(loop_rmse, 3),
    "status": "PASS",
}

assert width == 1080 and height == 1920, f"Expected 1080x1920, got {width}x{height}"
assert nb_frames == 2232, f"Expected 2232 frames, got {nb_frames}"
assert integrated_lufs is not None and -15.2 <= integrated_lufs <= -12.8, f"LUFS out of spec: {integrated_lufs}"

report_path = os.path.join(out_dir, "verification_report.json")
with open(report_path, "w") as f:
    json.dump(report, f, indent=2)

print("=== TOPBUZZ MASTER VERIFICATION REPORT ===")
print(json.dumps(report, indent=2))
