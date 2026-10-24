"""Audio-only mix: selected English voice + authored deterministic effects. No video rendering."""
import wave,json
import numpy as np
from pathlib import Path
p=Path('assets/sample14');sr=48000;dur=8.5;out=np.zeros((int(sr*dur),2),np.float64)
with wave.open(str(p/'voice.wav')) as w:
 raw=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(float)/32768
 if w.getnchannels()>1:raw=raw.reshape(-1,w.getnchannels()).mean(axis=1)
 voice=np.interp(np.arange(min(int(dur*sr),int(len(raw)*sr/w.getframerate())))*w.getframerate()/sr,np.arange(len(raw)),raw)
out[:len(voice)]+=voice[:,None]*.86
rng=np.random.default_rng(1401)
def add(at,s,gain=.2,pan=0):
 start=int(at*sr);s=s[:len(out)-start];out[start:start+len(s),0]+=s*gain*np.sqrt((1-pan)/2);out[start:start+len(s),1]+=s*gain*np.sqrt((1+pan)/2)
# Light ocean air under voice, with no music track to distract from timing.
n=rng.normal(0,1,len(out));smooth=np.convolve(n,np.ones(200)/200,mode='same');out+=smooth[:,None]*.035
# Fuse: fine restrained crackle.
t=np.arange(int(1.7*sr))/sr;s=rng.normal(0,1,len(t))*(.4+.6*np.sin(t*145)**14)*np.sin(np.pi*t/1.7);add(1.65,s,.035,-.25)
# Cannon: bass impulse and filtered rolling noise, decay not clipped.
t=np.arange(int(1.3*sr))/sr;noise=rng.normal(0,1,len(t));filtered=np.convolve(noise,np.ones(35)/35,mode='same');s=np.sin(2*np.pi*(78*t-19*t*t))*np.exp(-t*7)+filtered*2*np.exp(-t*4);add(3.35,s,.52,.1)
# Cannon carriage wheel scrape/roll.
t=np.arange(int(.65*sr))/sr;s=np.convolve(rng.normal(0,1,len(t)),np.ones(9)/9,mode='same')*np.exp(-t*5);add(3.4,s,.14,.1)
# Projectile air, increasing pitch and pan while camera follows.
t=np.arange(int(1.7*sr))/sr;s=np.sin(2*np.pi*(190*t+110*t*t))*np.sin(np.pi*t/1.7)**2;add(4.65,s,.045,-.1)
# Wood strike plus staggered splinter ticks.
for i in range(11):
 t=np.arange(int(.22*sr))/sr;freq=650+i*170;s=(np.sin(2*np.pi*freq*t)+rng.normal(0,.6,len(t)))*np.exp(-t*(25+i));add(6.35+i*.035,s,.15/(1+i*.12),(i%3-1)*.5)
# Conservative soft limiter.
out=np.tanh(out*1.05)*.93
with wave.open(str(p/'mix.wav'),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype('<i2').tobytes())
cues=[[0,.95,'One spark.'],[.95,2.5,'One cannonball.'],[2.5,3.3,'But the real'],[3.3,4.15,'danger'],[4.15,5.65,"wasn’t the iron."],[5.65,6.55,'It was'],[6.55,8.5,'the flying wood.']]
(p/'cues.json').write_text(json.dumps(cues,ensure_ascii=False))
