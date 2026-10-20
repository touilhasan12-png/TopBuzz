# Remote render handoff

The repository target is `touilhasan12-png/TopBuzz`, branch `main`. The project includes `.github/workflows/render.yml` with a manual `workflow_dispatch` input: `preview` or `final`.

## Current workflow
1. Push the prepared source to `main`, preserving the repository's existing starter README during history integration.
2. Dispatch `preview` first. The CPU GitHub-hosted runner installs Blender, FFmpeg, and Manim, builds the GLB and map assets, renders a short sample, and uploads the MP4 as an artifact.
3. Inspect the artifact and workflow logs; patch and rerun only if a concrete issue is found.
4. Once the preview passes visual and technical review, dispatch `final` to render the full film.
5. Download the resulting artifact and upload the approved MP4 to the Drive project folder.

The CPU baseline deliberately does not run TripoSR/Hunyuan3D model weights. Optional asset generation needs a separately provisioned GPU runner. The Remotion renderer uses `swangle` so Three.js can render on CPU-only workers.

## Checkpoint rule
Each scene should render independently when the full scene pipeline is implemented. On failure, retain completed scene artifacts and write the failing scene/frame range to `PROGRESS.md`; do not rerender unchanged scenes.
