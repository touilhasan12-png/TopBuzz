# TopBuzz / Hormuz technical pilot

This is newly built source, not a supplied kit. The user approved public use of this repository for the pilot, source code, narration excerpt, and outputs. No access credential belongs in this repository.

## Scope
A roughly 35–45-second, 1920×1080, 16:9, native 30fps technical preview. Duration follows the spoken excerpt and is never forced by dropping words. The first 85 words of the provided Hormuz narration are preserved; the original full-script SHA-256 is recorded in `data/pilot.json`. This is not production of the complete video.

- Remotion/React: frame-deterministic composition and delivery.
- Three.js / R3F / Remotion ThreeCanvas: AI-generated, clearly labeled merchant-vessel illustration with frame-driven punch-ins. No archival footage is implied.
- Natural Earth 1:10 million: public-domain geographical context, not navigational accuracy. The dashed corridor is explicitly illustrative, not AIS.
- ECharts: SVG server-side rendering with animation disabled. Approximately 400 is shown as an attributed seven-day aggregate, never a daily series or a comparison with a made-up zero.
- Kokoro ONNX / `am_michael`: provisional US-English masculine speech on the remote CPU. This is not final voice approval. Maximum ten sentence clips; no provider fallback, limit workaround, or silent truncation.
- Original, low-level synthesized music and transition effects, RMS-based ducking, FFmpeg loudness normalization.

## Review status
Claims are reproduced from the supplied historical script snapshot (18 October 2026), not independently verified for this technical pilot. The video is marked TECHNICAL DRAFT. Human factual, listening, and rendered-frame review are mandatory before publication. Subtitle sentence boundaries come from synthesis; within-sentence cue timing is approximate, not forced-aligned.

## Execution / stop policy
`hormuz-pilot.yml` is manual-only. A standard `ubuntu-24.04` hosted runner is used, with a 25-minute job ceiling, no paid/GPU tier, no automatic retries, no push-triggered render, and one active pilot at a time. The workflow renders proofs and video, performs automated checks, and holds an artifact for two days. It does not upload to Drive. After dispatch the assistant stops; the user monitors. Only when the user reports completion may output verification and separately authorized Drive transfer resume.

Generated project and media files live on the remote runner, not in the assistant workspace. The original full script is not uploaded here. Secrets are not stored in code, environment files, artifacts, or source archives.

## Outputs
`hormuz-pilot-1080p.mp4`, English SRT/VTT, narration/music-effect stems, nine proof frames and a proof sheet, QA report, checksums, dependency records, and editable source ZIP. Automated zone checks are useful but are not a guarantee against every overlap or 3D occlusion.

## Reproduce remotely
Python 3.11 and Node 22; install `requirements.txt` and `package.json`, download the pinned model assets / map / fonts exactly as in the workflow, then:

```sh
npm run prepare:audio
npm run prepare:visuals
npm run check
npm run render
python scripts/package_source.py
npm run qa
```

## Third-party licenses / credits
- Remotion: https://www.remotion.dev/docs/license — its license and eligibility requirements apply independently of this repository's license.
- Three.js (MIT): https://github.com/mrdoob/three.js
- React Three Fiber (MIT): https://github.com/pmndrs/react-three-fiber
- Apache ECharts (Apache-2.0): https://github.com/apache/echarts
- d3-geo (ISC): https://github.com/d3/d3-geo
- Natural Earth (public domain): https://www.naturalearthdata.com/about/terms-of-use/
- kokoro-onnx (MIT): https://github.com/thewh1teagle/kokoro-onnx
- Kokoro model / voices (Apache-2.0): https://huggingface.co/hexgrad/Kokoro-82M
- Manrope and Barlow Condensed (SIL OFL): https://github.com/google/fonts
- FFmpeg: https://ffmpeg.org/legal.html

Model release URLs and SHA-256 values are pinned in the workflow. This repository's license does not relicense dependencies, fonts, model weights, third-party source material, or the user's narration.
