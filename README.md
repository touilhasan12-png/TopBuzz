# TopBuzz — Istanbul: The City Between Two Continents

Production source for an approximately seven-minute English-language cinematic 3D history film.

## Production status
- Topic: Istanbul, from ancient Byzantium through Constantinople and Ottoman rule to the modern metropolis.
- English narration, beat sheet, references, timeline data, Remotion/Three.js scene, ECharts timeline, and Blender/Manim asset pipeline are included.
- Target repository: `touilhasan12-png/TopBuzz`, branch `main`. The repository is public.
- GitHub Actions preview run `39461069141` succeeded. Full render run `39461574303` also succeeded and produced a 7:00.05 MP4 at 1920×1080, 24 fps with H.264 video and AAC stereo audio. The full MP4 is in the Drive render folder.
- Visual spot-checks show a crisp but highly simplified low-poly/blockout city. Treat this render as a technical draft; it does not yet meet the requested polished cinematic quality bar.

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
