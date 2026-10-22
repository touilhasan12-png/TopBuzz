# Richard Bong — Ace of Aces

A portrait historical short built from separately illustrated 2D background plates and independently moving cutout assets. The animation script is for camera tracking, cutout motion, editorial typography and compositing; it does not draw the finished aircraft or characters from primitive code shapes, and it does not use a complete generated scene as the animation.

## Target

- 84 seconds, 720 × 1280 portrait (9:16), 30 fps
- Existing English narration clips, joined in sequence
- English on-screen text only
- H.264 video with AAC audio, `yuv420p`
- **The movie is rendered in GitHub Actions only.** Do not render the movie locally.

## Art and animation

- `assets/production/` — original per-element illustration sources
- `assets/ready/` — keyed cutouts and 720 × 1280 background plates used by Godot
- `tools/prepare_assets.py` — background fitting, chroma-key cleanup, cropping and edge de-spill; this prepares art and does not render a movie
- `production/TRACKING_AND_QC_PLAN.md` — per-shot focal target, camera behavior, secondary motion and review checks
- `main.gd` — time-coded 16-shot animation, smooth camera targets, separated layer motion, captions and transitions

Every moving subject has a planned anchor and screen-space path. The camera follows the primary subject where appropriate; secondary assets use their own parallax or movement. Review/debug tracking marks are not included in the final render. Visible tracking devices are used only when story-motivated (for example, a gunsight or map route marker).

## GitHub render

The manually dispatched workflow is `.github/workflows/render.yml`. It validates Godot 4.4.1, renders the 2,520-frame silent animation, joins the four narration files, muxes the 84-second MP4, verifies dimensions/codecs/duration and uploads the result as a GitHub Actions artifact.

After visual review, the final MP4 should be downloaded temporarily, uploaded to the user's Drive as a new file (do not overwrite the earlier criticized version), and then removed from the local workspace.
