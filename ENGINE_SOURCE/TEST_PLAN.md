# Test plan — polished Golden Gate loop sample

## Purpose

Verify that the Godot scene loads, renders a short portrait animation with separate illustrated background/aircraft assets, and produces a web-playable MP4 artifact through GitHub Actions.

## Acceptance checks

1. Godot 4.4.1 imports and loads `project.godot`, `main.tscn`, and the PNG assets without script or resource errors.
2. Movie Maker renders 240 frames at 30 fps in a 720×1280 portrait viewport (8 seconds nominal).
3. The aircraft sprite moves around an elliptical flight path while a white contrail draws on behind it.
4. FFmpeg converts the render to H.264 MP4 with `yuv420p` pixel format.
5. `ffprobe` reports a 720×1280 video stream at 30 fps, and the MP4 is non-empty.
6. The workflow uploads the result as the `topbuzz-golden-gate-test-shot` artifact.

## Scope

This is an 8-second silent visual proof of concept, not a full 75-second recreation. It contains original art assets and no narration or sound effects.
