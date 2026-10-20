# Remote render handoff

The project is in `touilhasan12-png/TopBuzz`, branch `main`. The manual workflow is `.github/workflows/render.yml` with `workflow_dispatch` profiles `preview` and `final`. The repository is public.

## Run history
- Preview run `39461069141` succeeded: five seconds at 1920×1080, 24 fps. The MP4 was downloaded, visually checked at representative frames, and uploaded to the Drive render folder.
- Final run `39461574303` was dispatched on `main` with profile `final`; it remains in progress at the Remotion render step. Its Blender/Manim asset build succeeded.

## Remaining steps
1. Monitor the final run until it completes.
2. Download its artifact and verify duration, resolution, audio/video streams, and representative frames.
3. Upload the approved final MP4 to the Drive project folder.
4. If the render fails, inspect the run logs, patch the concrete issue, and retry only the necessary run.

The CPU baseline deliberately does not run TripoSR/Hunyuan3D model weights. Optional asset generation needs a separately provisioned GPU runner. The Remotion renderer uses `swangle` for CPU-only Three.js rendering.

## Checkpoint rule
Each scene should render independently when the full scene pipeline is implemented. On failure, retain completed scene artifacts and record the failing scene/frame range in `PROGRESS.md`; do not rerender unchanged scenes.
