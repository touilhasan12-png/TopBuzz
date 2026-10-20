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

## Pending before a final master
- The PAT exposed in chat must be revoked by the account owner; it is not in the project and must not be used.
- GitHub connector is unsupported in this session, so no push/trigger/poll of `3dvid` has occurred. A repository maintainer must add and launch the workflow, or provide an accessible artifact path.
- Final visual review, soundtrack licensing/mix, and complete render/QA remain.
- Optional TripoSR/Hunyuan3D asset generation needs a suitable GPU runner and is not included in the CPU baseline action.

## Resume from
1. Revoke exposed credential.
2. Add this project bundle to the intended repository and run the preview workflow from a maintainer account.
3. Review the preview, then run final render and upload the final MP4 to Drive.
