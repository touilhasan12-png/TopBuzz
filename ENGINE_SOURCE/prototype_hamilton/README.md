# Hamilton field — five-second method test

This is a deliberately small, reviewable 2D cut-out prototype—not a replacement film. It uses an empty environment plate, an independently keyed P-38, a cloud layer, and a pilot walk cycle made from **12 separate transparent PNG drawings**. Godot advances those drawings at 12 frames per second inside the 30 fps output; the feet are anchored to the path, the camera follows with easing, and the cycle transitions to a stopped pose at roughly three seconds. The loop frames are generated from the same cutout via a smooth leg mesh warp to preserve identity and avoid the inconsistent outfit/face changes caused by generating each frame independently.

The test exists to catch the previous method's failure: no baked-in people or aircraft on the background plate, no duplicate hero objects, correct screen placement, and visible motion before producing another 84-second render. The generated background and isolated pose are AI-generated assets; they are not presented as human-drawn originals. The output is rendered only by the dedicated GitHub Actions workflow `pilot-preview.yml`.

Acceptance gate: the user reviews the five-second artifact before any full-film rebuild or Drive replacement.
