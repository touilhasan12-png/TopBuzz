from PIL import Image,ImageDraw
import numpy as np,json,pathlib
p=pathlib.Path(__file__).parent
im=Image.open(p/'source.png').convert('RGBA');print(im.size)
w,h=im.size
# Work in the illustration's native 768x1376 coordinate system.
im=im.resize((768,1376));a=np.array(im)
r,g,b=[a[:,:,i].astype(float) for i in range(3)]
# Preserve opaque illustration RGB exactly; remove only dominant chroma green.
key=(g>r+45)&(g>b+45)&(g>110)
a[:,:,3]=np.where(key,0,255).astype('uint8');im=Image.fromarray(a)

regions={
'legs':[(270,704),(507,704),(610,1360),(195,1360)],
'body':[(270,333),(329,305),(445,309),(516,353),(516,410),(507,718),(277,722),(275,545),(265,450)],
'head':[(272,45),(500,45),(490,312),(437,372),(339,364),(330,305),(281,263)],
'leftUpper':[(225,357),(275,375),(296,468),(266,580),(164,580),(178,475),(190,414)],
'leftLower':[(172,568),(255,568),(246,740),(284,878),(180,903),(156,715)],
'rightUpper':[(498,357),(540,365),(568,478),(588,579),(503,588),(505,475)],
'rightLower':[(506,542),(590,542),(601,741),(605,884),(518,894),(516,773)]}
m={'format':'rev2d','version':1,'meta':{'name':'Unified illustrated sailor','width':768,'height':1376,'background':'transparent'},'bones':[{'id':'root','x':390,'y':715},{'id':'chest','parent':'root'},{'id':'headBone','parent':'chest','x':0,'y':-380},{'id':'lu','parent':'chest','x':-149,'y':-310,'length':170,'rotation':95},{'id':'ll','parent':'lu','x':170,'length':240,'rotation':-4},{'id':'ru','parent':'chest','x':130,'y':-310,'length':170,'rotation':80},{'id':'rl','parent':'ru','x':170,'length':240,'rotation':10}],'textures':[],'parts':[],'parameters':[],'bindings':[]}
parents={'legs':'root','body':'chest','head':'headBone','leftUpper':'lu','leftLower':'ll','rightUpper':'ru','rightLower':'rl'}
for i,(id,poly) in enumerate(regions.items()):
 mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(poly,fill=255);piece=im.copy();aa=np.minimum(np.array(mask),np.array(im)[:,:,3]);piece.putalpha(Image.fromarray(aa));# Paint hidden rounded joint overlap UNDER the original illustrated pixels.
 if id in ('rightLower','leftLower'):
  pad=Image.new('RGBA',im.size);pd=ImageDraw.Draw(pad)
  cx,cy=(549,574) if id=='rightLower' else (218,574)
  pd.ellipse((cx-33,cy-30,cx+33,cy+36),fill=(224,165,116,255))
  pad.alpha_composite(piece);piece=pad
 piece.save(p/(id+'.png'))
 m['textures'].append({'id':id,'path':id+'.png','width':768,'height':1376});m['parts'].append({'id':id,'parent':parents[id],'shape':{'type':'image','texture':id,'x':0,'y':0,'w':768,'h':1376,'cols':8,'rows':12},'z':i,'fill':'#ffffff'})
def bind(id,target,lo,hi):
 m['parameters'].append({'id':id,'min':-1,'max':1,'default':0});m['bindings'].append({'target':target,'params':[id],'keys':[{'at':[-1],'value':lo},{'at':[0],'value':0},{'at':[1],'value':hi}]})
# Bindings are absolute rotations, with correct rest defaults included for limb chains.
for id,bone,rest,lo,hi in [('Chest','chest',0,-6,6),('Head','headBone',0,-12,12),('ShoulderR','ru',80,98,38),('ElbowR','rl',10,4,-70),('ShoulderL','lu',95,110,65),('ElbowL','ll',-4,-5,65)]:
 m['parameters'].append({'id':id,'min':-1,'max':1,'default':0});m['bindings'].append({'target':'bone:'+bone+'.rotation','params':[id],'keys':[{'at':[-1],'value':lo},{'at':[0],'value':rest},{'at':[1],'value':hi}]})
# Eyelid replacement is a local facial texture, following the head bone.
closed=im.copy();d=ImageDraw.Draw(closed)
for box,line in [((366,183,411,210),[(375,197),(391,202),(405,196)]),((432,180,472,210),[(438,196),(450,200),(464,194)])]:
 d.ellipse(box,fill=(229,173,126,255));d.line(line,fill=(35,26,24,255),width=5)
mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon(regions['head'],fill=255);closed.putalpha(Image.fromarray(np.minimum(np.array(mask),np.array(im)[:,:,3])));closed.save(p/'blink.png')
m['textures'].append({'id':'blink','path':'blink.png','width':768,'height':1376});m['parts'].append({'id':'blink','parent':'headBone','shape':{'type':'image','texture':'blink','x':0,'y':0,'w':768,'h':1376,'cols':8,'rows':12},'z':20,'opacity':0,'fill':'#ffffff'})
m['parameters'].append({'id':'Blink','min':0,'max':1,'default':0});m['bindings'].append({'target':'part:blink.opacity','params':['Blink'],'keys':[{'at':[0],'value':0},{'at':[1],'value':1}]})
(p/'sailor.r2d.json').write_text(json.dumps(m))
