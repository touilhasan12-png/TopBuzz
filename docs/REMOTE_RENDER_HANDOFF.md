# Remote render handoff

The project is in `touilhasan12-png/TopBuzz`, branch `main`. The repository is public. The manual workflow is `.github/workflows/render.yml` with `workflow_dispatch` profiles `preview` and `final`.

## Completed runs
- Preview run `39461069141` succeeded: five seconds at 1920×1080, 24 fps; artifact inspected and saved to Drive.
- Full run `39461574303` succeeded. The MP4 is 7:00.05 at 1920×1080, 24 fps, H.264 with AAC stereo audio at 48 kHz. The file is in the Drive render folder.
- Blender and Manim asset generation passed, and the full MP4 decoded without error.

## Visual quality caveat
Spot-checks are crisp and legible, but the current scene is a simplified low-poly/blockout city with simple landmark shapes. The render is a technical draft and is not yet at the requested professional cinematic bar.

## Recommended next steps
1. Improve geographically grounded city/landmark assets, materials, lighting, depth, and camera choreography.
2. Render and visually approve a short preview.
3. Only after the preview gate passes, launch a new `final` run; preserve the current draft.
4. Upload the approved replacement master to Drive.

The CPU baseline deliberately does not run TripoSR/Hunyuan3D model weights. Optional asset generation needs a separately provisioned GPU runner. Remotion uses `swangle` for CPU-only Three.js rendering.
