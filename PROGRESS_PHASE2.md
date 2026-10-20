# Progress checkpoint — phase 1 + render scaffold

## Completed
- Selected topic: Istanbul / Byzantium / Constantinople / modern city.
- Wrote a 765-word English narration draft plus a timed storyboard and source ledger.
- Auditioned an English documentary voice and generated a 7:00 narration MP3 with chapter-aligned pauses.
- Created a 7-minute 1080p/24fps Remotion composition with a procedural Three.js city scene, animated timeline graphic using Apache ECharts, chapter cards, and a Manim/Blender asset pipeline.
- Added a Blender Python landmark generator and a Manim Bosporus explainer.
- Added a GitHub Actions `workflow_dispatch` render pipeline draft; no credentials are included.
- Ran timeline asset validation, TypeScript type-check, and a production dependency audit successfully. No full-length local render was run.
- Created the Drive project folder and saved the project package and preproduction docs there.

## GitHub / render status (2026-10-20)
- GitHub API access via `curl` works for `/user`; account login resolved as `touilhasan12-png`.
- `GET /repos/touilhasan12-png/3dvid` returned 404. `POST /user/repos` to create the private repository returned 403: `Resource not accessible by personal access token`.
- No remote repository was created, no source was pushed, and no `workflow_dispatch` was triggered.
- A local Git-ready source mirror is staged at `/home/user/ENGINE_SOURCE`, branch `main`, with origin set to `https://github.com/touilhasan12-png/3dvid.git`.
- A local preview attempt exposed a headless WebGL issue; the renderer was changed to `swangle` for CPU-only rendering. The subsequent one-frame check progressed past WebGL but stopped because the Blender-generated `public/istanbul-landmarks.glb` is absent locally. The render workflow builds this asset first; Blender/Manim are not installed in the local environment.

## Pending before a final master
- Create the private GitHub repository or grant the current credential repository creation/access permissions; then push `main` and launch the preview using `workflow_dispatch`.
- Generate and review the preview, then run the final render and upload the MP4 to Drive.
- Final visual review, soundtrack licensing/mix, and complete render/QA remain.
- Optional TripoSR/Hunyuan3D asset generation needs a suitable GPU runner and is not included in the CPU baseline action.

## Resume from
1. Make `touilhasan12-png/3dvid` available as a private repository with contents/actions write access.
2. Push the prepared `main` branch and trigger the approved preview workflow.
3. Review the preview, then run final render and upload the final MP4 to Drive.
