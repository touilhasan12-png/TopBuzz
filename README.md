# TopBuzz — Deterministic 2D Vector Puppet Animation Studio

100% deterministic, zero-AI-image / zero-AI-video 2D rigged animation engine for historical storytelling Shorts (`1080x1920 @ 30fps`), powered by open-source GitHub tools:

- **`src/kit.js` & `src/anime.js`** (adapted from [`edenfunf/reelmimic`](https://github.com/edenfunf/reelmimic)): Catmull-Rom splines, tapered variable-width ink strokes, silhouette unions (`drawGroup`), cel shading (`cel`), camera shakes, radial focus smears, and TV-anime bloom/vignette post-compositing.
- **`src/doughboy_rig.js`**: 3D airbrush radial form-shaded OverSimplified/Sakamaki character rig with analytic 2-bone IK limbs, unified `tubePts` sleeves, articulated 4-finger gloved hands (`point`, `salute`, `clutch`, `grip`, `open`, `fist`), secondary physics hats (`hatLift`, `hatTilt`), and 9-viseme cartoon lip-sync.
- **`audio/lipsync_rhubarb.json`** ([`DanielSWolf/rhubarb-lip-sync`](https://github.com/DanielSWolf/rhubarb-lip-sync) `v1.14.0`): Frame-accurate Preston Blair 9-viseme phoneme track (`A–H, X`) synchronized to `-14.0 LUFS` broadcast narration (`audio/master_mix_14lufs.wav`).
- **`tools/perception/`** ([`edenfunf/reelmimic`](https://github.com/edenfunf/reelmimic)): Optical-flow camera motion, rhythm/hold ratio, tension curve, and CIE Lab color distance verification against the target reference fingerprint.

## Cloud Build & Render (GitHub Actions)

Every push to `main` or manual `workflow_dispatch` executes `.github/workflows/render.yml` on `ubuntu-latest` (4 vCPUs, 16 GB RAM):
1. Renders `out/qa_contact_sheet.jpg`
2. Renders all `2,232` Full-HD `1080x1920` frames across 4 parallel Chromium workers
3. Muxes `out/TopBuzz_EP01_Willie_Dee_1080p_Master.mp4` (`H.264 High CRF 17 + AAC 192 kbps @ -14.0 LUFS`)
4. Runs `python3 tools/verify_master.py` (stream specs, EBU R128 loudness, seamless loop RMSE, and optical-flow fingerprint comparison) and uploads the master artifact bundle.
