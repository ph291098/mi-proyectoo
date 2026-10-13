#!/usr/bin/env python3
"""Comprueba, FOTOGRAMA A FOTOGRAMA, que ningún gráfico tape la cara.

  uv run --with opencv-python-headless --with numpy python scripts/verifica.py

Lee cortes.json y work/<cid>_caras.json y cruza cada gráfico con la caja de la
cabeza en cada muestra donde ese gráfico está en pantalla. Informa del solape peor
y del segundo exacto en que ocurre, para poder ir a ver ese still.

Por qué fotograma a fotograma y no por tramo: la unión de las cabezas de 5 segundos
de alguien que gesticula ocupa casi todo el cuadro y declara imposible lo que sí
cabe. Para un panel FIJO da igual (la unión manda), pero para el raíl, los chips y
los subtítulos la diferencia es la que decide.

Salida 1 si algo supera el umbral, para poder encadenarlo antes de un render.
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from caras import serie, cara

import re
UMBRAL       = 0.02    # roce con el casco (gorro/barba): informativo
UMBRAL_CARA  = 0.01    # con la CARA: esto sí es un fallo
RAIZ = pathlib.Path(__file__).resolve().parent.parent

# Rectángulos de cada capa LEÍDOS de theme.ts: con valores quemados aquí, recalibrar
# theme.ts para un split dejaba al juez midiendo la geometría vieja.
_T = (RAIZ / "src" / "theme.ts").read_text()
def _num(nombre, defecto):
    m = re.search(rf"export const {nombre}\s*=\s*(\d+)", _T); return int(m.group(1)) if m else defecto
def _band(nombre, cy, h):
    m = re.search(rf"export const {nombre}\s*=\s*\{{\s*cy:\s*(\d+),\s*h:\s*(\d+)", _T)
    return (int(m.group(1)), int(m.group(2))) if m else (cy, h)
_m = re.search(r'TOPIC_ALIGN[^=]*=\s*"(\w+)"', _T)
TOPIC_ALIGN = _m.group(1) if _m else "chip"
KICKER_Y, TOPIC_Y = _num("KICKER_Y", 300), _num("TOPIC_Y", 596)
CAPTION_CY, HANDLE_Y = _num("CAPTION_CY", 1290), _num("HANDLE_Y", 1445)
CARD_CY, CARD_H = _band("CARD_BAND", 965, 350)
RAIL     = (70, KICKER_Y - 25, 500 if TOPIC_ALIGN != "inline" else 700, KICKER_Y + 100)   # kicker · secciones · chip de keyword
TOPIC    = (70, TOPIC_Y - 51, 760, TOPIC_Y + 69)
CAP      = (100, CAPTION_CY - 140, 980, CAPTION_CY + 140)
HANDLE   = (70, HANDLE_Y - 25, 500, HANDLE_Y + 30)

def banda(cy=None, h=None):
    cy = CARD_CY if cy is None else cy; h = CARD_H if h is None else h
    return (70, cy - h/2, 900, cy + h/2)

def escenas(e):
    """Cajas del grafismo de Escenas.tsx (peor caso de cada uno)."""
    out = []
    if not e: return out
    for x in e.get("sellos", []):
        w = len(x["text"]) * x.get("size", 92) * 0.72 + x.get("size", 92) * 0.8; h = x.get("size", 92) * (1.6 if x.get("sub") else 1.3)
        out.append((f'sello {x["text"]}', x["start"], x["end"], (x["cx"] - w/2, x["cy"] - h/2, x["cx"] + w/2, x["cy"] + h/2)))
    for x in e.get("pins", []):
        out.append((f'pin {x["label"]}', x["start"], x["end"], (x["lx"] - 40, x["ly"] - 45, x["lx"] + 60 + 20 * len(x["label"]), x["ly"] + 45)))
    for x in e.get("marcas", []):
        ys = [k[2] for k in x["keys"]]
        out.append((f'marca {x["tag"]}', x["keys"][0][0], x["keys"][-1][1], (x["x"] - 10, min(ys) - 8, x["x"] + x["w"] + 240, max(ys) + x["h"] + 8)))
    if e.get("crono"):
        c = e["crono"]; x0, y0 = c.get("x", 70), c.get("y", 196)
        out.append(("crono", c["start"], c["end"], (x0, y0, x0 + 360, y0 + 90)))
    for x in e.get("expedientes", []):
        out.append(("expediente", x["start"], x["end"], banda(x.get("cy"), x.get("h", 480))))
    for x in e.get("entregas", []):
        out.append(("entrega", x["start"], x["end"], banda(x.get("cy"), x.get("h", 500))))
    for x in e.get("censuras", []):
        out.append(("censura", x["start"], x["end"], (24, x.get("y0", 206), 1000, x.get("y1", 830))))
    for x in e.get("firmas", []):
        cd = {"x": 240, "y": 470, "w": 600, "h": 250, **x.get("card", {})}
        out.append(("firma", x["sign"], x["end"], (cd["x"], cd["y"], cd["x"] + cd["w"], cd["y"] + cd["h"])))
    for x in e.get("tuberias", []):
        cy = x.get("cy", 1060)
        out.append((f'tubería {"difuminada" if x["blur"] else "nítida"}', x["start"], x["end"], (70, cy - 90, 900, cy + 90)))
    return out

def solape(cabeza, rect):
    x0 = max(cabeza[0], rect[0]); y0 = max(cabeza[1], rect[1])
    x1 = min(cabeza[2], rect[2]); y1 = min(cabeza[3], rect[3])
    if x1 <= x0 or y1 <= y0: return 0.0
    area = (cabeza[2]-cabeza[0]) * (cabeza[3]-cabeza[1])
    return (x1-x0) * (y1-y0) / max(1.0, area)

def main():
    import argparse
    ap = argparse.ArgumentParser(); ap.add_argument("--cid", default="c1")
    cid = ap.parse_args().cid
    caras = json.load(open(RAIZ / "work" / "c1_caras.json"))   # la pista de caras es del PLANO, común a todos los idiomas
    s  = serie(caras)                      # casco: gorro + barba
    sc = serie(caras, margen=0, caja_fn=cara)   # cara: frente a barbilla
    todo = json.load(open(RAIZ / "cortes.json"))
    cfg = todo[cid]
    wf = RAIZ / "work" / f"{cid}_words.json"
    DUR = (json.load(open(wf))[-1]["end"] + 1.0) if wf.exists() else 999.0

    gr = []
    for c in cfg.get("cards", []):
        gr.append((f'card {c["t"]}', c["start"], c["end"], banda(c.get("cy"), c.get("h"))))
    for f in cfg.get("flows", []):
        gr.append((f'flow {f["layout"]}', f["start"], f["end"], banda(f.get("cy"))))
    if cfg.get("teaser"):
        t = cfg["teaser"]
        gr.append(("teaser", t["start"], t["end"], banda(t.get("cy"), t.get("h"))))
    for k in cfg.get("tracks", []):
        # la etiqueta del track se recorta a `bounds`: el peor caso es el propio bounds
        b = k.get("bounds")
        gr.append((f'track {k["id"]}', k["start"], k["end"],
                   tuple(b) if b else (70, 285, 900, 1500)))
    # el raíl y el chip de marca se APARTAN solos en los tramos de mute_*: para
    # verificar hay que descontarlos igual que se descuenta un panel que oculta
    # los subtítulos, si no el informe acusa a algo que en pantalla no está.
    mute_rail  = [tuple(x) for x in cfg.get("mute_rail", [])]
    mute_topic = [tuple(x) for x in cfg.get("mute_topic", [])]
    # con TOPIC_ALIGN "inline"/"off" el chip no se pinta: juzgarlo acusaba a algo invisible
    if TOPIC_ALIGN == "chip":
        for tp in cfg.get("topics", []):
            gr.append((f'chip {tp["logo"]}', tp["start"], tp["end"], TOPIC, mute_topic))
    gr += escenas(cfg.get("escenas"))
    for sec in cfg.get("sections", []):
        gr.append((f'sección {sec["n"]}', sec["start"], sec["end"], RAIL, mute_rail))
    if cfg.get("keyword"):
        gr.append(("chip keyword", cfg["keyword"]["start"], DUR, RAIL, mute_rail))
    # subtítulos: solo donde NO están ocultos por un panel
    ocultos = [(a, b) for a, b in cfg.get("hide", [])]
    # los subtítulos NO son un rectángulo fijo: cada cap_zone tiene su propia caja
    zonas = cfg.get("cap_zones", [])
    def caja_cap(z):
        alto = 2 * z.get("size", 80) * 1.1 + 20       # dos líneas y su trazo
        return (z.get("x0", 100), z["cy"] - alto/2, z.get("x1", 980), z["cy"] + alto/2)
    cubierto = []
    for z in zonas:
        gr.append((f'subtít. {z["start"]:.1f}', z["start"], z["end"], caja_cap(z)))
        cubierto.append((z["start"], z["end"]))
    # el resto del reel usa la banda por defecto
    prev = 0.0
    for a0, b0 in sorted(cubierto):
        if a0 > prev: gr.append((f'subtít. {prev:.1f}', prev, a0, CAP))
        prev = b0
    if prev < DUR: gr.append((f'subtít. {prev:.1f}', prev, DUR, CAP))
    if todo.get("handle", ""):          # handle vacío = no se pinta
        gr.append(("handle", 0, DUR, HANDLE))

    def tapado(t):
        return any(a <= t < b for a, b in ocultos)

    print(f"{'gráfico':22s} {'rango':16s} solape máximo con la cabeza")
    malos = 0
    gr = [(g + (None,))[:5] for g in gr]
    for nom, a, b, rect, mute in sorted(gr, key=lambda g: g[1]):
        peor, peor_t, n = 0.0, None, 0
        for t, r in s:
            if r is None or not (a <= t < b): continue
            if (nom.startswith("subtít") or nom == "handle") and tapado(t): continue
            if mute and any(m0 <= t < m1 for m0, m1 in mute): continue
            n += 1
            f = solape(r, rect)
            if f > peor: peor, peor_t = f, t
        # la cara, aparte: es la que no se puede tapar NUNCA
        peorC, peorC_t = 0.0, None
        for t, r in sc:
            if r is None or not (a <= t < b): continue
            if (nom.startswith("subtít") or nom == "handle") and tapado(t): continue
            if mute and any(m0 <= t < m1 for m0, m1 in mute): continue
            f = solape(r, rect)
            if f > peorC: peorC, peorC_t = f, t
        rng = f"{a:6.2f}-{min(b,DUR):6.2f}"
        if peorC >= UMBRAL_CARA:
            malos += 1
            print(f"  {nom:20s} {rng}  ** TAPA LA CARA {peorC*100:4.1f} % en t={peorC_t:.2f} **")
            continue
        if n == 0:
            print(f"  {nom:20s} {rng}  sin cara en pantalla                 ✓")
        elif peor < UMBRAL:
            print(f"  {nom:20s} {rng}  {n:4d} muestras, roce casco {peor*100:4.1f} % · cara 0 %   ✓")
        else:
            print(f"  {nom:20s} {rng}  roza el casco {peor*100:4.1f} % (t={peor_t:.2f}) · CARA LIMPIA ✓")
    print(f"\n{'NADA TAPA LA CARA ✓' if not malos else f'{malos} gráfico(s) tapan la cara'}")
    return 1 if malos else 0

if __name__ == "__main__":
    sys.exit(main())
