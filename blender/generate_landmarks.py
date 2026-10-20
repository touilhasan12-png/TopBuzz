"""Build a deterministic, geographies-first Istanbul diorama for the film.

The scene is an illustrative reconstruction, not a surveyed digital twin.
All geometry is generated from this script; no copyrighted city footage is used.
Run: blender -b -P blender/generate_landmarks.py -- public/istanbul-landmarks.glb
"""
from pathlib import Path
import bpy, math, random, sys, json
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['public/istanbul-landmarks.glb']
out=Path(args[0]).resolve(); out.parent.mkdir(parents=True, exist_ok=True)
osm_path=Path(args[1]).resolve() if len(args)>1 else Path(__file__).resolve().parents[1]/'data'/'istanbul-core-osm.geojson'
random.seed(290657)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for block in bpy.data.materials: bpy.data.materials.remove(block)
WATER_MASK_PATH=Path(__file__).resolve().parents[1]/'data'/'istanbul-watermask.json'
WATER_MASK=None
if WATER_MASK_PATH.exists():
    with WATER_MASK_PATH.open(encoding='utf-8') as f: WATER_MASK=json.load(f)

# Palette: natural limestone, tiled roofs, Bosporus water, hill greens.
def material(name, color, rough=.82, metallic=0.0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=rough; bs.inputs['Metallic'].default_value=metallic
    return m

MAT_TERRAIN=material('01 | Marmara limestone and pine',(.22,.34,.25),.95)
MAT_WATER=material('02 | Bosporus, deep blue green',(.055,.33,.42),.34,.05)
MAT_COAST=material('03 | Pale shoreline',(.55,.49,.34),.92)
MAT_WOOD=material('04 | Weathered cypress timber',(.27,.18,.12),.92)
MAT_CLAY=material('05 | Hand fired roof tile',(.39,.18,.12),.82)
MAT_STONE=material('06 | Warm Byzantine limestone',(.67,.58,.43),.88)
MAT_OTTOMAN=material('07 | Ottoman ochre plaster',(.72,.57,.36),.84)
MAT_OTT_ROOF=material('08 | Oxidised copper and tile',(.22,.31,.27),.72,.12)
MAT_MODERN=material('09 | Modern pale concrete',(.54,.61,.61),.78)
MAT_GLASS=material('10 | Blue grey glazing',(.075,.22,.29),.24,.18)
MAT_GOLD=material('11 | Restrained brass',(.66,.47,.19),.4,.4)
MAT_DARK=material('12 | Deep shadow detail',(.10,.15,.16),.9)
MAT_CANOPY=material('13 | Cypress canopy',(.115,.255,.17),.94)
MAT_ROAD=material('14 | Basalt street surface',(.17,.205,.20),.94)
MAT_PAVEMENT=material('15 | Pale stone promenade',(.44,.42,.36),.90)
MAT_SAT=material('16 | Modified Copernicus Sentinel-2 true colour',(.58,.61,.56),.82)
TEXTURE_DIR=Path(__file__).resolve().parents[1]/'assets'/'textures'
def image_texture(mat,filename,scale=1.0):
    path=TEXTURE_DIR/filename
    if not path.exists(): return
    img=bpy.data.images.load(str(path),check_existing=True); img.pack()
    nodes=mat.node_tree.nodes; links=mat.node_tree.links; bs=nodes.get('Principled BSDF')
    tex=nodes.new('ShaderNodeTexImage'); tex.image=img; tex.interpolation='Linear'; tex.extension='REPEAT'
    uv=nodes.new('ShaderNodeTexCoord'); mapping=nodes.new('ShaderNodeVectorMath'); mapping.operation='SCALE'; mapping.inputs[3].default_value=scale
    links.new(uv.outputs['UV'],mapping.inputs[0]); links.new(mapping.outputs['Vector'],tex.inputs['Vector'])
    if mat==MAT_TERRAIN:
        vc=nodes.new('ShaderNodeVertexColor'); vc.layer_name='TerrainTint'
        mix=nodes.new('ShaderNodeMixRGB'); mix.blend_type='MULTIPLY'; mix.inputs[0].default_value=.72
        links.new(vc.outputs['Color'],mix.inputs[1]); links.new(tex.outputs['Color'],mix.inputs[2]); links.new(mix.outputs['Color'],bs.inputs['Base Color'])
    else:
        links.new(tex.outputs['Color'],bs.inputs['Base Color'])

image_texture(MAT_TERRAIN,'terrain.png',.08)
image_texture(MAT_WATER,'water.png',.75)
image_texture(MAT_STONE,'limestone.png',3.2)
image_texture(MAT_OTTOMAN,'limestone.png',3.2)
image_texture(MAT_CLAY,'terracotta.png',3.8)
image_texture(MAT_OTT_ROOF,'copper.png',3.6)
image_texture(MAT_MODERN,'concrete.png',3.0)
image_texture(MAT_ROAD,'road.png',4.0)
image_texture(MAT_PAVEMENT,'limestone.png',2.0)
image_texture(MAT_SAT,'istanbul_sentinel2_tci.png',1.0)

# Scene graph: each historic layer can be revealed independently in Remotion.
def layer(name):
    o=bpy.data.objects.new('LAYER_'+name, None); bpy.context.scene.collection.objects.link(o); o.empty_display_type='PLAIN_AXES'; o.empty_display_size=.15; return o
L_EARLY=layer('EARLY_SETTLEMENT'); L_BYZ=layer('BYZANTINE_CITY'); L_OTT=layer('OTTOMAN_CITY'); L_MOD=layer('MODERN_CITY'); L_LAND=layer('LANDMARKS'); L_BRIDGE=layer('BRIDGES');

def mesh_obj(name, verts, faces, mats, mat_ids=None, parent=None):
    me=bpy.data.meshes.new(name+' mesh'); me.from_pydata(verts,[],faces); me.materials.clear()
    for m in mats: me.materials.append(m)
    me.update()
    uv=me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        normal=poly.normal
        for li in poly.loop_indices:
            vi=me.loops[li].vertex_index; co=me.vertices[vi].co
            if abs(normal.z)>.70: u,v=co.x,co.y
            elif abs(normal.x)>abs(normal.y): u,v=co.y,co.z
            else: u,v=co.x,co.z
            uv.data[li].uv=(u,v)
    ob=bpy.data.objects.new(name,me); bpy.context.scene.collection.objects.link(ob)
    if parent: ob.parent=parent
    if mat_ids:
        for p,i in zip(me.polygons,mat_ids): p.material_index=i
    return ob

# Real-geography-inspired land/water geometry: the strait, Golden Horn, and Marmara
# are treated as the primary shapes. The shoreline is intentionally smoothed/stylized.
def bosphorus_x(y): return 2.4 - .25*y + .62*math.sin(y*.25)
def golden_horn_distance(x,y):
    pts=[(-.7,-3.2),(-3.1,-3.55),(-6.6,-3.85),(-10.3,-3.75),(-13.4,-3.45)]
    best=1e9
    for (ax,ay),(bx,by) in zip(pts,pts[1:]):
        dx=bx-ax; dy=by-ay; q=max(0,min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)))
        best=min(best,math.hypot(x-(ax+q*dx),y-(ay+q*dy)))
    return best

def in_water(x,y):
    # Prefer a water mask sampled from the georeferenced Sentinel-2 surface inside the crop.
    if WATER_MASK:
        xmin,xmax=-22.4,22.6; ymin,ymax=-22.28,16.36
        if xmin<=x<=xmax and ymin<=y<=ymax:
            w=WATER_MASK['width']; h=WATER_MASK['height']
            ix=max(0,min(w-1,round((x-xmin)/(xmax-xmin)*(w-1))))
            iy=max(0,min(h-1,round((y-ymin)/(ymax-ymin)*(h-1))))
            return WATER_MASK['rows'][iy][ix]=='1'
    if y>12.4: return True
    bx=bosphorus_x(y); w=1.00 + .12*math.cos(y*.27)
    if abs(x-bx)<w: return True
    if golden_horn_distance(x,y)<.82: return True
    return False


def height_at(x,y):
    def hill(cx,cy,sx,sy,h): return h*math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2))
    n=(math.sin(x*2.3+y*1.7)+.55*math.sin(x*4.9-y*3.1)+.3*math.cos(y*7.3+x*1.9))*.035
    return max(.05, .13 + hill(-6.0,1.8,5.0,7.3,2.0)+hill(-7.7,-6.0,4.3,4.6,1.35)+hill(7.7,1.5,7.5,8.0,1.7)+hill(5.8,-11.5,6.0,4.3,1.15)+n)

def build_terrain():
    nx,ny=184,158; xmin,xmax=-22,22; ymin,ymax=-22,16
    dx=(xmax-xmin)/(nx-1); dy=(ymax-ymin)/(ny-1)
    verts=[]; index={}; colors=[]
    for j in range(ny):
        y=ymin+j*dy
        for i in range(nx):
            x=xmin+i*dx
            if in_water(x,y): continue
            h=height_at(x,y); index[(i,j)]=len(verts); verts.append((x,y,h))
            # Natural, low-contrast albedo changes with height and a fine deterministic ground grain.
            grain=.018*math.sin(x*13.7+y*9.1)+.012*math.cos(x*17.1-y*11.3)
            v=max(0,min(1,(h-.12)/2.0)); shore=max(0,1-min(1,min(abs(x-bosphorus_x(y)),golden_horn_distance(x,y))/1.6))
            base=(.23+.10*v+grain,.34+.07*v+grain,.24+.035*v+grain)
            sand=(.48,.43,.31); blend=shore*.5
            colors.append(tuple(base[k]*(1-blend)+sand[k]*blend for k in range(3)))
    faces=[]
    for j in range(ny-1):
        for i in range(nx-1):
            keys=((i,j),(i+1,j),(i+1,j+1),(i,j+1))
            if all(k in index for k in keys):
                a,b,c,d=(index[k] for k in keys); faces.extend([(a,b,c),(a,c,d)])
    ob=mesh_obj('Marmara terrain | sculpted peninsula, two shores',verts,faces,[MAT_TERRAIN])
    # Export per-vertex color from Blender 4.x.
    attr=ob.data.color_attributes.new(name='TerrainTint',type='FLOAT_COLOR',domain='POINT')
    for i,c in enumerate(colors): attr.data[i].color=(*c,1)
    mat=MAT_TERRAIN; mat.use_nodes=True; nt=mat.node_tree; bs=nt.nodes.get('Principled BSDF')
    if not any(n.type=='TEX_IMAGE' for n in nt.nodes):
        vc=nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name='TerrainTint'; nt.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
    return ob

# Deep water underlays and the broad, gently differentiated inlet surface.
def build_water():
    # The water plane is visible only where the geospatial land mesh has shoreline holes.
    bpy.ops.mesh.primitive_plane_add(size=500, location=(0,0,.02)); sea=bpy.context.object
    sea.name='Marmara and Bosporus | water surface'; sea.data.materials.append(MAT_WATER)


# Forest meshes are batched to keep real-time rendering and CPU rendering lean.
def add_cylinder_geo(verts,faces,center,r1,r2,height,sides=6,material_ids=None,mat_id=0):
    x,y,z=center; start=len(verts)
    for zz,rr in [(z,r1),(z+height,r2)]:
        for k in range(sides):
            a=2*math.pi*k/sides; verts.append((x+rr*math.cos(a),y+rr*math.sin(a),zz))
    for k in range(sides):
        a=start+k; b=start+(k+1)%sides; faces.append((a,b,b+sides,a+sides))
        if material_ids is not None: material_ids.append(mat_id)
    faces.append(tuple(start+sides+k for k in range(sides)))
    if material_ids is not None: material_ids.append(mat_id)

def add_cone_geo(verts,faces,center,radius,height,sides=5,material_ids=None,mat_id=1):
    x,y,z=center; start=len(verts); verts.append((x,y,z+height))
    for k in range(sides):
        a=2*math.pi*k/sides; verts.append((x+radius*math.cos(a),y+radius*math.sin(a),z))
    for k in range(sides):
        faces.append((start+1+k,start+1+(k+1)%sides,start))
        if material_ids is not None: material_ids.append(mat_id)
    faces.append(tuple(start+1+k for k in range(sides)))
    if material_ids is not None: material_ids.append(mat_id)

def build_forest():
    verts=[]; faces=[]; mids=[]
    tries=0; made=0
    while made<950 and tries<10000:
        tries+=1; x=random.uniform(-21,21); y=random.uniform(-21,12)
        if in_water(x,y): continue
        # Forested uplands frame the city; keep core, major districts and shoreline visually open.
        urban=min(math.hypot(x+5.8,y-1.0),math.hypot(x+7.5,y+6.0),math.hypot(x-7,y-1))
        edge=(x<-12 or x>12 or y<-14 or urban>8.5)
        if not edge or urban<5.5 or random.random()>.68: continue
        h=height_at(x,y); scale=random.uniform(.18,.38)
        add_cylinder_geo(verts,faces,(x,y,h),scale*.12,scale*.07,scale*.55,5,mids,0)
        add_cone_geo(verts,faces,(x,y,h+scale*.25),scale*.48,scale*1.25,5,mids,1)
        add_cone_geo(verts,faces,(x,y,h+scale*.68),scale*.34,scale*.96,5,mids,1)
        made+=1
    obj=mesh_obj('Pine and cypress canopy | outer hills',verts,faces,[MAT_WOOD,MAT_CANOPY],mids)
    return obj

# Detailed, footprint-based building geometry: gable roofs, parapets, cornices and
# small recessed glazing replace generic extruded cubes. All dimensions are stylized.
def add_building_mesh(name, layer_obj, centres, count, size_range, height_range, wall_mats, roof_mats, style):
    verts=[]; faces=[]; mids=[]; windows=0; built=0
    palette=wall_mats+roof_mats+[MAT_GLASS,MAT_DARK]
    wall_count=len(wall_mats); roof_start=wall_count; glass_idx=wall_count+len(roof_mats); dark_idx=glass_idx+1
    spacing={'early':.60,'byz':.58,'ottoman':.60,'modern':.52}[style]
    # Jittered street-grid sampling preserves road corridors and block rhythm.
    zones=[]
    total_area=sum(rx*ry for _,_,rx,ry in centres)
    remaining=count
    for zi,(cx,cy,rx,ry) in enumerate(centres):
        want=remaining if zi==len(centres)-1 else max(1,round(count*(rx*ry)/total_area))
        remaining-=want
        pts=[]; nx=max(2,int(rx*2/spacing)); ny=max(2,int(ry*2/spacing))
        for iy in range(ny):
            for ix in range(nx):
                x=cx-rx+(ix+.5)*(2*rx/nx)+random.uniform(-.07,.07)
                y=cy-ry+(iy+.5)*(2*ry/ny)+random.uniform(-.07,.07)
                if ((x-cx)/rx)**2+((y-cy)/ry)**2>1: continue
                if in_water(x,y): continue
                if golden_horn_distance(x,y)<.95 and style!='early': continue
                if style!='modern' and min(math.hypot(x-cx0,y-cy0) for cx0,cy0 in [(-5.9,1.0),(-11.0,-2.2),(-5.0,-.8)])<1.15: continue
                if random.random()<.13: continue
                pts.append((x,y))
        random.shuffle(pts); zones.extend(pts[:want])
    random.shuffle(zones)
    for x,y in zones[:count]:
        w=random.uniform(*size_range); d=random.uniform(size_range[0]*.72,size_range[1]*.9)
        h=random.uniform(*height_range); angle=random.choice([0,.06,-.06,.14,-.14])
        ca,sa=math.cos(angle),math.sin(angle)
        corners=[]
        for px,py in [(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]:
            corners.append((x+px*ca-py*sa,y+px*sa+py*ca))
        base=height_at(x,y)+.025; top=base+h
        wall_idx=random.randrange(wall_count); roof_idx=roof_start+random.randrange(len(roof_mats))
        start=len(verts)
        verts.extend([(px,py,base) for px,py in corners]); verts.extend([(px,py,top) for px,py in corners])
        for side in range(4):
            a=side; b=(side+1)%4
            faces.append((start+a,start+b,start+b+4,start+a+4)); mids.append(wall_idx)
        pitched=(style in ('early','ottoman') and random.random()<.82) or (style=='byz' and random.random()<.32)
        if pitched:
            mx=(corners[0][0]+corners[1][0])/2; my=(corners[0][1]+corners[1][1])/2
            mx2=(corners[2][0]+corners[3][0])/2; my2=(corners[2][1]+corners[3][1])/2
            ridge_z=top+h*random.uniform(.30,.52); r0=len(verts)
            verts.extend([(mx,my,ridge_z),(mx2,my2,ridge_z)])
            faces.extend([(start+4,start+5,r0+1,r0),(start+6,start+7,r0+1,r0),(start+4,start+7,r0+1,r0),(start+5,start+6,r0+1,r0)])
            mids.extend([roof_idx]*4)
        else:
            parap=min(.055,h*.14); p0=len(verts)
            verts.extend([(px,py,top+parap) for px,py in corners])
            for side in range(4):
                a=side; b=(side+1)%4
                faces.append((start+4+a,start+4+b,p0+b,p0+a)); mids.append(wall_idx)
            faces.append(tuple(p0+k for k in range(4))); mids.append(roof_idx)
        levels=max(1,min(4,int(h/.19)))
        for side in (0,2):
            a,b=corners[side],corners[(side+1)%4]; dx,dy=b[0]-a[0],b[1]-a[1]; ll=math.hypot(dx,dy)
            n=max(1,min(3,int(ll/.15))); nx,ny=dy/ll,-dx/ll
            for lv in range(levels):
                z=base+(lv+.54)*h/(levels+.35)
                for wi in range(n):
                    u=(wi+.5)/n; wx=a[0]+dx*u; wy=a[1]+dy*u
                    ww=min(.040,ll/n*.42); wh=min(.050,h/levels*.38); off=.003
                    q=len(verts)
                    verts.extend([(wx-dx/ll*ww/2+nx*off,wy-dy/ll*ww/2+ny*off,z-wh/2),
                                  (wx+dx/ll*ww/2+nx*off,wy+dy/ll*ww/2+ny*off,z-wh/2),
                                  (wx+dx/ll*ww/2+nx*off,wy+dy/ll*ww/2+ny*off,z+wh/2),
                                  (wx-dx/ll*ww/2+nx*off,wy-dy/ll*ww/2+ny*off,z+wh/2)])
                    faces.append((q,q+1,q+2,q+3)); mids.append(glass_idx); windows+=1
        if pitched and random.random()<.18:
            q=len(verts); cx2,cy2=x+random.uniform(-w*.2,w*.2),y+random.uniform(-d*.2,d*.2)
            z=top+h*.27; t=.028
            verts.extend([(cx2-t,cy2-t,z),(cx2+t,cy2-t,z),(cx2+t,cy2+t,z),(cx2-t,cy2+t,z),(cx2-t,cy2-t,z+.07),(cx2+t,cy2-t,z+.07),(cx2+t,cy2+t,z+.07),(cx2-t,cy2+t,z+.07)])
            for k in range(4): faces.append((q+k,q+(k+1)%4,q+(k+1)%4+4,q+k+4)); mids.append(dark_idx)
        built+=1
    obj=mesh_obj(name,verts,faces,palette,mids,layer_obj)
    return obj, built, windows

def add_osm_city_footprints(path):
    """Extrude current OSM footprints as the modern urban fabric, preserving their street layout."""
    if not path.exists():
        print('OSM GeoJSON not found; modern core footprints skipped:',path); return 0
    with path.open(encoding='utf-8') as f: data=__import__('json').load(f)
    verts=[]; faces=[]; mids=[]; built=0
    mats=[MAT_MODERN,MAT_STONE,MAT_OTTOMAN,MAT_CLAY,MAT_GLASS,MAT_DARK]
    wall_n=3; roof_start=3; glass_idx=4; dark_idx=5
    for feat in data.get('features',[]):
        geom=feat.get('geometry') or {}
        if geom.get('type')!='Polygon' or not geom.get('coordinates'): continue
        raw=geom['coordinates'][0]
        if len(raw)<4: continue
        props=feat.get('properties') or {}
        nm=(props.get('name') or '').lower()
        if float(props.get('area_m2_est',0) or 0)>8000 and not nm: continue
        if any(k in nm for k in ('ayasofya','hagia sophia','süleymaniye','topkapı','galata kulesi')): continue
        # Map longitude/latitude into the diorama; scale is illustrative, and height is gently exaggerated.
        poly=[((float(lon)-29.0)*300+.1,(41.005-float(lat))*420+2.5) for lon,lat in raw[:-1]]
        if len(poly)<3: continue
        cx=sum(p[0] for p in poly)/len(poly); cy=sum(p[1] for p in poly)/len(poly)
        # Subtle footprint enlargement keeps the real street pattern legible at film scale.
        poly=[(cx+(x-cx)*1.28,cy+(y-cy)*1.28) for x,y in poly]
        if in_water(cx,cy): continue
        levels=0.0
        try: levels=float(str(props.get('building:levels','')).replace(',','.'))
        except: pass
        height_m=0.0
        try: height_m=float(''.join(ch for ch in str(props.get('height','')) if ch.isdigit() or ch=='.'))
        except: pass
        if height_m>0: h=max(.14,min(1.55,height_m/48.0))
        elif levels>0: h=max(.16,min(1.30,levels*.095))
        else: h=random.uniform(.20,.74)
        base=height_at(cx,cy)+.025; top=base+h
        typ=str(props.get('building','')).lower()
        wall_idx=random.randrange(wall_n)
        if typ in ('mosque','church','cathedral','temple'):
            wall_idx=1; roof_idx=3
        else:
            roof_idx=roof_start+random.choice([0,0,0,1,1,2])
        n=len(poly); s0=len(verts)
        verts.extend([(x,y,base) for x,y in poly]); verts.extend([(x,y,top) for x,y in poly])
        for i in range(n):
            j=(i+1)%n
            faces.append((s0+i,s0+j,s0+n+j,s0+n+i)); mids.append(wall_idx)
        # Roof archetype: predominantly flat/tiled, with occasional shallow hip roofs.
        roof_type=random.random()
        if roof_type<.26 and n>=4:
            r0=len(verts); verts.append((cx,cy,top+h*.17))
            for i in range(n): faces.append((s0+n+i,s0+n+(i+1)%n,r0)); mids.append(roof_idx)
        else:
            faces.append(tuple(s0+n+i for i in range(n))); mids.append(roof_idx)
        # Sparse, inset-looking window ribbons on visible façades.
        for i in range(n):
            a,b=poly[i],poly[(i+1)%n]; dx,dy=b[0]-a[0],b[1]-a[1]; ll=math.hypot(dx,dy)
            if ll<.18 or random.random()<.48: continue
            nx,ny=dy/ll,-dx/ll; panes=max(1,min(3,int(ll/.24)))
            for k in range(panes):
                u=(k+.5)/panes; wx=a[0]+dx*u; wy=a[1]+dy*u; ww=min(.065,ll/panes*.4); wh=min(.075,h*.22); z=base+h*.53; off=.004
                q=len(verts)
                verts.extend([(wx-dx/ll*ww/2+nx*off,wy-dy/ll*ww/2+ny*off,z-wh/2),
                              (wx+dx/ll*ww/2+nx*off,wy+dy/ll*ww/2+ny*off,z-wh/2),
                              (wx+dx/ll*ww/2+nx*off,wy+dy/ll*ww/2+ny*off,z+wh/2),
                              (wx-dx/ll*ww/2+nx*off,wy-dy/ll*ww/2+ny*off,z+wh/2)])
                faces.append((q,q+1,q+2,q+3)); mids.append(glass_idx)
        built+=1
    if built:
        mesh_obj('OpenStreetMap building footprints | modern historic core',verts,faces,mats,mids,L_MOD)
    print('Extruded OSM building footprints:',built,'from',path)
    return built

def add_osm_roads(path):
    """Create draped, fine road ribbons from the same OSM snapshot as the footprints."""
    if not path.exists(): return 0
    with path.open(encoding='utf-8') as f: data=__import__('json').load(f)
    verts=[]; faces=[]; mids=[]; segments=0
    widths={'trunk':.16,'primary':.13,'secondary':.10,'tertiary':.075,'residential':.055,'living_street':.06,'service':.040,'unclassified':.05,'pedestrian':.060,'busway':.07,'primary_link':.09,'secondary_link':.075,'tertiary_link':.06,'trunk_link':.10}
    for feat in data.get('features',[]):
        geom=feat.get('geometry') or {}; props=feat.get('properties') or {}
        if geom.get('type')!='LineString' or props.get('kind')!='road': continue
        line=geom.get('coordinates') or []; road=props.get('highway','residential'); width=widths.get(road,.05)
        bridge=str(props.get('bridge','')).lower() in ('yes','true','viaduct')
        paved=road in ('pedestrian','living_street')
        for (lon1,lat1),(lon2,lat2) in zip(line,line[1:]):
            x1,y1=(float(lon1)-29.0)*300+.1,(41.005-float(lat1))*420+2.5
            x2,y2=(float(lon2)-29.0)*300+.1,(41.005-float(lat2))*420+2.5
            if math.hypot(x2-x1,y2-y1)<.035: continue
            if not bridge and (in_water(x1,y1) or in_water(x2,y2)): continue
            dx,dy=x2-x1,y2-y1; ll=math.hypot(dx,dy); ox=-dy/ll*width/2; oy=dx/ll*width/2
            z1=height_at(x1,y1)+(.05 if not bridge else .48); z2=height_at(x2,y2)+(.05 if not bridge else .48)
            k=len(verts); verts.extend([(x1+ox,y1+oy,z1),(x1-ox,y1-oy,z1),(x2-ox,y2-oy,z2),(x2+ox,y2+oy,z2)])
            faces.append((k,k+1,k+2,k+3)); mids.append(1 if paved else 0); segments+=1
    if segments: mesh_obj('OpenStreetMap road and promenade network | modern layer',verts,faces,[MAT_ROAD,MAT_PAVEMENT],mids,L_MOD)
    print('Draped OSM road segments:',segments)
    return segments

def build_historic_roofscape(terrain, filename, label, parent, z_offset):
    """Texture an illustrative historic roof-and-street pattern over the same relief mesh."""
    image_path=TEXTURE_DIR/filename
    if not image_path.exists():
        print('Historic roofscape texture missing:',image_path); return None
    mat=bpy.data.materials.new(label); mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.92
    image=bpy.data.images.load(str(image_path),check_existing=True); image.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=image; tex.interpolation='Linear'; tex.extension='EXTEND'
    uvnode=mat.node_tree.nodes.new('ShaderNodeTexCoord'); mat.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
    mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    mesh=terrain.data.copy(); mesh.name=label+' mesh'; mesh.materials.clear(); mesh.materials.append(mat)
    uv=mesh.uv_layers.active or mesh.uv_layers.new(name='UVMap')
    x_min,x_max=-22.0,22.0; y_min,y_max=-22.0,16.0
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            co=mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv=((co.x-x_min)/(x_max-x_min),(co.y-y_min)/(y_max-y_min))
    ob=bpy.data.objects.new(label,mesh); bpy.context.scene.collection.objects.link(ob)
    ob.parent=parent; ob.location.z=z_offset
    print('Added illustrative historic roofscape:',label,'from',image_path)
    return ob


def build_satellite_surface(terrain):
    """Modern-only satellite albedo on an exact duplicate of the same land mesh."""
    image_path=TEXTURE_DIR/'istanbul_sentinel2_tci.png'
    if not image_path.exists(): return
    image=bpy.data.images.load(str(image_path),check_existing=True); image.pack()
    mat=MAT_SAT; nodes=mat.node_tree.nodes; links=mat.node_tree.links; bs=nodes.get('Principled BSDF')
    tex=nodes.new('ShaderNodeTexImage'); tex.image=image; tex.interpolation='Linear'; tex.extension='EXTEND'
    uvnode=nodes.new('ShaderNodeTexCoord'); links.new(uvnode.outputs['UV'],tex.inputs['Vector']); links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    mesh=terrain.data.copy(); mesh.name='Satellite drape mesh | exact terrain topology'; mesh.materials.clear(); mesh.materials.append(mat)
    uv=mesh.uv_layers.active or mesh.uv_layers.new(name='UVMap')
    # Texture bbox: lon 28.925–29.075, lat 40.972–41.064; mapped to this film's world coordinates.
    x_min,x_max=-22.4,22.6; y_min,y_max=-22.28,16.36
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vi=mesh.loops[li].vertex_index; co=mesh.vertices[vi].co
            u=(co.x-x_min)/(x_max-x_min); v=1-(co.y-y_min)/(y_max-y_min)
            uv.data[li].uv=(u,v)
    ob=bpy.data.objects.new('Sentinel-2 satellite surface | modern layer',mesh); bpy.context.scene.collection.objects.link(ob)
    ob.parent=L_MOD; ob.location.z=.035
    print('Draped Copernicus Sentinel-2 albedo on terrain mesh:',ob.name,'from',image_path)


# Landmark primitives are deliberately recognizable silhouettes, not photogrammetry.
def move_to_layer(obj,parent,mat=None):
    if mat: obj.data.materials.append(mat)
    obj.parent=parent; obj.matrix_parent_inverse=parent.matrix_world.inverted(); return obj

def box(name,loc,scale,mat,parent,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); move_to_layer(o,parent,mat)
    if bevel:
        mod=o.modifiers.new('Soft stone arris','BEVEL'); mod.width=bevel; mod.segments=2; o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o

def cyl(name,loc,radius,depth,mat,parent,vertices=20,r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    else: bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=r2,depth=depth,location=loc)
    o=bpy.context.object; o.name=name; move_to_layer(o,parent,mat); return o

def dome(name,loc,radius,mat,parent,scale_z=.95):
    # A true raised hemisphere; the base ring rests on the drum instead of a flattened sphere.
    x,y,z=loc; sides=24; rings=8; verts=[(x,y,z+radius*scale_z)]; faces=[]
    for j in range(1,rings+1):
        theta=(math.pi*.5)*j/rings
        for k in range(sides):
            phi=2*math.pi*k/sides
            verts.append((x+radius*math.sin(theta)*math.cos(phi),y+radius*math.sin(theta)*math.sin(phi),z+radius*scale_z*math.cos(theta)))
    for k in range(sides): faces.append((0,1+k,1+(k+1)%sides))
    for j in range(rings-1):
        a=1+j*sides; b=a+sides
        for k in range(sides): faces.append((a+k,b+k,b+(k+1)%sides,a+(k+1)%sides))
    mesh_obj(name,verts,faces,[mat],parent=parent)
    return bpy.data.objects[name]

def minaret(name,x,y,z0,height,parent,mat=MAT_STONE):
    cyl(name+' shaft',(x,y,z0+height*.40),.105,height*.80,mat,parent,16,r2=.07)
    cyl(name+' gallery',(x,y,z0+height*.68),.18,.07,MAT_GOLD,parent,16)
    cyl(name+' upper shaft',(x,y,z0+height*.83),.065,height*.22,mat,parent,16,r2=.035)
    cyl(name+' conical cap',(x,y,z0+height*.96),.11,height*.14,MAT_GOLD,parent,16,r2=.012)

def arch_window(name,x,y,z,width,height,parent,side='south',frame=False):
    """Small recessed arch-shaped opening on a vertical façade plane."""
    r=width*.5; spring=z+height*.58; pts=[]
    if side in ('south','north'):
        face_y=y+(-.012 if side=='south' else .012)
        pts=[(x-r,face_y,z),(x+r,face_y,z),(x+r,face_y,spring)]
        for k in range(1,9):
            a=math.pi*k/8; pts.append((x+r*math.cos(a),face_y,spring+r*math.sin(a)))
        pts.append((x-r,face_y,spring))
        if side=='north': pts=list(reversed(pts))
    else:
        face_x=x+(.012 if side=='east' else -.012)
        pts=[(face_x,y-r,z),(face_x,y+r,z),(face_x,y+r,spring)]
        for k in range(1,9):
            a=math.pi*k/8; pts.append((face_x,y+r*math.cos(a),spring+r*math.sin(a)))
        pts.append((face_x,y-r,spring))
        if side=='west': pts=list(reversed(pts))
    mat=MAT_STONE if frame else MAT_GLASS
    mesh_obj(name,pts,[tuple(range(len(pts)))],[mat],parent=parent)

def mosque(name,x,y,base,span,height,parent,stone,roof,minarets=2):
    box(name+' prayer hall',(x,y,base+height*.18),(span,span*.72,height*.36),stone,parent,.05)
    for i in range(7):
        xx=x+(i-3)*span*.125
        arch_window(name+f' facade arch {i+1}',xx,y-span*.36,base+height*.07,span*.075,height*.22,parent,'south')
        box(name+f' facade pilaster {i+1}',(xx,y-span*.372,base+height*.18),(.055,.045,height*.34),stone,parent,.012)
    arch_window(name+' main portal',x,y-span*.372,base+height*.045,span*.17,height*.29,parent,'south')
    cyl(name+' drum',(x,y,base+height*.39),span*.24,height*.12,stone,parent,24)
    dome(name+' main dome',(x,y,base+height*.45),span*.30,roof,parent,1.05)
    # Smaller half-domes at the four edges produce a layered Ottoman roofline.
    for sx,sy in [(-1,0),(1,0),(0,-1),(0,1)]:
        dome(name+' half dome',(x+sx*span*.29,y+sy*span*.21,base+height*.33),span*.17,roof,parent,.92)
    for i in range(minarets):
        a=2*math.pi*i/max(1,minarets)+.35
        minaret(name+f' minaret {i+1}',x+math.cos(a)*span*.48,y+math.sin(a)*span*.4,base,height*1.38,parent,stone)

def create_landmarks():
    # Byzantine landmark core: a broad basilica mass and a low central dome.
    bx,by=-5.9,1.0; base=height_at(bx,by)
    box('Hagia Sophia | basilica nave',(bx,by,base+.50),(3.5,2.25,1.0),MAT_STONE,L_LAND,.08)
    box('Hagia Sophia | upper drum',(bx,by,base+1.17),(2.65,1.9,.44),MAT_OTTOMAN,L_LAND,.05)
    # Repeated arched openings and stone piers make the basilica read as a monument, not a block.
    for i in range(9):
        xx=bx+(i-4)*.35
        arch_window(f'Hagia Sophia | nave arch {i+1}',xx,by-1.126,base+.20,.22,.56,L_LAND,'south')
        box(f'Hagia Sophia | nave pier {i+1}',(xx,by-1.145,base+.49),(.055,.05,.84),MAT_STONE,L_LAND,.012)
    for i in range(7):
        xx=bx+(i-3)*.33
        arch_window(f'Hagia Sophia | drum window {i+1}',xx,by-.96,base+1.02,.18,.28,L_LAND,'south')
    arch_window('Hagia Sophia | west portal',bx,by-1.15,base+.10,.48,.82,L_LAND,'south')
    # Buttresses and corner piers articulate the long basilica body.
    for side in (-1,1):
        for k in (-.76,0,.76):
            box(f'Hagia Sophia | side buttress {side}.{k}',(bx+side*1.79,by+k,base+.48),(.22,.30,.92),MAT_STONE,L_LAND,.025)
    dome('Hagia Sophia | main dome',(bx,by,base+1.55),1.28,MAT_CLAY,L_LAND,1.10)
    for sx,sy,rr in [(-1.55,0,.74),(1.55,0,.74),(0,-.92,.64),(0,.92,.64)]:
        dome('Hagia Sophia | semi dome',(bx+sx,by+sy,base+.86),rr,MAT_CLAY,L_LAND,.90)
    # Ottoman-era minarets added separately to keep the Byzantine silhouette distinct.
    for k,(sx,sy) in enumerate([(-1.7,-1.15),(1.7,-1.15),(-1.7,1.15),(1.7,1.15)]):
        minaret(f'Hagia Sophia minaret {k+1}',bx+sx,by+sy,base,3.55,L_OTT,MAT_STONE)
    # Suleymaniye on the ridge, with four tall minarets and cascading domes.
    mosque('Suleymaniye Mosque',-11.0,-2.2,height_at(-11.0,-2.2),3.25,2.45,L_OTT,MAT_STONE,MAT_OTT_ROOF,4)
    # Topkapi palace as a sequence of low courtyards and pavilions on the headland.
    tx,ty=-5.0,-.8; tb=height_at(tx,ty)
    box('Topkapi | first court',(tx,ty,tb+.20),(3.3,2.2,.4),MAT_STONE,L_OTT,.04)
    for j in range(4):
        px=tx-1.0+(j%2)*1.35; py=ty-.55+(j//2)*1.0
        box(f'Topkapi | pavilion {j+1}',(px,py,tb+.72),(1.05,.78,.72),MAT_OTTOMAN,L_OTT,.07)
        dome(f'Topkapi | pavilion roof {j+1}',(px,py,tb+1.10),.38,MAT_OTT_ROOF,L_OTT,.95)
    # Galata Tower on the north shore of the Golden Horn.
    gx,gy=-7.7,-5.9; gb=height_at(gx,gy)
    cyl('Galata Tower | shaft',(gx,gy,gb+1.0),.64,2.0,MAT_STONE,L_LAND,32)
    cyl('Galata Tower | crown',(gx,gy,gb+2.08),.72,.28,MAT_OTT_ROOF,L_LAND,32)
    cyl('Galata Tower | roof',(gx,gy,gb+2.54),.67,.72,MAT_CLAY,L_LAND,32,r2=.05)
    # Theodosian wall: low curtain wall with regular towers along the western edge.
    for i in range(17):
        y=-5.0+i*.72; x=-13.8+.15*math.sin(y*.24); z=height_at(x,y)
        box(f'Theodosian curtain {i+1}',(x,y,z+.32),(.26,.78,.64),MAT_STONE,L_BYZ,.025)
        if i%2==0:
            cyl(f'Theodosian tower {i//2+1}',(x-.08,y,z+.76),.28,.95,MAT_STONE,L_BYZ,12)
            cyl(f'Tower crown {i//2+1}',(x-.08,y,z+1.26),.34,.15,MAT_CLAY,L_BYZ,12)
    # Small harbor/sea walls give the peninsula a legible historic edge.
    for i in range(12):
        x=-10.2+i*.58; y=8.2+.18*math.sin(i*.4); z=height_at(x,y)
        box(f'Old sea wall {i+1}',(x,y,z+.21),(.56,.20,.42),MAT_STONE,L_BYZ,.02)
    # Ottoman-era market hall and covered bazaar marker.
    bx2,by2=-9.1,.2; bb=height_at(bx2,by2)
    for i in range(3):
        box(f'Covered bazaar hall {i+1}',(bx2+i*.68,by2,bb+.42),(.62,1.28,.84),MAT_OTTOMAN,L_OTT,.035)
        dome(f'Covered bazaar roof {i+1}',(bx2+i*.68,by2,bb+.90),.30,MAT_OTT_ROOF,L_OTT,.48)
    # Modern landmark cluster on the Asian shore, introduced in the late timeline.
    for i,(x,y,h,w) in enumerate([(8.1,-8.0,5.4,.52),(9.0,-8.35,4.2,.44),(7.3,-7.1,3.7,.50),(10.2,-7.0,3.0,.56)]):
        z=height_at(x,y)
        box(f'Contemporary tower {i+1}',(x,y,z+h/2),(w,w*.88,h),MAT_MODERN,L_MOD,.035)
        box(f'Tower crown {i+1}',(x,y,z+h+.06),(w*.92,w*.84,.12),MAT_GOLD,L_MOD,.012)
        # thin vertical glazing ribs
        for j in range(3): box(f'Tower fin {i+1}.{j+1}',(x-w*.31+j*w*.31,y-w*.45,z+h*.54),(.018,.025,h*.84),MAT_GLASS,L_MOD)

def build_bridges():
    # Two stylized Bosporus crossings, added only in the modern era.
    for idx,yy in enumerate([-14.8,4.1]):
        x=bosphorus_x(yy); half=1.9; z=height_at(x-half,yy)
        box(f'Bosphorus bridge {idx+1} deck',(x,yy,z+.58),(half*2,.22,.15),MAT_MODERN,L_BRIDGE,.03)
        for side in (-1,1):
            px=x+side*half*.56
            box(f'Bridge {idx+1} pylon {side}',(px,yy,z+2.15),(.22,.30,3.1),MAT_STONE,L_BRIDGE,.04)
            # Slender suspension stays represented as tapered rods.
            for t in range(1,6):
                xx=px+side*(t*.25); zz=z+2.9-t*.40
                cyl(f'Bridge {idx+1} stay {side}.{t}',((px+xx)/2,yy,zz),.022,math.hypot(xx-px,2.9-zz),MAT_GOLD,L_BRIDGE,8,r2=.012)

# Building layers: a handful of early houses, then urban fabric in progressively wider rings.
def build_cities():
    totals=[]
    _,n,w=add_building_mesh('Early timber-and-stone settlement',L_EARLY,[(-5.8,1.6,2.3,2.5)],18,(.22,.40),(.24,.46),[MAT_WOOD,MAT_OTTOMAN],[MAT_CLAY,MAT_WOOD],'early'); totals.append(('early',n,w))
    byz_centres=[(-5.8,1.0,7.0,7.0),(-7.7,-6.0,4.5,4.5)]
    _,n,w=add_building_mesh('Byzantine residential quarters | pitched roofs and arcades',L_BYZ,byz_centres,80,(.22,.44),(.32,.82),[MAT_STONE,MAT_OTTOMAN],[MAT_CLAY,MAT_STONE],'byz'); totals.append(('byzantine',n,w))
    ott_centres=[(-5.8,1.0,9.0,9.0),(-7.4,-6.1,7.0,5.5),(7.4,1.3,7.5,8.0)]
    _,n,w=add_building_mesh('Ottoman neighborhoods | courtyards and tiled roofs',L_OTT,ott_centres,120,(.22,.44),(.28,.82),[MAT_OTTOMAN,MAT_STONE,MAT_WOOD],[MAT_OTT_ROOF,MAT_CLAY,MAT_STONE],'ottoman'); totals.append(('ottoman',n,w))
    modern_centres=[(11,0,8,12),(7,12,8,4),(-15,12,6,4),(-16,-9,5,7)]
    _,n,w=add_building_mesh('Modern outer districts | terraces and glazing',L_MOD,modern_centres,360,(.13,.38),(.30,1.05),[MAT_MODERN,MAT_STONE,MAT_OTTOMAN],[MAT_MODERN,MAT_DARK],'modern'); totals.append(('modern outskirts',n,w))
    return totals

terrain_obj=build_terrain(); build_water(); build_forest(); totals=build_cities(); osm_count=add_osm_city_footprints(osm_path); road_count=add_osm_roads(osm_path)
build_historic_roofscape(terrain_obj,'byzantine-roofscape.png','Byzantine roofscape | illustrative texture',L_BYZ,.014)
build_historic_roofscape(terrain_obj,'ottoman-roofscape.png','Ottoman roofscape | illustrative texture',L_OTT,.024)
build_satellite_surface(terrain_obj); create_landmarks(); build_bridges()
# A subdued ambient light and orthographic-like camera setup are embedded for model previews.
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE_NEXT'; scene.eevee.taa_render_samples=16
scene.world.color=(.12,.18,.22)
# Export the entire layered scene, retaining layer empties for Remotion visibility animation.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_apply=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
print('Wrote layered Istanbul scene:',out,'| building counts:',totals,'| OSM footprints:',osm_count,'| road segments:',road_count)
