# TopBuzz — Istanbul 3D Timelapse

Procedural Blender pipeline that recreates the "3D Timelapse" style (city history timelapse, stylized low-poly):
**Istanbul — from Byzantium 667 BC to the 2025 megalopolis.**

- `pilot/` — pilot scene (style proof: gabled houses, cypress trees, domed landmark, golden sun, faceted terrain)
- `pipeline/` — full scene builders (terrain from Copernicus DEM, era generators, growth system)
- `kaggle/` — Kaggle kernel entry + metadata (GPU render on free T4/P100)
- `docs/` — timeline data (years, populations, events) + plan

Render: Blender Cycles GPU (headless), flat-shaded stylized, 30fps.
