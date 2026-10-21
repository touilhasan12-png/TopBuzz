# Hormuz Documentary Pipeline

18-minute documentary — *"Iran says the Strait of Hormuz is closed. The US
says ships still get through. How can both be true?"*

**Look:** dark-navy newsroom; red (Iran side) / blue (US side) / gray
(neutral); every on-screen number carries a source chip.
**Output:** 1920×1080 @ 30fps, -14 LUFS, verbatim narration + SRT.

## Pipeline

| Stage | Where | What |
|---|---|---|
| 01 assets | GitHub Actions | licensed archival footage (Commons PD, Internet Archive), Sentinel-2, Natural Earth, Brent CSV, fonts, Kevin MacLeod music, synthesized SFX |
| 02 audio  | GitHub Actions | Kokoro `am_adam` TTS (verbatim), aeneas word alignment, SRT + chapters, music/SFX mix (-14 LUFS) |
| heroes    | Kaggle GPU (T4) | Blender Cycles hero shots on real Copernicus DEM (mine / strait aerial / VLCC / channel / convoy / anchorage) → pushed into `heroes/` |
| 03 render | GitHub Actions (matrix) | Remotion per-section renders + manim lever diagrams |
| 04 assemble | GitHub Actions | concat + mux + thumbnail + faster-whisper verbatim QA → release |
| delivery  | Drive `videotest` | final mp4 + SRT + thumbnail + QA report |

## Rules that govern this repo
1. The script is sacred — narrated verbatim (acronyms get pronunciation
   forms for audio only; the text never changes on screen).
2. Every number on screen shows its named source.
3. Every asset is licensed (see LICENSES.md); credits roll in-video.
