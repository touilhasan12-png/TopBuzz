# TopBuzz — Istanbul: The City Between Two Continents

Production source for an approximately seven-minute English-language cinematic 3D history film.

## Production status
- Topic: Istanbul, from ancient Byzantium through Constantinople and Ottoman rule to the modern metropolis.
- English narration, beat sheet, references, timeline data, and GitHub Actions render workflow are included.
- Target repository: `touilhasan12-png/TopBuzz` (`main`). Remote access has been confirmed; the repository initially contained only its starter README.
- The source is prepared on local branch `main`. No full-length render or final master has been produced yet.
- The short local Remotion smoke test confirmed the software WebGL path, then stopped because Blender-generated `public/istanbul-landmarks.glb` is not present locally. The render workflow builds that asset before rendering.

## Technical direction
- Blender/Python: hero landmarks, lighting, procedural assets, GLB export.
- Three.js / React Three Fiber: deterministic animated city and camera.
- Remotion: frame-accurate chapter timing, composition, captions and final render. The seven-minute English narration track is included.
- Manim: explanatory map/timeline shots.
- Apache ECharts: sourced, non-misleading data visuals.
- TripoSR or Hunyuan3D-2: optional landmark asset generation on a suitable GPU runner; not required for the baseline render.
- FFmpeg: final assembly/encoding.

## Target delivery
MP4, 1920x1080, 16:9, 24 fps (10,080 frames for 7:00). The seven-minute composition is split into short scenes so individual sections can be rendered/retried.

## Important limitation
This is a stylized, researched reconstruction—not a literal, complete historical digital twin. Use reference imagery/assets only when their reuse terms permit it. Preserve references and attributions in `docs/SOURCES.md`.
