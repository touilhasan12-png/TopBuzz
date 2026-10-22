# Test plan — Golden Gate loop sample

## Purpose

Verify that the Godot source opens, renders a short vertical animation, and produces a web-playable MP4 artifact through GitHub Actions.

## Acceptance checks

1. Godot 4.4.1 can import and load `project.godot` and `main.tscn` without parse/runtime errors.
2. Movie Maker renders 240 frames at 30 fps in a 720×1280 portrait viewport (8 seconds nominal).
3. FFmpeg converts the render to H.264 MP4 with `yuv420p` pixel format.
4. `ffprobe` reports a 720×1280 video stream at 30 fps, and the MP4 is non-empty.
5. The workflow uploads the result as the `topbuzz-golden-gate-test-shot` artifact.

## Scope

This is a silent, original 2D proof of concept: a stylized bridge, aircraft path, smoke loop, and captions. It does not include narration, sound effects, or a full 75-second recreation.
