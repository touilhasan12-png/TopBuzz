from pathlib import Path
p=Path('/tmp/captions16.ass')
head='''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Montserrat ExtraBold,59,&H00FFFFFF,&H00FFFFFF,&H00302028,&H60000000,-1,0,0,0,100,100,0,0,1,5,0,5,80,80,100,1
Style: Impact,Montserrat ExtraBold,68,&H0058DFFF,&H0058DFFF,&H00302028,&H60000000,-1,0,0,0,100,100,0,0,1,5,0,5,80,80,100,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
def time(t):
 h=int(t//3600);m=int(t//60)%60;s=t%60;return f'{h}:{m:02d}:{s:05.2f}'
cues=[(0,.95,'One spark.'),(.95,2.5,'One cannonball.'),(2.5,3.3,'But the real'),(3.3,4.15,'danger'),(4.15,5.65,"wasn’t the iron."),(5.65,6.55,'It was'),(6.55,8.5,'the flying wood.')]
for a,b,text in cues:
 y=1525 if a>=5.65 else 1460
 tags=r'{\pos(540,'+str(y)+r')\fscx96\fscy96\t(0,100,\fscx100\fscy100)}'
 head+=f'Dialogue: 1,{time(a)},{time(b)},Caption,,0,0,0,,{tags}{text}\n'
head+=r'Dialogue: 2,0:00:06.38,0:00:06.65,Impact,,0,0,0,,{\pos(270,1070)\frz10\fad(20,80)}CRACK!'+'\n'
p.write_text(head)
