# Acceptance and visual-review plan — Richard Bong short

## Technical acceptance

1. Godot 4.4.1 imports `ENGINE_SOURCE` and loads `main.tscn` without script errors.
2. The film is composed from separately illustrated environment plates and independent cutout assets; no complete AI-generated scene is used as an animated shot.
3. The animation is 2,520 frames at 30 fps in a 720 × 1280 portrait viewport (84 seconds nominal).
4. Four existing English narration clips are concatenated and muxed with the animation; no Arabic voice or on-screen text is added.
5. `ffprobe` confirms a 720 × 1280 H.264 video at 30 fps, AAC audio, and a duration between 83.5 and 84.5 seconds.
6. The final movie render is performed only in GitHub Actions; no local movie render is run.
7. The GitHub Actions artifact is uploaded only after all technical checks succeed.

## Visual acceptance — review the GitHub artifact at full size and speed

- Every primary moving element has a meaningful anchor/pivot and a readable path; the camera follows the subject smoothly when the shot calls for it.
- Secondary motion has separate timing and depth (clouds, route marker, smoke, snow, canopy, jet); it does not distract from the focal subject.
- No object clips the frame unexpectedly, slides without contact, jumps across frames, crosses captions, or passes through another asset incorrectly.
- Check camera framing, subject scale, foreground/background ordering, keying edges, and transitions at the start, midpoint and end of every shot.
- Confirm aircraft silhouettes and scene chronology are consistent with the narration.
- Verify all visible words are English, spelling is clean, and text remains legible on a portrait phone screen.
- Remove debug-only trackers and overlays before the final artifact.

## Delivery

Keep the previous Drive file intact. Once the GitHub artifact has been visually reviewed and accepted, upload the new MP4 to Drive under a new filename and delete its temporary local copy.
