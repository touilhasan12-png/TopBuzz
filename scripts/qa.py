from pathlib import Path
import hashlib,json,subprocess
from PIL import Image,ImageOps,ImageStat,ImageDraw
meta=json.loads(Path('out/pilot-meta.json').read_text()); data=json.loads(Path('data/pilot.json').read_text()); layout=json.loads(Path('data/layout.json').read_text())
canon=lambda x:' '.join(x.split())
assert canon(' '.join(s['text'] for s in meta['sentences']))==canon(data['excerpt'])
assert canon(' '.join(c['text'] for c in meta['captions']))==canon(data['excerpt'])
zones=layout['zones']
for z in zones:assert z['x']>=64 and z['y']>=32 and z['x']+z['w']<=1856 and z['y']+z['h']<=1072,z['id']
for i,a in enumerate(zones):
 for b in zones[i+1:]:
  overlap=a['x']<b['x']+b['w'] and b['x']<a['x']+a['w'] and a['y']<b['y']+b['h'] and b['y']<a['y']+a['h']
  assert not overlap,(a['id'],b['id'])
v=Path('out/hormuz-pilot-1080p.mp4')
r=subprocess.run(['ffprobe','-v','error','-count_frames','-show_entries','stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,nb_read_frames,sample_rate:format=duration','-of','json',str(v)],capture_output=True,text=True,check=True)
probe=json.loads(r.stdout); video=next(s for s in probe['streams'] if s['codec_type']=='video'); audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'])==(1920,1080)
assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
assert video['r_frame_rate']=='30/1'
assert int(video['nb_read_frames'])==meta['durationFrames']
assert audio['codec_name']=='aac'
assert abs(float(probe['format']['duration'])-meta['durationFrames']/30)<.15
assert v.stat().st_size<200_000_000
proofs=sorted(Path('out').glob('proof-*.png')); assert len(proofs)==9
sheet=Image.new('RGB',(1440,864),'#060D16'); draw=ImageDraw.Draw(sheet)
for i,p in enumerate(proofs):
 with Image.open(p) as im:
  assert im.size==(1920,1080)
  assert ImageStat.Stat(ImageOps.grayscale(im)).stddev[0]>8
  thumb=im.convert('RGB').resize((480,270),Image.Resampling.LANCZOS)
  x=(i%3)*480;y=(i//3)*288;sheet.paste(thumb,(x,y));draw.text((x+8,y+272),f'PROOF {i+1:02}',fill='#E3B16E')
sheet.save('out/proof-sheet.jpg',quality=94,subsampling=0)
report={'status':'AUTOMATED TECHNICAL CHECKS PASSED; HUMAN APPROVAL PENDING','original_sha256':data['original_sha256'],'excerpt_sha256':data['excerpt_sha256'],'narration_input_coverage':'PASS — every supplied excerpt word is present in TTS input and captions; not an ASR/perceptual guarantee.','duration_seconds':meta['durationFrames']/30,'format':probe,'primary_zone_collisions':'PASS — disjoint reserved rectangles','proof_frames':9,'human_visual_review_pending':True,'human_audio_review_pending':True,'factual_verification_pending':True,'voice_is_provisional':True,'caption_timing_note':meta['captionTiming'],'sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'bytes':v.stat().st_size,'limitations':['Static zone checks cannot guarantee no intra-map label or 3D occlusion problems.','No AIS tracks or documentary attack/radio recordings are used.','400 is an attributed seven-day aggregate, not a daily count.','This is a technical pilot, not approval to produce or publish the full video.']}
Path('out/qa-report.json').write_text(json.dumps(report,indent=2))
Path('out/SHA256SUMS').write_text('\n'.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name for p in sorted(Path('out').iterdir()) if p.is_file() and p.name!='SHA256SUMS')+'\n')
print('QA PASS: 1080p / 30fps / H.264 + AAC / exact frame count / source-text coverage / reserved-zone bounds. Human review pending.')
