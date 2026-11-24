"""Renderiza la animación a una secuencia de PNG (reanudable: salta los fotogramas ya hechos).
Uso: python3 scripts/render.py -- <escena.blend> <carpeta> <porcentaje de resolución> [frame inicial] [frame final]
"""
import os, sys, time
import bpy
a = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.open_mainfile(filepath=a[0])
sc = bpy.context.scene
sc.render.resolution_percentage = int(a[2])
f0 = int(a[3]) if len(a) > 3 else sc.frame_start
f1 = int(a[4]) if len(a) > 4 else sc.frame_end
os.makedirs(a[1], exist_ok=True)
t0 = time.time()
for f in range(f0, f1 + 1):
    salida = f"{a[1]}/f{f:04d}.png"
    if os.path.exists(salida):
        continue
    sc.frame_set(f)
    for mk in sorted(sc.timeline_markers, key=lambda m: m.frame):
        if mk.frame <= f and mk.camera:
            sc.camera = mk.camera
    sc.render.filepath = salida
    bpy.ops.render.render(write_still=True)
    if f % 20 == 0:
        print("frame", f, "min transcurridos", round((time.time() - t0) / 60, 1), flush=True)
print("RENDER_OK")
