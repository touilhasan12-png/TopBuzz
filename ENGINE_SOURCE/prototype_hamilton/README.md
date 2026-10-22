# Hamilton field — five-second method test

This is a deliberately small, reviewable 2D cut-out prototype—not a replacement film. It uses an empty environment plate, an independently keyed P-38, a separate walking-pilot pose, a separate stopped-pilot pose, and a cloud layer. The pilot path is foot-anchored and the camera follows the subject with easing. At roughly three seconds, the animation transitions from the walk pose to a standing pose.

The test exists to catch the previous method's failure: no baked-in people or aircraft on the background plate, no duplicate hero objects, correct screen placement, and visible motion before producing another 84-second render. The generated background and isolated pose are AI-generated assets; they are not presented as human-drawn originals. The output is rendered only by the dedicated GitHub Actions workflow `pilot-preview.yml`.

Acceptance gate: the user reviews the five-second artifact before any full-film rebuild or Drive replacement.
