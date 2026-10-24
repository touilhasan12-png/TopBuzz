"""Blender-native short. Builds scene and authored poses; renders only when run by GitHub.
No AI video, no output inspections. All motion is explicit, deterministic keyframing.
"""
import bpy, math, random, os, argparse, sys
from mathutils import Vector
random.seed(1601)
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
ap=argparse.ArgumentParser();ap.add_argument('--start',type=int,default=1);ap.add_argument('--end',type=int,default=85);ap.add_argument('--output',default='/tmp/frames');args=ap.parse_args(argv)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=12;sc.cycles.use_denoising=True;sc.render.use_persistent_data=True;sc.cycles.max_bounces=3;sc.cycles.diffuse_bounces=2;sc.cycles.glossy_bounces=1;sc.cycles.transparent_max_bounces=4
sc.render.resolution_x=1080;sc.render.resolution_y=1920;sc.render.resolution_percentage=100;sc.render.fps=30;sc.frame_start=1;sc.frame_end=255
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
try: sc.view_settings.view_transform='Standard';sc.view_settings.look='Medium High Contrast'
except: sc.view_settings.view_transform='Standard'
sc.view_settings.exposure=0;sc.view_settings.gamma=1
world=bpy.data.worlds.new('Pale turquoise daylight') if not bpy.data.worlds else bpy.data.worlds[0];sc.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.48,.72,.86,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65

def rgb(h):
 h=h.lstrip('#');return tuple((int(h[i:i+2],16)/255)**2.2 for i in (0,2,4))
def material(name,h,rough=1,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb(h),1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*rgb(h),1);n.inputs['Roughness'].default_value=rough
 if emit:
  k='Emission Color' if 'Emission Color' in n.inputs else 'Emission';n.inputs[k].default_value=(*rgb(h),1)
  if 'Emission Strength' in n.inputs:n.inputs['Emission Strength'].default_value=emit
 return m
INK=material('Warm plum ink','#282034');CREAM=material('Warm ivory face','#fff1d5');RED=material('Vermilion bandana','#ce4939');NAVY=material('Deep ink blue waistcoat','#273b61');GOLD=material('Old warm brass','#e4b953',.5);WHITE=material('Linen','#f3e6c8');WOOD=material('Golden deck boards','#c8965a');DARKWOOD=material('Dark plank grooves','#795334');RAIL=material('Red ochre gunwales','#ac442e');METAL=material('Graphite cannon','#596474',.55);HOOP=material('Blue grey barrel hoops','#657286',.6);WATER=material('Turquoise sea','#299fae',.4);FOAM=material('Sea glints','#b6e4dd');FIRE=material('Warm fire','#ffb938',.8,2);YELLOW=material('Fire core','#fff0a2',.8,3);SMOKE=material('Warm smoke','#e9e6dd');HAIR=material('Dark hair','#3c2b34')

def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=loc
 if parent:o.parent=parent
 return o

def finish(o,name,mat,parent=None):
 o.name=name
 if mat:o.data.materials.append(mat)
 if parent:o.parent=parent
 return o

def cube(name,loc,scale,mat,parent=None,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=finish(bpy.context.object,name,mat,parent);o.scale=scale
 if bevel:
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);m=o.modifiers.new('Soft worn edges','BEVEL');m.width=bevel;m.segments=2;o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o

def sphere(name,loc,scale,mat,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=loc);o=finish(bpy.context.object,name,mat,parent);o.scale=scale
 for p in o.data.polygons:p.use_smooth=True
 return o

def cylinder(name,loc,r,depth,mat,parent=None,rot=None,verts=32):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc);o=finish(bpy.context.object,name,mat,parent)
 if rot:o.rotation_euler=rot
 for p in o.data.polygons:p.use_smooth=True
 m=o.modifiers.new('Edge softness','BEVEL');m.width=.012;m.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o

def curve(name,pts,thick,mat,parent=None,cyclic=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=12;c.bevel_depth=thick;c.bevel_resolution=3;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for b,p in zip(s.bezier_points,pts):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 s.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(mat)
 if parent:o.parent=parent
 return o

def poly(name,coords,mat,parent=None):
 me=bpy.data.meshes.new(name);me.from_pydata(coords,[],[tuple(range(len(coords)))]);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 if parent:o.parent=parent
 return o

def torus(name,loc,r,thick,mat,parent=None,rot=(0,0,0)):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=thick,major_segments=40,minor_segments=8,location=loc,rotation=rot);return finish(bpy.context.object,name,mat,parent)
def key(o,f,loc=None,rot=None,scale=None):
 if loc is not None:o.location=loc;o.keyframe_insert('location',frame=f)
 if rot is not None:o.rotation_euler=rot;o.keyframe_insert('rotation_euler',frame=f)
 if scale is not None:o.scale=scale;o.keyframe_insert('scale',frame=f)
def visible(o,f,on):
 o.hide_render=not on;o.keyframe_insert('hide_render',frame=f)
def lerp(a,b,u):return Vector(a).lerp(Vector(b),u)
def smooth(a,b,t):
 u=max(0,min(1,(t-a)/(b-a)));return u*u*(3-2*u)

# Real, connected ocean and islands. No background plane with a competing painted sea.
cube('Ocean',(0,-25,-1.32),(180,180,.1),WATER)
for i in range(130):
 x=random.uniform(-28,28);y=random.uniform(-65,15);w=random.uniform(.08,.55);curve('Surface glint',[(x,y,-1.255),(x+w*.4,y+.025,-1.25),(x+w,y,-1.255)],.008,FOAM)
rocks=[material('Sandstone lit','#ddbd95'),material('Sandstone rose','#cba49d'),material('Sandstone shadow','#a894a5')];greens=[material('Foliage jade','#4f9368'),material('Foliage light','#80ab69'),material('Foliage dark','#387966')]
for i,(x,y,h,r) in enumerate([(-13,-35,15,2.5),(-19,-42,12,3),(-8,-48,18,2),(14,-39,14,2.5),(20,-49,18,3),(9,-54,10,2)]):
 bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r*.8,radius2=r,depth=h,location=(x,y,h/2-1.3));o=finish(bpy.context.object,'Faceted sandstone island',rocks[i%3]);o.data.materials.append(rocks[(i+1)%3]);
 for face in o.data.polygons:face.material_index=face.index%2
 for j in range(9):sphere('Treetop',(x+random.uniform(-r,r),y+random.uniform(-r*.5,r*.5),h-1.1+random.uniform(0,.6)),(.65,.7,.45),greens[j%3])
 for j in range(4):curve('Rock fissure',[(x-r*.6+j*.5,y+r*.65,-.7),(x-r*.6+j*.5+.2,y+r*.65,h*.45),(x-r*.6+j*.5-.1,y+r*.6,h*.8)],.018,rocks[2])
 if i in [0,3]:cube('Thin waterfall',(x+r*.22,y+r*.72,h*.45),(.13,.03,h*.9),FOAM)
# Gentle cloud clusters, not a flat cream background.
CLOUD=material('Cream clouds','#f6eddc')
for cx,cy,cz in [(-18,-65,19),(4,-72,22),(23,-68,21)]:
 for j in range(5):sphere('Cloud puff',(cx+j*.8,cy,cz+math.sin(j)*.4),(1.4,.8,.9),CLOUD)

sunlight=bpy.data.lights.new('Consistent sunlight across both ships','SUN');sunlight.energy=1.7;sunlight.angle=.12;sunob=bpy.data.objects.new('Consistent sunlight',sunlight);bpy.context.collection.objects.link(sunob);sunob.rotation_euler=(math.radians(24),math.radians(-22),math.radians(-28));
sun_data=bpy.data.lights.new('Warm afternoon key','AREA');sun=bpy.data.objects.new('Warm afternoon key',sun_data);bpy.context.collection.objects.link(sun);sun.location=(-7,2,12);sun_data.energy=1500;sun_data.size=7;sun.rotation_euler=(Vector((0,-1,0))-sun.location).to_track_quat('-Z','Y').to_euler()

def barrel(parent,x,y,s=1):
 root=empty('Staved barrel',(x,y,.02),parent)
 for j in range(14):
  a=j*math.tau/14;pts=[]
  for z,r in [(0,.29),(.12,.34),(.52,.39),(.92,.34),(1.04,.29)]:pts.append((math.cos(a)*r,math.sin(a)*r,z))
  curve('Barrel stave seam',pts,.009,DARKWOOD,root)
 # Rounded profile made by a lathed mesh.
 vs=[];fs=[];profile=[(0,.29),(.1,.34),(.52,.39),(.95,.33),(1.04,.29)]
 for z,r in profile:
  for j in range(28):vs.append((math.cos(j*math.tau/28)*r,math.sin(j*math.tau/28)*r,z))
 for row in range(4):
  for j in range(28):n=row*28+j;fs.append((n,row*28+(j+1)%28,(row+1)*28+(j+1)%28,n+28))
 me=bpy.data.meshes.new('Barrel curved staves');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Wood barrel',me);bpy.context.collection.objects.link(o);o.parent=root;o.data.materials.append(WOOD)
 for z,r in [(.15,.36),(.84,.37)]:
  torus('Iron hoop',(0,0,z),r,.036,HOOP,root)
  for j in range(8):a=j*math.tau/8;sphere('Rivet',(math.cos(a)*(r+.02),math.sin(a)*(r+.02),z),(.018,.018,.018),METAL,root)
 cylinder('Barrel lid',(0,0,1.04),.29,.03,DARKWOOD,root);root.scale=(s,s,s);return root

def ship(name,loc,width=6,length=8):
 root=empty(name,loc);cube('Hull',(0,0,-.52),(width,.0+length,1.05),RAIL,root,.12)
 for ix in range(int(width/.3)):
  x=-width/2+.16+ix*.3
  for iy in range(2):
   y=-length/4+iy*length/2;pl=cube('Individual deck plank',(x,y,0),(.294,length/2-.025,.09),WOOD,root,.012)
   for e in [-1,1]:cylinder('Deck nail',(x,y+e*(length/4-.13),.05),.011,.005,DARKWOOD,root,verts=8)
   # Sparse irregular grain, rather than uniform noisy procedural lines.
   if ix%2==0:curve('Plank grain',[(x-.07,y-length/4+.1,.048),(x-.045,y,.048),(x-.06,y+length/4-.1,.048)],.0025,DARKWOOD,root)
 for x in [-width/2,width/2]:
  cube('Side bulwark',(x,0,.43),(.12,length,.8),RAIL,root,.025);cube('Rail cap',(x,0,.88),(.21,length+.1,.10),GOLD,root,.02)
  for z in [.23,.46,.68]:curve('Rail board joint',[(x+(.065 if x<0 else -.065),-length/2,z),(x+(.065 if x<0 else -.065),length/2,z)],.007,DARKWOOD,root)
 for x in [-(width+1.1)/4,(width+1.1)/4]:cube('Front gunport side',(x,-length/2,.43),((width-1.1)/2,.13,.8),RAIL,root,.02);cube('Gunport cap',(x,-length/2,.88),((width-1.1)/2+.05,.22,.1),GOLD,root,.02)
 return root
main=ship('Gun crew ship',(0,0,0),6,8);enemy=ship('Target ship',(0,-24,0),4.2,6)
barrel(main,2.1,-1.9,.9);barrel(main,-2.4,.8,.75);barrel(enemy,-1.45,-.4,.72)
for parent,x,y in [(main,2.3,1.3),(enemy,1.25,.9)]:
 for j in range(6):torus('Coiled rope',(x,y,.08+j*.012),.17+j*.025,.018,GOLD,parent)
for parent,x,y in [(main,-2.4,-2.1),(enemy,-1.3,1.3)]:
 cube('Cargo chest',(x,y,.32),(.75,.65,.6),DARKWOOD,parent,.03)
 for dx in [-.25,.25]:cube('Chest iron strap',(x+dx,y+.331,.32),(.07,.025,.62),HOOP,parent,.007)
# Main mast sits off acting axis. Target sail is high enough to reveal sea behind face.
for parent,mx in [(main,2.65),(enemy,-1.5)]:
 cylinder('Mast',(mx,-.8,4.2),.10,8.4,DARKWOOD,parent)
 for dx in [-1.6,1.6]:curve('Rigging',[(mx+dx,-2.8,.9),(mx,-.8,7.8)],.015,INK,parent)
 sail=poly('Bowed linen sail',[(mx-2.0,-.83,4.3),(mx+2,-.83,4.3),(mx+1.85,-.82,7.6),(mx-1.85,-.82,7.6)],WHITE,parent)
 for j in range(1,7):x=mx-2+j*4/7;curve('Sail seam',[(x,-.805,4.3),(x*.97+mx*.03,-.805,7.6)],.006,GOLD,parent)
 curve('Lower sail edge',[(mx-2,-.83,4.3),(mx,-.73,4.18),(mx+2,-.83,4.3)],.018,WHITE,parent)

# Cannon has trunnions, metal hoops, hollow mouth and an attached touch-hole.
gun=empty('Recoil carriage',(.25,-1.55,0),main)
cube('Carriage bed',(0,0,.32),(1.12,1.7,.20),RAIL,gun,.04)
for x in [-.46,.46]:
 cube('Carriage cheek',(x,0,.59),(.17,1.35,.43),WOOD,gun,.04)
 for y in [-.54,.59]:cylinder('Truck wheel',(x*1.38,y,.24),.25,.14,DARKWOOD,gun,(0,math.pi/2,0));cylinder('Wheel hub',(x*1.4,y,.24),.08,.17,HOOP,gun,(0,math.pi/2,0))
bar=empty('Cannon barrel',(0,0,.97),gun)
# Mesh surface of revolution around -Y, with inner bore.
profile=[(-.8,.08),(-.68,.24),(-.3,.28),(.3,.24),(1.15,.25),(1.25,.28),(1.31,.27),(1.31,.16),(1.08,.15),(.5,.15)]
vs=[];faces=[]
for d,r in profile:
 for i in range(40):a=i*math.tau/40;vs.append((r*math.cos(a),-d,r*math.sin(a)+d*.04))
for j in range(len(profile)-1):
 for i in range(40):faces.append((j*40+i,j*40+(i+1)%40,(j+1)*40+(i+1)%40,(j+1)*40+i))
me=bpy.data.meshes.new('Hollow cannon profile');me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new('Cannon metal',me);bpy.context.collection.objects.link(o);o.parent=bar;o.data.materials.append(METAL)
for f in o.data.polygons:f.use_smooth=True
for d,r in [(-.32,.282),(.83,.25),(1.25,.283)]:torus('Cannon ring',(0,-d,d*.04),r,.018,INK,bar,(math.pi/2,0,0))
sphere('Breech knob',(0,.88,0),(.09,.10,.09),METAL,bar);cylinder('Trunnions',(0,0,.0),.1,1.15,METAL,bar,(0,math.pi/2,0))
fuse=curve('Visible fuse',[(.25,-.99,1.23),(.27,-.91,1.34),(.30,-.81,1.37)],.019,DARKWOOD)

# Characters: shaped clothing, separate asymmetrical costume accents, curved ink limbs.
# No capsule body and no camera-facing plane penetrating a shaded cylinder.
def character(name,loc,color,variant):
 root=empty(name,loc);body=empty(name+' acting torso',(0,0,1.05),root)
 outline=[(-.23,0,.88),(-.37,0,.72),(-.36,0,.18),(-.27,0,-.04),(0,0,-.09),(.30,0,.02),(.36,0,.28),(.34,0,.73),(.20,0,.88)]
 poly('Linen shirt',[(x,.10,z) for x,y,z in outline],WHITE,body);curve('Clothing ink outline',[(x,.12,z) for x,y,z in outline],.022,INK,body,True)
 if variant==0:
  for a,b in [(-.32,-.06),(.06,.32)]:poly('Navy waistcoat panel',[(a,.125,.77),(b,.125,.76),(b,.125,.13),(a,.125,.08)],NAVY,body)
  curve('Vest lapel',[(-.25,.14,.80),(-.06,.15,.52),(-.12,.15,.30)],.015,INK,body)
  poly('Red sash',[(-.33,.145,.15),(.34,.145,.27),(.34,.145,.10),(-.28,.145,-.025)],RED,body)
  for z in [.26,.40,.54]:sphere('Brass vest button',(.10,.17,z),(.024,.018,.024),GOLD,body)
 else:
  for z in [.13,.31,.49,.67]:poly('Striped shirt detail',[(-.34,.127,z),(.34,.127,z+.025),(.34,.127,z+.105),(-.34,.127,z+.08)],color,body)
  poly('Neckerchief',[(-.20,.14,.84),(.21,.14,.84),(.03,.16,.62)],RED,body)
 head=empty('Head performance',(0,.13,1.37),body);sphere('Face',(0,0,0),(.53,.15,.53),CREAM,head)
 curve('Head contour',[(math.cos(a)*.53,.07,math.sin(a)*.53) for a in [i*math.tau/40 for i in range(40)]],.023,INK,head,True)
 # Curved bandana crown follows head silhouette, with off-center knot and tails.
 pts=[(-.49,.105,.20),(.49,.105,.20)]+[(math.cos(a)*.51,.11,math.sin(a)*.51) for a in [i*math.pi/18 for i in range(3,16)]]
 # Fan with ordered arc avoids crossed faces.
 coords=[(-.49,.115,.20),(.49,.115,.20)]+[(.51*math.cos(a),.115,.51*math.sin(a)) for a in [math.pi*.15+i*math.pi*.70/22 for i in range(23)]]
 poly('Bandana crown',coords,color,head);curve('Bandana lower seam',[(-.49,.14,.20),(0,.16,.18),(.49,.14,.20)],.018,INK,head)
 for i in range(7):
  x=-.34+i*.11;z=.29+(i%2)*.08
  if x*x+z*z<.24:sphere('Bandana dot',(x,.142,z),(.018,.006,.018),WHITE,head)
 sphere('Bandana knot',(.5,-.01,.20),(.10,.09,.085),color,head)
 poly('Bandana tail',[(.51,.0,.21),(.73,-.04,.04),(.59,.015,.03)],color,head)
 curve('Hair wisp',[(-.45,.10,.16),(-.49,.11,.02),(-.43,.10,.07)],.035,HAIR,head)
 torus('Gold hoop earring',(-.51,.035,-.09),.065,.013,GOLD,head,(math.pi/2,0,0))
 eyes=[];brows=[];wide=[]
 for x in [-.17,.17]:
  w=empty('Wide outlined eye',(x,.182,.015),head);sphere('Wide eye contour',(0,0,0),(.082,.020,.105),INK,w);sphere('Wide eye white',(0,.013,0),(.063,.016,.085),CREAM,w);sphere('Wide eye pupil',(.01,.032,-.005),(.025,.012,.037),INK,w);wide.append(w)
  eye=sphere('Eye ink',(x,.155,.015),(.035,.018,.063),INK,head);eyes.append(eye)
  brow=curve('Expressive eyebrow',[(x-.085,.15,.13),(x,.165,.15),(x+.075,.15,.13)],.018,INK,head);brows.append(brow)
 mouth=curve('Mouth',[(-.09,.155,-.17),(.01,.175,-.205),(.12,.155,-.15)],.017,INK,head)
 shock=torus('Gasp mouth',(0,.16,-.19),.055,.018,INK,head,(math.pi/2,0,0))
 limbs=[]
 for i in range(4):limbs.append(curve('Continuous ink limb',[(0,0,0),(.01,0,.01),(.02,0,.02)],.025,INK,root))
 hands=[sphere('Mitten hand',(0,0,0),(.060,.045,.055),INK,root) for _ in range(2)]
 feet=[curve('Foot',[(0,0,0),(.1,0,0)],.028,INK,root) for _ in range(2)]
 return dict(root=root,body=body,head=head,eyes=eyes,brows=brows,wide=wide,mouth=mouth,shock=shock,limbs=limbs,hands=hands,feet=feet,loc=loc)
hero=character('Red bandana gunner',(-1.05,-.15,.07),RED,0)
BLUE=material('Blue bandana','#397ea6');PURPLE=material('Plum bandana','#9265a8')
mate=character('Blue crew mate',(1.62,-1.7,.07),BLUE,1);victim=character('Target crew',(.65,-23.5,.07),PURPLE,1)

def ik(a,b,l1,l2,pole):
 a,b,pole=Vector(a),Vector(b),Vector(pole);dvec=b-a;d=min(max(dvec.length,.00001),l1+l2-.00001);axis=dvec.normalized();along=(l1*l1-l2*l2+d*d)/(2*d);perp=(pole-axis*pole.dot(axis)).normalized();return a+axis*along+perp*math.sqrt(max(0,l1*l1-along*along))
def pose_curve(o,points,f):
 for b,p in zip(o.data.splines[0].bezier_points,points):b.co=p;b.keyframe_insert('co',frame=f)
def actor(a,f,rootx,hip,lean,hl,hr,fl,fr,look=0,react=0):
 key(a['root'],f,(rootx,a['loc'][1],a['loc'][2]));key(a['body'],f,(lean*.2,0,hip),(0,lean,0));key(a['head'],f,(-lean*.10,.13,1.37),(0,-lean*.7,look))
 starts=[(-.13,0,hip),(.13,0,hip),(-.30,0,hip+.72),(.30,0,hip+.72)];ends=[fl,fr,hl,hr]
 for i,(st,en) in enumerate(zip(starts,ends)):
  middle=ik(st,en,.58 if i<2 else .52,.58 if i<2 else .52,(.13,.65,0) if i<2 else (-.6 if i==2 else .6,.25,-.2));pose_curve(a['limbs'][i],[st,middle,en],f)
  if i>=2:key(a['hands'][i-2],f,en)
  else:pose_curve(a['feet'][i],[en,Vector(en)+Vector((.12,.03,0))],f)
 blink=.12 if abs(f-36)<2 or abs(f-87)<2 or abs(f-220)<2 or (a is hero and 100<=f<=114) or (a is mate and 101<=f<=111) else 1
 if a is hero and 99<=f<=115:pose_curve(a['mouth'],[(-.09,.17,-.19),(.01,.18,-.15),(.11,.17,-.19)],f)
 else:pose_curve(a['mouth'],[(-.09,.155,-.17),(.01,.175,-.205),(.12,.155,-.15)],f)
 for i,e in enumerate(a['eyes']):
  visible(e,f,react<=.6)
  for child in a['wide'][i].children:visible(child,f,react>.6)
  key(e,f,scale=(.035*(1+react*.55),.018,.063*(1+react*.8)*blink))
  key(a['brows'][i],f,rot=(0,react*(.25 if i==0 else -.25),0))
 visible(a['shock'],f,react>.6);visible(a['mouth'],f,react<=.6)

# Flame belongs to the held torch, and the flame point actually arrives at the fuse.
torch=empty('Held linstock');curve('Linstock wood',[(0,0,0),(.44,-.25,-.27)],.022,DARKWOOD,torch);flame=sphere('Torch flame',(.44,-.25,-.27),(.055,.055,.11),FIRE,torch);sphere('Torch core',(.44,-.245,-.28),(.025,.025,.06),YELLOW,torch)
ember=sphere('Fuse ember',(.30,-.81,1.37),(.035,.035,.035),FIRE)
# Camera and depth choreography, with explicit cuts rather than a teleported continuous move.
bpy.ops.object.camera_add(location=(2.6,10.4,4.1));cam=bpy.context.object;cam.name='Directed camera';sc.camera=cam;cam.data.lens=42;cam.data.sensor_width=36;cam.data.clip_end=250

def camera_pose(f,pos,target):
 cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f)
FIRE_FRAME=102;HIT_FRAME=192
for f in range(1,256):
 t=(f-1)/30;reach=smooth(.35,1.55,t)*(1-smooth(2.0,2.45,t));s1=smooth(2.2,2.65,t);s2=smooth(2.7,3.1,t);back=.18*s1+.18*s2;lean=-.11*reach+.16*smooth(2.8,3.3,t)-.10*smooth(3.8,4.4,t);hip=1.04-.08*smooth(2.8,3.3,t)
 # Global flame target = (.30,-.81,1.37), so hand target = (-.14,-.56,1.64).
 hr=lerp((.49,.08,1.26),(.91,-.41,1.57),reach);ears=smooth(2.55,3.2,t);hr=hr.lerp(Vector((.43,.07,2.42)),ears);hl=lerp((-.45,.08,1.25),(-.43,.07,2.39),ears)
 fl=(-.20-.36*s1+back,.10*s1,.025+.12*math.sin(s1*math.pi));fr=(.20-.36*s2+back,.10*s2,.025+.12*math.sin(s2*math.pi))
 actor(hero,f,-1.05-back,hip,lean,hl,hr,fl,fr,look=-.10*reach,react=0)
 actor(mate,f,1.62,1.04-.04*ears,-.06*ears,(-.44,.06,1.28),lerp((.45,.07,1.3),(.43,.08,2.4),ears),(-.2,0,.025),(.2,0,.025),look=.12,react=.15*ears)
 react=smooth(6.30,6.55,t);actor(victim,f,.65,1.04-.15*react,-.16*react,lerp((-.45,.06,1.3),(-.48,.12,2.38),react),lerp((.45,.07,1.3),(.48,.12,2.3),react),(-.24,0,.025),(.25,.05,.025),look=.08*react,react=react)
 hand_world=Vector((-1.05-back,-.15,.07))+hr;key(torch,f,hand_world);visible(torch,f,t<2.48);key(flame,f,scale=(.055,.055,.10+math.sin(t*31)*.018));visible(ember,f,1.55<t<3.36);visible(fuse,f,t<3.36)
 # Live carriage response, no whole-body sliding on the shot.
 dt=max(0,t-3.3667);recoil=.38*(1-math.exp(-dt*38))*math.exp(-dt*2.8) if dt>0 else 0;key(gun,f,(.25,-1.55+recoil,0))
 if f<141:
  u=smooth(0,4.6,t);camera_pose(f,(2.5-u*.45,10.7-u*.45,4.2+u*.12),(-.1,-.65,1.4))
 elif f<192:
  u=(f-141)/50;camera_pose(f,(.8,-5-14*u,2.6),(.25,-23,1.25))
 else:
  u=smooth(6.35,8.5,t);camera_pose(f,(2.0-u*.3,-15.7-u*.4,3.5),(.30,-23.0,1.4))
# Camera and pose keys are baked at 30fps: linear between adjacent samples, no overshoot.
for ob in [cam,hero['root'],hero['body'],hero['head'],mate['root'],victim['root'],gun,torch]:
 if ob.animation_data and ob.animation_data.action:
  for fc in ob.animation_data.action.fcurves:
   for k in fc.keyframe_points:k.interpolation='LINEAR'

# Stylized blast shapes with coordinated life spans; no persistent pile of shards.
for i in range(9):
 p=sphere('Muzzle flash',(0,0,0),(.01,.01,.01),YELLOW if i%3==0 else FIRE)
 base=Vector((.25,-2.9,1.02));offset=Vector((random.uniform(-.22,.22),random.uniform(-.35,.05),random.uniform(-.18,.18)))
 visible(p,1,False);visible(p,102,True);visible(p,108,False);key(p,102,base+offset,scale=(.04,.04,.04));key(p,105,base+offset*2,scale=(.17,.24,.19));key(p,108,base+offset*2,scale=(.01,.01,.01))
for i in range(14):
 p=sphere('Drifting smoke',(0,0,0),(.01,.01,.01),SMOKE);born=103+i;visible(p,1,False);visible(p,born,True);visible(p,160+i,False);x=random.uniform(-.4,.4);y=random.uniform(-.7,-.1)
 key(p,born,(.25+x*.2,-3+y*.1,1.1),scale=(.05,.05,.05));key(p,born+20,(.25+x,-3+y,1.3+i*.025),scale=(.28,.32,.26));key(p,born+55,(.25+x*2,-3+y*2,2.4),scale=(.48,.51,.43))
ballshot=sphere('Iron projectile',(.25,-2.9,1.05),(.10,.10,.10),METAL);visible(ballshot,1,False);visible(ballshot,104,True);visible(ballshot,192,False);key(ballshot,104,(.25,-2.9,1.05));key(ballshot,141,(.25,-5,1.10));key(ballshot,191,(.25,-20.95,.55))
# Near gunwale frames the breakable boards; no unattached midair impact section.
for x,width in [(-1.2075,1.785),(1.4575,1.285)]:
 cube('Near target gunwale',(x,-21,.44),(width,.12,.82),RAIL,None,.02)
 cube('Near target cap',(x,-21,.88),(width+.02,.22,.10),GOLD,None,.02)
# A breakable near-side section on target. Victim is behind it; fragments move past, not through, the face.
for j in range(4):
 plank=cube('Breakaway gunwale board',(.25,-20.97,.20+j*.17),(1.13,.10,.15),RAIL,None,.01);visible(plank,1,True);visible(plank,192,False)
for i in range(34):
 length=random.uniform(.16,.50);coords=[(-.025,0,-length/2),(.025,.015,-length/3),(.045,0,length/2),(-.015,-.015,length*.25)];p=poly('Flying splinter',coords,WOOD if i%2 else DARKWOOD);visible(p,1,False);visible(p,192+i%3,True);visible(p,240+i%12,False)
 vx=random.uniform(-3.5,3.5);vy=random.uniform(1.8,4.5);vz=random.uniform(2,4)
 for f in range(192,256,2):
  dt=(f-192)/30;key(p,f,(.25+vx*dt,-20.95+vy*dt,.55+vz*dt-4.8*dt*dt),(dt*(i%5+3),dt*(i%7+2),dt*6))
# Captioning is composited after 3D render by ffmpeg; never intersects a 3D limb by depth accident.
sc.render.image_settings.color_mode='RGB';sc.render.filepath=os.path.join(args.output,'f');os.makedirs(args.output,exist_ok=True)
for f in range(args.start,args.end+1):
 sc.frame_set(f);sc.render.filepath=os.path.join(args.output,f'f{f:04d}.png');bpy.ops.render.render(write_still=True)
