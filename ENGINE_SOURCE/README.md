# TopBuzz — Golden Gate loop test shot

A small original 2D Godot proof of concept inspired by the analysis of the `videotest` reference: bold outlines, flat color, a simple illustrated bridge, a reusable-looking cartoon aircraft, a drawn smoke trail, and bottom-centered captions. It does **not** reuse the reference video's frames or artwork.

## Output target

- Portrait 9:16 composition, 720×1280
- 30 frames per second
- 8-second silent test shot
- Godot 4.4.1, GL Compatibility renderer

## Run locally

Open this folder in Godot 4.4.1 or later and run the main scene. For an offline-rendered AVI:

```sh
godot --path ENGINE_SOURCE --write-movie output/golden-gate.avi --fixed-fps 30 --resolution 720x1280 --quit-after 240
```

The GitHub Actions workflow performs that render, converts the AVI to H.264 MP4 with FFmpeg, and publishes the MP4 as a downloadable workflow artifact.

## Structure

- `project.godot` — viewport and renderer settings
- `main.tscn` — the single test scene
- `main.gd` — original vector-like drawings and deterministic animation
