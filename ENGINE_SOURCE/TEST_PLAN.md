# Test plan — Richard Bong, Ace of Aces

## Acceptance checks

1. Godot 4.4.1 imports the project and loads `main.tscn` without GDScript parse errors.
2. The animation is composed from original vector drawings and independently moving elements; it does not use full-frame generated-image plates as animated scenes.
3. The movie render produces 2,520 frames at 30 fps in a 720 × 1280 portrait viewport (84 seconds nominal).
4. The workflow joins all four English narration clips and muxes them with the silent animation.
5. `ffprobe` reports a 720 × 1280 H.264 video stream at 30 fps, an AAC audio stream, and a duration between 83.5 and 84.5 seconds.
6. GitHub Actions uploads `richard-bong-ace-of-aces-84s` after all validation succeeds.

## Manual review after render

- Confirm the English narration is audible from start to finish and not cut off.
- Check that the captions remain legible in a mobile portrait player.
- Check the scene changes, airplane paths, clothing motion, cockpit sequence, and final memorial card for visual or timing errors.

## Scope

A self-contained historical short with English narration. It is not a frame-by-frame recreation of the source video. The visual language is original, flat, hand-drawn vector/cutout animation.
