# 3dvid — Istanbul: The City Between Two Continents

Production starter for an approximately seven-minute English-language cinematic 3D history film.

## Production status
- Topic: Istanbul, from ancient Byzantium through Constantinople and Ottoman rule to the modern metropolis.
- Narrative, beat sheet, references, timeline data, and first-pass GitHub Actions workflow are prepared.
- No full-length render has been started locally. A short code/type validation has passed. Remote GitHub access is not available to this session, so the workflow must be added/launched by a repository maintainer.
- The exposed GitHub PAT from the conversation must be revoked. This package contains no credential and must never contain one.

## Technical direction
- Blender/Python: hero landmarks, lighting, procedural assets, GLB export.
- Three.js / React Three Fiber: deterministic animated city and camera.
- Remotion: frame-accurate chapter timing, composition, captions and final render. A 7-minute English narration track has been generated from the draft; the final master still needs soundtrack mix and visual QA.
- Manim: explanatory map/timeline shots.
- Apache ECharts: only sourced, non-misleading data visuals.
- TripoSR or Hunyuan3D-2: optional landmark asset generation on a suitable GPU runner; not required for the baseline render.
- OSMnx / BlenderGIS: current geographic context only, with required OpenStreetMap attribution.
- FFmpeg: final assembly/encoding.

## Target delivery
MP4, 1920x1080, 16:9, 24 fps (10,080 frames for 7:00). The seven-minute composition is split into short scenes so individual sections can be rendered/retried. A 30 fps version can be selected later if the render runner can handle it.

## Important limitation
This is a stylized, researched reconstruction—not a literal, complete historical digital twin. Use reference imagery/assets only when their reuse terms permit it. Preserve the references and attributions in `docs/SOURCES.md`.
