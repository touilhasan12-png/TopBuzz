"""Generate a deliberately stylized, licensed-from-scratch landmark cluster.
Run: blender -b -P blender/generate_landmarks.py -- public/istanbul-landmarks.glb
"""
import bpy, sys, math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['public/istanbul-landmarks.glb']
out=args[0]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def mat(name,color,metallic=0.0,rough=0.7):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Metallic'].default_value=metallic; bs.inputs['Roughness'].default_value=rough
    return m
stone=mat('warm limestone',(.66,.52,.36)); roof=mat('aged copper',(.38,.20,.14)); gold=mat('soft brass',(.72,.54,.25),.35,.35)

def cube(name,loc,scale,material):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(material); return o

def cylinder(name,loc,radius,depth,material,verts=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc); o=bpy.context.object; o.name=name; o.data.materials.append(material); return o

def uv_sphere(name,loc,scale,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=1,location=loc); o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(material); return o

# Mosque massing and half-sphere dome: stylized reference, not an exact monument model.
cube('mosque main volume',(0,.85,0),(3.7,1.7,3.1),stone)
uv_sphere('central dome',(0,1.7,0),(1.35,.85,1.35),roof)
for i,(x,z) in enumerate([(-1.45,-1.25),(1.45,-1.25),(-1.45,1.25),(1.45,1.25)]):
    cylinder(f'minaret shaft {i}',(x,1.55,z),.12,3.1,stone,16)
    bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=.18,radius2=.015,depth=.65,location=(x,3.4,z)); bpy.context.object.name=f'minaret cap {i}'; bpy.context.object.data.materials.append(gold)
    cylinder(f'minaret balcony {i}',(x,2.65,z),.2,.09,gold,16)
# Courtyard / imperial pavilion.
cube('courtyard platform',(5,.12,-1),(4.8,.24,3.6),stone)
cube('pavilion',(5,.95,-1),(2.8,1.45,1.8),stone)
uv_sphere('pavilion dome',(5,1.78,-1),(1.05,.62,1.05),roof)
# Tower silhouette.
cylinder('Galata-style tower',(8,1.05,3),.62,2.1,stone,20)
bpy.ops.mesh.primitive_cone_add(vertices=20,radius1=.72,radius2=.04,depth=.7,location=(8,2.45,3)); bpy.context.object.name='tower roof'; bpy.context.object.data.materials.append(roof)
# Join mesh objects for a compact GLB while retaining material assignments.
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join()
meshes[0].name='Istanbul Landmark Cluster (stylized)'
bpy.ops.export_scene.gltf(filepath=out,export_format='GLB',export_apply=True)
print('Wrote',out)
