import json,subprocess,zipfile
from pathlib import Path
tracked=subprocess.run(['git','ls-files'],capture_output=True,text=True,check=True).stdout.splitlines()
extras=['package-lock.json','out/python-environment.txt']
with zipfile.ZipFile('out/editable-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in tracked+extras:
  p=Path(name)
  if p.is_file():z.write(p,name)
 for p in Path('public').glob('*'):
  if p.suffix in {'.ttf','.txt','.svg','.json'}:z.write(p,str(p))
print('Editable source archive created; no credentials, model weights, node_modules, or original full script included.')
