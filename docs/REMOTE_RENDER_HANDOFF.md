# Remote render handoff

This package contains a `workflow_dispatch` GitHub Actions workflow. It can be placed in the root of repository `3dvid` and run by a maintainer with repository access. This session cannot push, trigger, or poll GitHub Actions because GitHub integration is not available here.

1. Revoke the PAT exposed in chat. Never add a PAT to this project.
2. Add this package to the repository and enable Actions.
3. Run profile `preview` first. The baseline uses a CPU GitHub-hosted runner and intentionally does not run TripoSR/Hunyuan3D model weights.
4. If needed, use a self-hosted GPU runner for optional model generation; keep generated files and logs as artifacts.
5. Run `final` only after narration/audio and visual review have been finalized.
6. The action uploads the MP4 as an artifact. To make Drive handoff automatic, the repository owner can add a Drive uploader using credentials stored privately in GitHub Actions Secrets. Alternatively, download the artifact and upload it to the Drive project folder.

## Checkpoint rule
Each scene should render independently when the full scene pipeline is implemented. On failure, retain completed scene artifacts and write the failing scene/frame range to `PROGRESS.md`; do not rerender unchanged scenes.
