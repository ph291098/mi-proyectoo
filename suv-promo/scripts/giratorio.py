"""Vistas de revisión del modelo: fondo gris, 6 ángulos. Uso: python3 scripts/giratorio.py -- <modelo.glb> <carpeta>"""
import math, sys
import bpy
from mathutils import Vector
a = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=a[0])
objs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (mn + mx) / 2; r = (mx - mn).length
print("dim", [round(v, 3) for v in (mx - mn)], "tris", sum(len(o.data.polygons) for o in objs), "materiales", [m.name for o in objs for m in o.data.materials], "imágenes", [(i.name, tuple(i.size)) for i in bpy.data.images])
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.5, 0.52, 0.55, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.1
bpy.ops.object.light_add(type="SUN", rotation=(0.9, 0, 0.6)); bpy.context.object.data.energy = 3
cam = bpy.data.cameras.new("c"); cam.lens = 60; co = bpy.data.objects.new("c", cam); sc.collection.objects.link(co); sc.camera = co
e = bpy.data.objects.new("t", None); sc.collection.objects.link(e); e.location = c
tr = co.constraints.new("TRACK_TO"); tr.target = e; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
sc.render.engine = "CYCLES"; sc.cycles.samples = 24; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 800, 520
for i, ang in enumerate([0, 60, 120, 180, 240, 300]):
    t = math.radians(ang)
    co.location = c + Vector((math.sin(t) * r * 1.5, -math.cos(t) * r * 1.5, r * 0.35))
    sc.render.filepath = f"{a[1]}/v{ang:03d}.png"; bpy.ops.render.render(write_still=True)
