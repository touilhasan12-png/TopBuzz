# Progress checkpoint — Istanbul production

## Completed
- Selected Istanbul / Byzantium / Constantinople / modern city as the topic.
- Wrote the English narration draft, timed storyboard, and source ledger; generated a narration track of approximately 7:00.
- Created the Remotion composition with a procedural Three.js city, Apache ECharts timeline, chapter cards, and Blender/Manim asset pipeline.
- Added GitHub Actions `workflow_dispatch` render workflow, with `preview` and `final` profiles.
- TypeScript type-check passed. Production dependency audit passed. Timeline data validation passed.
- Prepared local source repository `ENGINE_SOURCE` on branch `main`.
- Confirmed GitHub access to `touilhasan12-png/TopBuzz`; repository is public and its default branch is `main`.

## Current render diagnostics
- Switched Remotion's Chromium backend to `swangle` and added the explicit `--gl=swangle` render flag for CPU-only runners.
- A one-frame local smoke test passed the WebGL initialization step, then stopped because `public/istanbul-landmarks.glb` is not present locally. The render workflow must generate this asset with Blender first; it likewise generates `public/strait-map.mp4` with Manim.
- No preview MP4 or seven-minute final render has been produced yet.

## Next steps
1. Merge the repository's existing starter README into the prepared `main` history and push the Istanbul source to `TopBuzz`.
2. Trigger `workflow_dispatch` with profile `preview`, inspect the artifact and logs, then correct any failures.
3. Only after preview QA, trigger `final`, retrieve the MP4 artifact, and upload it to the Drive project folder.
4. Optional TripoSR/Hunyuan3D asset generation remains a separate GPU-only enhancement and is not part of the CPU baseline workflow.
