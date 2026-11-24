"""Renderiza fotogramas sueltos de la escena para revisar.
Uso: python3 scripts/foto.py -- <escena.blend> <carpeta> <porcentaje de resolución> <muestras> <frame1> <frame2> ...
"""
import sys, time
import bpy
a = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.open_mainfile(filepath=a[0])
sc = bpy.context.scene
sc.render.resolution_percentage = int(a[2]); sc.cycles.samples = int(a[3])
for f in map(int, a[4:]):
    sc.frame_set(f)
    for mk in sorted(sc.timeline_markers, key=lambda m: m.frame):
        if mk.frame <= f and mk.camera: sc.camera = mk.camera
    sc.render.filepath = f"{a[1]}/f{f:04d}.png"
    t = time.time(); bpy.ops.render.render(write_still=True); print("frame", f, round(time.time() - t, 1), "s")
