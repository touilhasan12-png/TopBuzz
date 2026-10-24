# Sample 16 — Blender-native reconstruction

This is a new implementation, not a new title for the Three.js scene.

- Renderer: Blender / Cycles CPU, on GitHub Actions only.
- Characters: shaped shirt, waistcoat or striped linen, sash/neckerchief, bandana knot and tail, hair wisp, earring, face contour, brows and alternate wide-eye forms.
- Acting: reaching to a specific fuse target, two alternating withdrawal steps, body lean, head counterrotation, ear-covering and target recoil.
- Limbs: continuous Bezier ink curves with fixed-length two-link pose solving.
- World: connected 3D water, dimensional cliff islands, foliage, waterfalls and clouds. No distant image plane containing a second ocean.
- Props: individual deck boards, barrels, cargo chests, rigging, seams, cannon carriage, hollow muzzle, hoops, trunnions and wheels.
- Narrative beats: lighting / anticipation / shot and recoil / projectile follow / broken gunwale and target reaction.
- Audio: previously selected English voice and authored sound effects reused from sample14.
- Output: 1080×1920, 30fps, 8.5 seconds, 255 frames.
- Three parallel frame ranges, then a separate encoding step.

No local rendering, no generated video, no output screenshots or visual QA. Implementation is not a claim of verified visual matching.
