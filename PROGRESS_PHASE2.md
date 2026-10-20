# Progress checkpoint — Istanbul source and remote render

## Completed
- The seven-minute Istanbul production scaffold, narration, storyboards, sources, Remotion/Three.js scene, ECharts timeline, and Blender/Manim scripts are present in `ENGINE_SOURCE`.
- Local branch `main` is ready; source commit before remote integration: `8977c42`.
- GitHub API authentication identifies account `touilhasan12-png`. The user supplied `TopBuzz` as the target repository; API confirmed `touilhasan12-png/TopBuzz` is public and defaults to `main`.
- Remote `main` contains the starter commit `b54bda4` with a single `README.md`; it must be preserved during integration.
- Remotion Chromium was configured for `swangle`, suitable for CPU-only rendering. `npx tsc --noEmit` passed.

## Render status
- The one-frame local smoke test passed WebGL initialization with `swangle`, then stopped at the expected missing `public/istanbul-landmarks.glb`; this asset is produced by the Blender step in the remote workflow. No preview or final MP4 exists yet.
- GitHub `workflow_dispatch` has not yet been triggered.

## Resume from
1. Integrate the remote starter commit without discarding its README, then push `main` to `TopBuzz`.
2. Trigger the preview workflow, review the generated artifact and logs, and repair any failures.
3. Run the final profile only after preview QA; upload the finished MP4 to Drive.
