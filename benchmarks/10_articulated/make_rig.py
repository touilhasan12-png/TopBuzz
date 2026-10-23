import json,pathlib
out=pathlib.Path(__file__).parent
m={'format':'rev2d','version':1,'meta':{'name':'Sailor articulated performance','width':800,'height':1050,'background':'transparent'},'parameters':[],'bones':[{'id':'root','x':370,'y':930},{'id':'torso','parent':'root','y':-330},{'id':'upper','parent':'torso','x':100,'y':-110,'rotation':70,'length':145},{'id':'lower','parent':'upper','x':145,'rotation':15,'length':140},{'id':'hand','parent':'lower','x':140,'length':55},{'id':'target','parent':'root','x':170,'y':-80}], 'parts':[], 'ik':[{'id':'point','bones':['upper','lower'],'target':'target','mix':1,'bendPositive':True,'softness':15}],'bindings':[]}
def bind(p,target,a,b):
 m['parameters'].append({'id':p,'min':0,'max':1,'default':0});m['bindings'].append({'target':target,'params':[p],'keys':[{'at':[0],'value':a},{'at':[1],'value':b}]})
bind('ReachX','bone:target.x',170,350);bind('ReachY','bone:target.y',-80,-425);bind('Lean','bone:torso.rotation',0,-7)
def part(id,parent,shape,fill,z):m['parts'].append({'id':id,'parent':parent,'shape':shape,'fill':fill,'stroke':{'color':'#152337','width':6},'z':z})
def rect(id,parent,x,y,w,h,fill,z,r=14):part(id,parent,{'type':'rect','x':x,'y':y,'w':w,'h':h,'radius':r},fill,z)
def ellipse(id,parent,x,y,rx,ry,fill,z):part(id,parent,{'type':'ellipse','cx':x,'cy':y,'rx':rx,'ry':ry,'detail':5},fill,z)
# Fixed legs and grounded shoes; torso bends about the pelvis, not a translated full-body sprite.
for x in [315,390]:
 rect('leg'+str(x),'root',x,725,64,198,'#263e61',1)
 rect('shoe'+str(x),'root',x-12,900,90,37,'#132235',2)
rect('torso','torso',269,470,202,290,'#e2e9df',5,40)
rect('belt','torso',270,715,200,28,'#21334e',6)
ellipse('neck','torso',370,464,38,50,'#e8af81',7)
# Left resting arm; right two-bone chain uses true engine IK.
rect('leftSleeve','torso',228,482,68,170,'#e2e9df',4,30)
rect('leftForearm','torso',237,622,52,130,'#e8af81',4,24)
ellipse('leftHand','torso',263,754,31,40,'#e8af81',4)
# Rest-world coordinates from chain rest transforms.
import math
sx,sy=470,490;ex=sx+145*math.cos(math.radians(70));ey=sy+145*math.sin(math.radians(70));wx=ex+140*math.cos(math.radians(85));wy=ey+140*math.sin(math.radians(85))
def capsule(id,parent,a,b,width,color,z):
 dx,dy=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dy);nx=-dy/l*width/2;ny=dx/l*width/2
 part(id,parent,{'type':'polygon','points':[a[0]+nx,a[1]+ny,b[0]+nx,b[1]+ny,b[0]-nx,b[1]-ny,a[0]-nx,a[1]-ny],'detail':3},color,z)
 ellipse(id+'joint',parent,a[0],a[1],width/2,width/2,color,z+.1)
 ellipse(id+'tip',parent,b[0],b[1],width/2,width/2,color,z+.1)
capsule('sleeve','upper',(sx,sy),(ex,ey),65,'#e2e9df',8)
capsule('forearm','lower',(ex,ey),(wx,wy),48,'#e8af81',9)
ellipse('palm','hand',wx,wy+16,30,39,'#e8af81',10)
capsule('index','hand',(wx+10,wy+25),(wx+15,wy+84),17,'#e8af81',11)
# Navy collar panels.
part('collarL','torso',{'type':'polygon','points':[276,478,367,537,340,582,286,526]},'#263e61',12)
part('collarR','torso',{'type':'polygon','points':[464,478,373,537,400,582,454,526]},'#263e61',12)
rect('tie','torso',360,540,20,110,'#203451',13,5)
(out/'body.r2d.json').write_text(json.dumps(m))
