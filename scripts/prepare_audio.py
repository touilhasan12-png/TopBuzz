import hashlib,json,math,re,subprocess,textwrap
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

P=Path('public'); O=Path('out'); P.mkdir(exist_ok=True); O.mkdir(exist_ok=True)
doc=json.loads(Path('data/pilot.json').read_text())
canon=lambda x:' '.join(x.split())
sentences=doc['sentences']
assert len(sentences)<=doc['max_audio_clips']==10
assert all(0<len(s)<=1400 for s in sentences)
assert canon(' '.join(sentences))==canon(doc['excerpt'])
assert hashlib.sha256(doc['excerpt'].encode()).hexdigest()==doc['excerpt_sha256']
k=Kokoro('models/kokoro-v1.0.onnx','models/voices-v1.0.bin')
assert doc['voice'] in k.get_voices(), 'Requested US male draft voice is unavailable; no fallback permitted.'
sr=24000
parts=[np.zeros(round(.55*sr),dtype=np.float32)]
cursor=len(parts[0])/sr; timed=[]; caps=[]
for i,text in enumerate(sentences):
    audio,rate=k.create(text,voice=doc['voice'],lang=doc['voice_language'],speed=.97)
    assert rate==sr and len(audio)>sr*.2
    audio=np.asarray(audio,dtype=np.float32)
    start=cursor; end=start+len(audio)/sr
    timed.append({'text':text,'start':start,'end':end})
    words=text.split(); groups=[words[j:j+12] for j in range(0,len(words),12)]; used=0
    for group in groups:
        a=start+(end-start)*used/len(words); used+=len(group)
        b=start+(end-start)*used/len(words)
        caps.append({'start':a,'end':b,'text':'\n'.join(textwrap.wrap(' '.join(group),width=78))})
    parts.extend([audio,np.zeros(round(.24*sr),dtype=np.float32)])
    cursor=end+.24
    print('Synthesized draft sentence',i+1,'of',len(sentences))
parts.append(np.zeros(round(.8*sr),dtype=np.float32))
voice=np.concatenate(parts); peak=float(np.max(np.abs(voice)))
if peak>0:voice=voice*(.78/peak)
n=len(voice); t=np.arange(n,dtype=np.float64)/sr
# Original, procedurally synthesized low-level music, not an external recording.
music=np.zeros(n); notes=[73.416,87.307,110.0,65.406]
for i,start in enumerate(np.arange(0,n/sr,4.0)):
    tt=t-start; active=(tt>=0)&(tt<5.5); u=np.maximum(tt,0)
    env=np.minimum(u/.8,1)*np.exp(-u/3.1)*active
    hz=notes[i%len(notes)]
    music+=.020*env*(np.sin(2*np.pi*hz*t)+.32*np.sin(2*np.pi*hz*2*t)+.12*np.sin(2*np.pi*hz*3*t))
# RMS-driven ducking with short attack and slower release.
block=240; padded=np.pad(voice,(0,(-n)%block))
rms=np.sqrt(np.mean(padded.reshape(-1,block)**2,axis=1)); gain=[]; g=.7
for value in rms:
    target=.26 if value>.012 else .75
    a=.30 if target<g else .035; g+=(target-g)*a; gain.append(g)
duck=np.interp(np.arange(n),np.arange(len(gain))*block,gain)
music*=duck
rng=np.random.default_rng(20261022)
for at in [0.1,timed[2]['start'],timed[4]['start'],timed[5]['start']]:
    a=int(at*sr); length=min(int(.2*sr),n-a)
    if length>0:
        z=np.arange(length)/sr
        music[a:a+length]+=.006*rng.normal(size=length)*np.exp(-z*27)
fade=np.minimum(1,t/.6)*np.minimum(1,(n/sr-t)/1.0); music*=np.maximum(0,fade)
stereo=np.column_stack([voice+music,voice+np.roll(music,35)])
mx=np.max(np.abs(stereo)); stereo*=min(1,.92/max(mx,.001))
sf.write(P/'narration.wav',voice,sr,subtype='PCM_16')
sf.write(O/'narration.flac',voice,sr,subtype='PCM_16')
sf.write(O/'music-effects.flac',np.column_stack([music,np.roll(music,35)]),sr,subtype='PCM_16')
sf.write(O/'mix-before-normalization.wav',stereo,sr,subtype='PCM_16')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(O/'mix-before-normalization.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000','-ac','2',str(P/'master.wav')],check=True)
frames=math.ceil(n/sr*30)
meta={'durationFrames':frames,'fps':30,'durationSeconds':frames/30,'sentences':timed,'captions':caps,'voice':doc['voice'],'voiceStatus':doc['voice_status'],'originalSha256':doc['original_sha256'],'excerptSha256':doc['excerpt_sha256'],'captionTiming':'Exact sentence boundaries; within-sentence cues distributed proportionally, not forced-aligned.'}
(P/'pilot-meta.json').write_text(json.dumps(meta,indent=2))
(O/'pilot-meta.json').write_text(json.dumps(meta,indent=2))
def stamp(s,vtt=False):
    ms=round(s*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); sec,ms=divmod(ms,1000)
    return f'{h:02}:{m:02}:{sec:02}'+('.' if vtt else ',')+f'{ms:03}'
srt=[]; vtt=['WEBVTT\n']
for i,c in enumerate(caps,1):
    srt.append(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n")
    vtt.append(f"{stamp(c['start'],True)} --> {stamp(c['end'],True)}\n{c['text']}\n")
(O/'hormuz-pilot.en.srt').write_text('\n'.join(srt))
(O/'hormuz-pilot.en.vtt').write_text('\n'.join(vtt))
(O/'mix-before-normalization.wav').unlink()
assert canon(' '.join(c['text'] for c in caps))==canon(doc['excerpt'])
assert 20 < frames/30 < 75, 'Unexpected pilot duration: stop rather than truncate narration.'
print('Audio ready:',round(frames/30,2),'seconds;',len(sentences),'clips; input text coverage PASS.')
