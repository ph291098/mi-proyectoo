"""Monta la escena de Blender: el SUV (GLB) rodando por una carretera nevada, con tres cámaras.

Uso:
  python3 scripts/escena.py -- <modelo.glb> <salida.blend> [giro_z en grados] [largo real en m]

El giro corrige hacia dónde mira el coche al importarlo (debe mirar a +Y, el sentido de la marcha).
Requiere el módulo bpy (pip install bpy).
"""
import math
import random
import sys

import bpy  # bpy debe importarse antes que bmesh y mathutils
import bmesh
from mathutils import Vector, noise

args = sys.argv[sys.argv.index("--") + 1:]
GLB, SALIDA = args[0], args[1]
GIRO_Z = math.radians(float(args[2])) if len(args) > 2 else 0.0
LARGO = float(args[3]) if len(args) > 3 else 4.64          # largo real aproximado de un SUV compacto

FPS, FRAMES = 24, 240                                         # 10 s
VEL = 15.0                                                    # m/s (54 km/h): creíble sobre nieve
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, FRAMES
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"


def enlazar(obj, nombre_col):
    col = bpy.data.collections.get(nombre_col)
    if not col:
        col = bpy.data.collections.new(nombre_col)
        sc.collection.children.link(col)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)
    return obj


def material(nombre, color, rugosidad=0.5, metal=0.0, emision=None, fuerza=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rugosidad
    p.inputs["Metallic"].default_value = metal
    if emision:
        p.inputs["Emission Color"].default_value = (*emision, 1)
        p.inputs["Emission Strength"].default_value = fuerza
    return m


# ------------------------------------------------------------------ coche
bpy.ops.import_scene.gltf(filepath=GLB)
piezas = [o for o in bpy.context.selected_objects if o.type == "MESH"]
coche = bpy.data.objects.new("SUV", None)                    # vacío que mueve todo el coche
enlazar(coche, "Coche")
modelo = bpy.data.objects.new("SUV_modelo", None)            # corrige escala y orientación del GLB
enlazar(modelo, "Coche")
modelo.parent = coche
for o in bpy.context.selected_objects:
    enlazar(o, "Coche")
    if o.parent is None:
        o.parent = modelo
bpy.context.view_layer.update()


def caja(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))


modelo.rotation_euler.z = GIRO_Z
bpy.context.view_layer.update()
mn, mx = caja(piezas)
dim = mx - mn
k = LARGO / max(dim.x, dim.y)
modelo.scale = (k, k, k)
bpy.context.view_layer.update()
mn, mx = caja(piezas)
modelo.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)
bpy.context.view_layer.update()
mn, mx = caja(piezas)
print("COCHE dimensiones (m):", [round(v, 2) for v in (mx - mn)], "triángulos:", sum(len(o.data.polygons) for o in piezas))
for o in piezas:
    for poly in o.data.polygons:
        poly.use_smooth = True

# pintura: el modelo generado sale gris neutro; se entona hacia el bronce de las fotos y se le da barniz
for mat in {m for o in piezas for m in o.data.materials if m}:
    arbol = mat.node_tree
    bsdf = next((n for n in arbol.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if not bsdf:
        continue
    enlace = next((l for l in arbol.links if l.to_socket == bsdf.inputs["Base Color"]), None)
    if enlace:
        tinte = arbol.nodes.new("ShaderNodeMixRGB")
        tinte.blend_type, tinte.inputs["Fac"].default_value = "MULTIPLY", 1.0
        tinte.inputs["Color2"].default_value = (1.0, 0.9, 0.76, 1)
        origen = enlace.from_socket
        arbol.links.remove(enlace)
        arbol.links.new(origen, tinte.inputs["Color1"])
        arbol.links.new(tinte.outputs[0], bsdf.inputs["Base Color"])
    bsdf.inputs["Coat Weight"].default_value = 0.35
    bsdf.inputs["Coat Roughness"].default_value = 0.12

# faros y pilotos (luz real, además de la textura)
for lado in (-0.62, 0.62):
    luz = bpy.data.lights.new("faro", "SPOT")
    luz.energy, luz.spot_size, luz.spot_blend, luz.color = 2500, math.radians(70), 0.6, (1.0, 0.95, 0.86)
    f = bpy.data.objects.new("faro", luz)
    enlazar(f, "Coche")
    f.parent = coche
    f.location = (lado, LARGO / 2 - 0.1, 0.95)
    f.rotation_euler = (math.radians(86), 0, 0)
piloto = bpy.data.lights.new("piloto", "AREA")
piloto.energy, piloto.color, piloto.size = 14, (1.0, 0.08, 0.05), 0.8
pl = bpy.data.objects.new("piloto", piloto)
enlazar(pl, "Coche")
pl.parent = coche
pl.location = (0, -LARGO / 2 - 0.25, 1.05)
pl.rotation_euler = (math.radians(-90), 0, 0)

# luces de relleno que viajan con el coche (como un coche-cámara con paneles): flanco izquierdo y trasera derecha
for nombre, pos, energia in (("relleno_izq", (-6.5, 3.5, 3.6), 1400), ("relleno_tras", (5.5, -6.5, 4.2), 900)):
    luz = bpy.data.lights.new(nombre, "AREA")
    luz.energy, luz.size, luz.color = energia, 6.0, (1.0, 0.9, 0.8)
    o = bpy.data.objects.new(nombre, luz)
    enlazar(o, "Coche")
    o.parent = coche
    o.location = pos
    o.rotation_euler = (Vector((0, 0, 1.0)) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()

# marcha: avanza por +Y a velocidad constante, con un leve vaivén de suspensión
coche.location = (1.75, 0, 0)                                # por el carril derecho
coche.keyframe_insert("location", frame=1)
coche.location = (1.75, VEL * FRAMES / FPS, 0)
coche.keyframe_insert("location", frame=FRAMES)
z_base = modelo.location.z                                   # altura a la que las ruedas pisan la carretera
for fr in range(1, FRAMES + 1, 6):
    modelo.location.z = z_base + 0.01 * math.sin(fr * 0.9) + 0.005 * random.uniform(-1, 1)
    modelo.keyframe_insert("location", frame=fr)

# ------------------------------------------------------------------ carretera
Y0, Y1, ANCHO = -120.0, 420.0, 8.0
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, (Y0 + Y1) / 2, 0.0))
via = enlazar(bpy.context.object, "Entorno")
via.name = "Carretera"
via.scale = (ANCHO, Y1 - Y0, 1)
m = bpy.data.materials.new("asfalto_nevado")
m.use_nodes = True
nt = m.node_tree
p = nt.nodes["Principled BSDF"]
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(tc.outputs["Object"], sep.inputs[0])
# |x| en metros desde el eje (la escala del objeto es el ancho)
absx = nt.nodes.new("ShaderNodeMath"); absx.operation = "ABSOLUTE"
nt.links.new(sep.outputs["X"], absx.inputs[0])
metros = nt.nodes.new("ShaderNodeMath"); metros.operation = "MULTIPLY"; metros.inputs[1].default_value = ANCHO
nt.links.new(absx.outputs[0], metros.inputs[0])
mapa = nt.nodes.new("ShaderNodeMapping"); mapa.inputs["Scale"].default_value = (ANCHO, Y1 - Y0, 1)
nt.links.new(tc.outputs["Object"], mapa.inputs[0])
ruido = nt.nodes.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = 0.55; ruido.inputs["Detail"].default_value = 6
nt.links.new(mapa.outputs[0], ruido.inputs["Vector"])
grano = nt.nodes.new("ShaderNodeTexNoise"); grano.inputs["Scale"].default_value = 9.0; grano.inputs["Detail"].default_value = 4
nt.links.new(mapa.outputs[0], grano.inputs["Vector"])
# roderas limpias a ±1,0 m del centro de cada carril (carriles en x = ±1,75)
def rodera(centro):
    resta = nt.nodes.new("ShaderNodeMath"); resta.operation = "SUBTRACT"; resta.inputs[1].default_value = centro
    nt.links.new(metros.outputs[0], resta.inputs[0])
    d = nt.nodes.new("ShaderNodeMath"); d.operation = "ABSOLUTE"
    nt.links.new(resta.outputs[0], d.inputs[0])
    r = nt.nodes.new("ShaderNodeMapRange"); r.inputs["From Min"].default_value = 0.18; r.inputs["From Max"].default_value = 0.5
    r.inputs["To Min"].default_value = 0.0; r.inputs["To Max"].default_value = 1.0
    nt.links.new(d.outputs[0], r.inputs["Value"])
    return r
r1, r2 = rodera(0.95), rodera(2.55)
fuera = nt.nodes.new("ShaderNodeMath"); fuera.operation = "MINIMUM"
nt.links.new(r1.outputs[0], fuera.inputs[0]); nt.links.new(r2.outputs[0], fuera.inputs[1])
suma = nt.nodes.new("ShaderNodeMath"); suma.operation = "MULTIPLY_ADD"; suma.inputs[1].default_value = 0.9; suma.inputs[2].default_value = -0.28
nt.links.new(ruido.outputs["Fac"], suma.inputs[0])
nieve = nt.nodes.new("ShaderNodeMath"); nieve.operation = "ADD"; nieve.use_clamp = True
nt.links.new(fuera.outputs[0], nieve.inputs[0]); nt.links.new(suma.outputs[0], nieve.inputs[1])
contraste = nt.nodes.new("ShaderNodeMapRange"); contraste.inputs["From Min"].default_value = 0.55; contraste.inputs["From Max"].default_value = 0.95
nt.links.new(nieve.outputs[0], contraste.inputs["Value"])
asf = nt.nodes.new("ShaderNodeMixRGB"); asf.inputs["Color1"].default_value = (0.018, 0.02, 0.024, 1); asf.inputs["Color2"].default_value = (0.07, 0.075, 0.085, 1)
nt.links.new(grano.outputs["Fac"], asf.inputs["Fac"])
mix = nt.nodes.new("ShaderNodeMixRGB"); mix.inputs["Color2"].default_value = (0.76, 0.82, 0.92, 1)
nt.links.new(contraste.outputs[0], mix.inputs["Fac"]); nt.links.new(asf.outputs[0], mix.inputs["Color1"])
nt.links.new(mix.outputs[0], p.inputs["Base Color"])
rug = nt.nodes.new("ShaderNodeMapRange"); rug.inputs["To Min"].default_value = 0.16; rug.inputs["To Max"].default_value = 0.75
nt.links.new(contraste.outputs[0], rug.inputs["Value"]); nt.links.new(rug.outputs[0], p.inputs["Roughness"])
bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35
nt.links.new(nieve.outputs[0], bump.inputs["Height"]); nt.links.new(bump.outputs[0], p.inputs["Normal"])
via.data.materials.append(m)

# ------------------------------------------------------------------ terreno nevado y montañas
def altura(x, y):
    d = abs(x) - ANCHO / 2
    berma = 0.55 * (1 - math.exp(-d / 1.2))                                   # el cordón de nieve del arcén
    lomas = 1.6 * noise.fractal(Vector((x * 0.012, y * 0.012, 3.1)), 1.0, 2.0, 4) * min(1.0, d / 12)
    monte = max(0.0, d - 45) ** 1.25 * 0.16 * (0.55 + 0.75 * abs(noise.fractal(Vector((x * 0.004, y * 0.004, 9.7)), 1.0, 2.0, 5)))
    return berma + lomas + monte

mat_nieve = bpy.data.materials.new("nieve")
mat_nieve.use_nodes = True
pn = mat_nieve.node_tree.nodes["Principled BSDF"]
pn.inputs["Base Color"].default_value = (0.78, 0.84, 0.94, 1)
pn.inputs["Roughness"].default_value = 0.55
rn = mat_nieve.node_tree.nodes.new("ShaderNodeTexNoise"); rn.inputs["Scale"].default_value = 180
bn = mat_nieve.node_tree.nodes.new("ShaderNodeBump"); bn.inputs["Strength"].default_value = 0.12
mat_nieve.node_tree.links.new(rn.outputs["Fac"], bn.inputs["Height"]); mat_nieve.node_tree.links.new(bn.outputs[0], pn.inputs["Normal"])

xs = [ANCHO / 2 + 400 * (i / 70) ** 2.2 for i in range(71)]                    # más denso junto a la carretera
ys = [Y0 - 60 + (Y1 - Y0 + 500) * j / 150 for j in range(151)]
for lado in (-1, 1):
    bm = bmesh.new()
    filas = [[bm.verts.new((lado * x, y, altura(lado * x, y))) for x in xs] for y in ys]
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            a, b, c, d = filas[j][i], filas[j][i + 1], filas[j + 1][i + 1], filas[j + 1][i]
            bm.faces.new((a, b, c, d) if lado > 0 else (a, d, c, b))
    me = bpy.data.meshes.new("terreno")
    bm.to_mesh(me); bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    t = bpy.data.objects.new("Terreno_" + ("der" if lado > 0 else "izq"), me)
    enlazar(t, "Entorno")
    me.materials.append(mat_nieve)

# ------------------------------------------------------------------ pinos nevados y balizas
mat_pino = bpy.data.materials.new("pino")
mat_pino.use_nodes = True
pp = mat_pino.node_tree.nodes["Principled BSDF"]
geo = mat_pino.node_tree.nodes.new("ShaderNodeNewGeometry")
sz = mat_pino.node_tree.nodes.new("ShaderNodeSeparateXYZ")
mat_pino.node_tree.links.new(geo.outputs["Normal"], sz.inputs[0])
rp = mat_pino.node_tree.nodes.new("ShaderNodeMapRange"); rp.inputs["From Min"].default_value = 0.35; rp.inputs["From Max"].default_value = 0.7
mat_pino.node_tree.links.new(sz.outputs["Z"], rp.inputs["Value"])
mp = mat_pino.node_tree.nodes.new("ShaderNodeMixRGB"); mp.inputs["Color1"].default_value = (0.008, 0.022, 0.014, 1); mp.inputs["Color2"].default_value = (0.74, 0.8, 0.9, 1)
mat_pino.node_tree.links.new(rp.outputs[0], mp.inputs["Fac"]); mat_pino.node_tree.links.new(mp.outputs[0], pp.inputs["Base Color"])
pp.inputs["Roughness"].default_value = 0.7

bm = bmesh.new()
PISOS = 9
for i in range(PISOS):
    u = i / (PISOS - 1)
    r, h, z = 1.7 * (1 - u) ** 0.8 + 0.18, 1.5 - 0.5 * u, 1.1 + 6.2 * u ** 0.92
    geom = bmesh.ops.create_cone(bm, cap_ends=False, segments=11, radius1=r, radius2=r * 0.12, depth=h)
    for v in geom["verts"]:                                                   # borde irregular, ramas caídas
        if v.co.z < 0:
            v.co.x *= random.uniform(0.82, 1.18); v.co.y *= random.uniform(0.82, 1.18); v.co.z -= random.uniform(0, 0.25)
    bmesh.ops.rotate(bm, verts=geom["verts"], cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(random.uniform(0, 6.28), 3, "Z"))
    bmesh.ops.translate(bm, verts=geom["verts"], vec=(0, 0, z + h / 2))
tronco = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.22, radius2=0.18, depth=1.4)
bmesh.ops.translate(bm, verts=tronco["verts"], vec=(0, 0, 0.6))
malla_pino = bpy.data.meshes.new("pino")
bm.to_mesh(malla_pino); bm.free()
malla_pino.materials.append(mat_pino)
n = 0
while n < 320:
    lado = random.choice((-1, 1))
    d = random.uniform(5.5, 150) ** 1.0
    x, y = lado * (ANCHO / 2 + d), random.uniform(Y0, Y1 + 250)
    if d < 40 and random.random() < 0.55:
        continue                                                              # menos árboles pegados al arcén
    o = bpy.data.objects.new("Pino", malla_pino)
    enlazar(o, "Entorno")
    s = random.uniform(0.9, 2.1)
    o.location = (x, y, altura(x, y) - 0.2)
    o.scale = (s, s, s * random.uniform(0.9, 1.3))
    o.rotation_euler.z = random.uniform(0, 6.28)
    n += 1

mat_baliza = material("baliza", (0.7, 0.2, 0.03), 0.5, emision=(1.0, 0.3, 0.02), fuerza=0.25)
bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.4, vertices=8)
base_baliza = bpy.context.object
base_baliza.data.materials.append(mat_baliza)
malla_baliza = base_baliza.data
bpy.data.objects.remove(base_baliza)
y = Y0
while y < Y1:
    for lado in (-1, 1):
        o = bpy.data.objects.new("Baliza", malla_baliza)
        enlazar(o, "Entorno")
        o.location = (lado * (ANCHO / 2 + 0.5), y, 1.1)
    y += 22

# ------------------------------------------------------------------ cielo, sol bajo y nevada
mundo = bpy.data.worlds.new("Mundo")
sc.world = mundo
mundo.use_nodes = True
wn = mundo.node_tree
fondo = wn.nodes["Background"]
wtc = wn.nodes.new("ShaderNodeTexCoord")
wsep = wn.nodes.new("ShaderNodeSeparateXYZ")
wn.links.new(wtc.outputs["Generated"], wsep.inputs[0])                        # en el mundo, «Generated» es la dirección de la vista
wrango = wn.nodes.new("ShaderNodeMapRange"); wrango.inputs["From Min"].default_value = -0.05; wrango.inputs["From Max"].default_value = 0.7
wn.links.new(wsep.outputs["Z"], wrango.inputs["Value"])
rampa = wn.nodes.new("ShaderNodeValToRGB")
rampa.color_ramp.elements[0].position = 0.0; rampa.color_ramp.elements[0].color = (0.85, 0.5, 0.36, 1)      # horizonte cálido
rampa.color_ramp.elements[1].position = 1.0; rampa.color_ramp.elements[1].color = (0.03, 0.07, 0.2, 1)       # cenit azul oscuro
medio = rampa.color_ramp.elements.new(0.22); medio.color = (0.3, 0.4, 0.62, 1)
wn.links.new(wrango.outputs[0], rampa.inputs[0]); wn.links.new(rampa.outputs[0], fondo.inputs["Color"])
fondo.inputs["Strength"].default_value = 1.0

sol = bpy.data.lights.new("Sol", "SUN")
sol.energy, sol.angle, sol.color = 3.4, math.radians(3), (1.0, 0.66, 0.42)
so = bpy.data.objects.new("Sol", sol)
enlazar(so, "Entorno")
so.rotation_euler = (math.radians(72), 0, math.radians(-125))                 # bajo (18°), desde delante-izquierda, por encima de las lomas

# copos: esferitas emisivas repartidas en el volumen que recorre el coche
mat_copo = material("copo", (1, 1, 1), 0.4, emision=(1, 1, 1), fuerza=1.5)
bm = bmesh.new()
recorrido = VEL * FRAMES / FPS
for _ in range(2600):
    c = Vector((random.uniform(-14, 14), random.uniform(-25, recorrido + 30), random.uniform(0.2, 9)))
    g = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=random.uniform(0.012, 0.03))
    bmesh.ops.translate(bm, verts=g["verts"], vec=c)
malla_copos = bpy.data.meshes.new("copos")
bm.to_mesh(malla_copos); bm.free()
malla_copos.materials.append(mat_copo)
copos = bpy.data.objects.new("Copos", malla_copos)
enlazar(copos, "Entorno")
copos.location = (1.75, 0, 0)
copos.keyframe_insert("location", frame=1)
copos.location = (2.6, 0, -4.0)                                                # caen y derivan con el viento
copos.keyframe_insert("location", frame=FRAMES)

# ------------------------------------------------------------------ cámaras (3 tomas de 80 fotogramas)
objetivo = bpy.data.objects.new("Objetivo", None)
enlazar(objetivo, "Camaras")
objetivo.parent = coche
objetivo.location = (0, 0.2, 0.85)

def camara(nombre, lente, desde, hasta, f0, f1):
    cam = bpy.data.cameras.new(nombre)
    cam.lens = lente
    cam.clip_end = 3000
    o = bpy.data.objects.new(nombre, cam)
    enlazar(o, "Camaras")
    o.parent = coche
    tr = o.constraints.new("TRACK_TO")
    tr.target, tr.track_axis, tr.up_axis = objetivo, "TRACK_NEGATIVE_Z", "UP_Y"
    o.location = desde; o.keyframe_insert("location", frame=f0)
    o.location = hasta; o.keyframe_insert("location", frame=f1)
    mk = sc.timeline_markers.new(nombre, frame=f0)
    mk.camera = o
    return o

c1 = camara("Toma1_frontal", 32, (-3.4, 7.6, 0.55), (-2.2, 6.2, 0.75), 1, 80)       # baja, tres cuartos delantero
c2 = camara("Toma2_lateral", 55, (-10.5, 2.4, 1.25), (-8.2, -0.6, 1.1), 81, 160)    # lateral con teleobjetivo
c3 = camara("Toma3_trasera", 28, (2.6, -6.4, 1.15), (4.4, -11.5, 4.6), 161, 240)    # persecución que se eleva
sc.camera = c1

# ------------------------------------------------------------------ render
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 20
sc.cycles.use_denoising = True
sc.cycles.use_adaptive_sampling = True
sc.cycles.max_bounces = 4
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.4
sc.render.use_persistent_data = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.view_settings.view_transform = "AgX"
sc.view_settings.exposure = 0.7
try:
    sc.view_settings.look = "AgX - High Contrast"
except Exception:
    pass

bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=SALIDA)
print("GUARDADO", SALIDA)
