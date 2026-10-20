"""Validate data and create deterministic Blender/Manim scene assets."""
from pathlib import Path
import json, shutil, subprocess, os, sys
ROOT=Path(__file__).resolve().parents[1]
with (ROOT/'data'/'timeline.json').open(encoding='utf-8') as f: timeline=json.load(f)
assert timeline and all('year' in item and 'label' in item for item in timeline)
(ROOT/'public').mkdir(exist_ok=True)
subprocess.run([sys.executable,str(ROOT/'scripts'/'create_historic_roofscapes.py')],check=True)
required=os.environ.get('REQUIRE_RENDER_ASSETS')=='1'
blender=shutil.which('blender')
manim=shutil.which('manim')
if blender:
    glb=ROOT/'public'/'istanbul-landmarks.glb'
    subprocess.run([blender,'-b','-P',str(ROOT/'blender'/'generate_landmarks.py'),'--',str(glb),str(ROOT/'data'/'istanbul-core-osm.geojson')],check=True)
    if not glb.is_file() or glb.stat().st_size<1_000_000:
        raise SystemExit(f'Blender exited without a valid landmark GLB: {glb}')
elif required: raise SystemExit('Blender is required to build the landmark GLB on this render runner.')
else: print('Blender not installed; optional landmark GLB skipped.')
if manim:
    subprocess.run([manim,'-ql','--media_dir',str(ROOT/'out'/'manim'),str(ROOT/'manim'/'strait_map.py'),'StraitMap'],check=True)
    candidates=list((ROOT/'out'/'manim').rglob('StraitMap.mp4'))
    if not candidates: raise SystemExit('Manim completed without producing StraitMap.mp4')
    shutil.copy2(candidates[0],ROOT/'public'/'strait-map.mp4')
elif required: raise SystemExit('Manim is required to build the map animation on this render runner.')
else: print('Manim not installed; optional map animation skipped.')
print(f'Validated {len(timeline)} dated milestones.')
