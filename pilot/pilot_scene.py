# Blender 4.x — TopBuzz pilot: style proof scene (NO plain cubes).
# Faceted low-poly terrain + bay + gabled-roof houses + cypress trees +
# domed landmark + warm golden sun. Renders N frames to OUT_DIR.
import bpy, math, os, random
from mathutils import Vector

random.seed(7)
OUT = os.environ.get("OUT_DIR", "./out")
os.makedirs(OUT, exist_ok=True)
FRAMES = int(os.environ.get("PILOT_FRAMES", "8"))
RES_X, RES_Y = int(os.environ.get("RES_X", "960")), int(os.environ.get("RES_Y", "540"))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

def mat(name, rgb, rough=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = rough
    for k in ("Specular IOR Level", "Specular"):
        if k in b.inputs: b.inputs[k].default_value = 0.2
    return m

M_GRASS   = mat("grass",   (0.36, 0.42, 0.18))
M_DRY     = mat("dryland", (0.58, 0.52, 0.26))
M_FOREST  = mat("forest",  (0.16, 0.30, 0.13))
M_WATER   = mat("water",   (0.10, 0.35, 0.42), rough=0.55)
M_WALL_A  = mat("wallA",   (0.93, 0.87, 0.72))
M_WALL_B  = mat("wallB",   (0.85, 0.78, 0.62))
M_WALL_C  = mat("wallC",   (0.78, 0.66, 0.50))
M_ROOF_A  = mat("roofA",   (0.72, 0.30, 0.14))
M_ROOF_B  = mat("roofB",   (0.62, 0.24, 0.12))
M_ROOF_C  = mat("roofC",   (0.80, 0.38, 0.18))
M_STONE   = mat("stone",   (0.55, 0.50, 0.42))
M_DOME    = mat("dome",    (0.45, 0.52, 0.55))
M_CYPRESS = mat("cypress", (0.10, 0.24, 0.10))
M_TRUNK   = mat("trunk",   (0.30, 0.22, 0.14))

# ---------------- terrain ----------------
def H(x, y):
    h = 3.0*math.sin(x*0.06)*math.cos(y*0.05) + 1.6*math.sin(x*0.13+1.3)*math.sin(y*0.11+0.6)
    h += 7.0*math.exp(-((x-18)**2+(y+12)**2)/450.0)
    h += 5.0*math.exp(-((x-26)**2+(y-20)**2)/300.0)
    h -= 14.0*math.exp(-((x+30)**2+(y-8)**2)/500.0)   # bay (west)
    return h

EXT, N = 70.0, 64
verts, faces = [], []
for j in range(N+1):
    for i in range(N+1):
        x = -EXT + 2*EXT*i/N; y = -EXT + 2*EXT*j/N
        verts.append((x, y, H(x, y)))
for j in range(N):
    for i in range(N):
        a = j*(N+1)+i
        faces.append((a, a+1, a+(N+1)+1, a+(N+1)))
terr = bpy.data.meshes.new("terrain"); terr.from_pydata(verts, [], faces)
for m in (M_GRASS, M_DRY, M_FOREST): terr.materials.append(m)
for p in terr.polygons:
    z = sum(terr.vertices[v].co.z for v in p.vertices)/len(p.vertices)
    p.material_index = 2 if z > 5.2 else (1 if z > 2.4 else 0)
    p.use_smooth = False
terr_obj = bpy.data.objects.new("Terrain", terr)
bpy.context.collection.objects.link(terr_obj)

bpy.ops.mesh.primitive_plane_add(size=4*EXT, location=(0, 0, -1.6))
water = bpy.context.object; water.data.materials.append(M_WATER)

# ---------------- gabled house ----------------
def house_mesh(name, wall, roof, w_, d_, h_):
    hw, hd, r = w_/2, d_/2, h_*0.55
    v = [( hw,-hd,0),( hw, hd,0),(-hw,-hd,0),(-hw, hd,0),
         ( hw,-hd,h_),( hw, hd,h_),(-hw,-hd,h_),(-hw, hd,h_),
         ( hw,0,h_+r),(-hw,0,h_+r)]
    f = [(0,1,5,4),(2,3,7,6),(0,4,6,2),(1,3,7,5),   # walls (idx 0-3)
         (4,5,8),(7,6,9),                            # gables (4-5)
         (6,4,8,9),(5,7,9,8)]                        # roof slopes (6-7)
    m = bpy.data.meshes.new(name); m.from_pydata(v, [], f)
    m.materials.append(wall); m.materials.append(roof)
    for p in m.polygons:
        p.material_index = 1 if p.index >= 6 else 0
        p.use_smooth = False
    m.update()
    return m

HOUSE_MESHES = [
    house_mesh("hA", M_WALL_A, M_ROOF_A, 3.2, 4.6, 2.6),
    house_mesh("hB", M_WALL_B, M_ROOF_B, 2.8, 4.0, 2.4),
    house_mesh("hC", M_WALL_C, M_ROOF_C, 3.6, 5.2, 3.0),
]

def place(obj, x, y, rot=0.0):
    obj.location = (x, y, H(x, y))
    obj.rotation_euler = (0, 0, rot)
    bpy.context.collection.objects.link(obj)

# city scatter (terraced feel, above the bay)
spots, tries = [], 0
while len(spots) < 110 and tries < 4000:
    tries += 1
    x, y = random.uniform(-28, 30), random.uniform(-30, 30)
    z = H(x, y)
    if z < 0.6 or z > 7.5: continue
    if any((x-sx)**2+(y-sy)**2 < 9.0 for sx, sy in spots): continue
    spots.append((x, y))

for idx, (x, y) in enumerate(spots):
    o = bpy.data.objects.new(f"house{idx}", HOUSE_MESHES[idx % 3])
    s = random.uniform(0.85, 1.25); o.scale = (s, s, s)
    place(o, x, y, random.uniform(-0.5, 0.5))

# ---------------- landmark: domed hall with towers ----------------
def box(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale
    o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth = False
    return o

LX, LY = 14.0, 8.0; Z0 = H(LX, LY)
box("hall", (LX, LY, Z0+2.0), (5.5, 5.5, 2.0), M_STONE)
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=3.0, depth=2.2, location=(LX, LY, Z0+5.0))
bpy.context.object.data.materials.append(M_WALL_A)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=3.0, location=(LX, LY, Z0+6.2))
dome = bpy.context.object; dome.scale = (1, 1, 0.62); dome.data.materials.append(M_DOME)
for dx in (-4.6, 4.6):
    for dy in (-4.6, 4.6):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.6, depth=6.0, location=(LX+dx, LY+dy, Z0+4.0))
        bpy.context.object.data.materials.append(M_WALL_B)

# ---------------- cypress trees ----------------
def cypress(x, y, hgt):
    z = H(x, y)
    bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=0.9, radius2=0.12, depth=hgt, location=(x, y, z+hgt/2))
    bpy.context.object.data.materials.append(M_CYPRESS)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.18, depth=0.8, location=(x, y, z+0.4))
    bpy.context.object.data.materials.append(M_TRUNK)

placed = 0; tries = 0
while placed < 28 and tries < 500:
    tries += 1
    x, y = random.uniform(-20, 34), random.uniform(-34, 34)
    if H(x, y) > 0.8:
        cypress(x, y, random.uniform(2.6, 4.2)); placed += 1

# ---------------- light & world ----------------
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN'))
bpy.context.collection.objects.link(sun)
sun.data.energy = 3.2; sun.data.angle = 0.02; sun.data.color = (1.0, 0.82, 0.62)
sun.rotation_euler = (math.radians(38), 0, math.radians(35))
world = bpy.data.worlds.new("W"); bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.92, 0.78, 0.62, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.55

# ---------------- camera ----------------
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
bpy.context.collection.objects.link(cam); bpy.context.scene.camera = cam
cam.data.lens = 52; cam.data.sensor_width = 36
TARGET = Vector((-2, 0, 1.5))
def aim(o, t):
    o.rotation_euler = (t - o.location).to_track_quat('-Z', 'Y').to_euler()

# ---------------- render setup ----------------
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for backend in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = backend; prefs.get_devices()
            enabled = [d for d in prefs.devices if d.type != 'CPU']
            for d in prefs.devices: d.use = (d.type != 'CPU')
            if enabled:
                print("Cycles backend:", backend, [d.name for d in prefs.devices if d.use]); break
        except Exception as e:
            print("backend", backend, "failed:", e)
    sc.cycles.device = 'GPU'
except Exception as e:
    print("GPU setup fallback:", e)
sc.cycles.samples = 48
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = RES_X, RES_Y
try:
    sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    try: sc.view_settings.look = 'Medium High Contrast'
    except Exception: pass
sc.render.image_settings.file_format = 'PNG'

print("SCENE BUILT:", len(bpy.context.scene.objects), "objects | frames:", FRAMES, "->", OUT, flush=True)
for f in range(1, FRAMES+1):
    t = f / max(FRAMES-1, 1)
    cam.location = Vector((-52 + 10*t, -46 + 8*t, 34 - 4*t))
    aim(cam, TARGET)
    sc.render.filepath = os.path.abspath(os.path.join(OUT, f"frame_{f:04d}.png"))
    bpy.ops.render.render(write_still=True)
    print("RENDERED", sc.render.filepath, flush=True)
print("PILOT DONE", flush=True)
