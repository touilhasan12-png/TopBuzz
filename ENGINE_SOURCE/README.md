# TopBuzz — Golden Gate loop test shot

This is a polished 8-second 2D cutout-animation proof of concept based on the visual analysis of the `videotest` reference. It uses original illustrated assets, a rotating aircraft sprite, a drawn-on contrail, a gentle camera push, and subtitle-style captions. It does **not** reuse frames or artwork from the reference video.

## Output target

- Portrait 9:16 composition, 720×1280
- 30 frames per second
- 8-second silent test shot
- Godot 4.4.1, GL Compatibility renderer

## Run locally

Open this folder in Godot 4.4.1 or later and run the main scene. To render an offline AVI:

```sh
godot --path ENGINE_SOURCE --write-movie output/golden-gate.avi --fixed-fps 30 --resolution 720x1280 --quit-after 240
```

The GitHub Actions workflow validates the project, renders the AVI, converts it to H.264 MP4 with FFmpeg, checks the output dimensions and frame rate, and uploads the MP4 as a downloadable workflow artifact.

## Source assets

- `art/golden_gate_background.png` — original illustrated portrait background
- `art/fighter_cutout.png` — isolated aircraft/pilot sprite
- `main.gd` — camera motion, aircraft orbit, contrail, and captions
- `main.tscn` — scene composition
- `TEST_PLAN.md` — acceptance checks
