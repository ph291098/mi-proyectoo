#!/usr/bin/env python3
"""Propone las `cap_zones` para que los subtítulos NUNCA pisen la barbilla.

  uv run --with opencv-python-headless --with numpy python scripts/subtitulos.py

La banda por defecto (cy 1290, 4 palabras, 3 líneas -> y 1150..1430) va bien sobre
B-roll, pero en los planos de cámara la barba baja hasta y ~1300 y el subtítulo le
muerde la punta. La solución no es subirlo — arriba está la cara entera — sino
BAJARLO y estrecharlo: 2 líneas en vez de 3 caben entre la barbilla y la zona de
UI de la plataforma (y 1500).

Para cada tramo con cara busca la barbilla más baja y coloca la caja justo debajo.
Si ni así cabe, lo dice en vez de fingir que sí.
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from caras import serie

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TOPE_UI  = 1500          # SAFE.y1: más abajo empieza la UI de TikTok/Reels
ALTO_2L  = 176           # dos líneas a 72 px con interlineado
CAJA_X0, CAJA_X1 = 180, 900   # caja por defecto de los subtítulos (DZ.right)
ANCHO_MIN = 400          # por debajo de esto no cabe una línea legible
TOLERA    = 30           # px de solape que caen dentro del margen de la caja
MIN_TRAMO = 0.8

def main():
    cid = "c1"
    s = serie(json.load(open(RAIZ / "work" / f"{cid}_caras.json")))
    cfg = json.load(open(RAIZ / "cortes.json"))[cid]
    ocultos = cfg.get("hide", [])
    def tapado(t): return any(a <= t < b for a, b in ocultos)

    # tramos continuos CON cara y sin panel encima
    tramos, ini = [], None
    for t, r in s:
        vivo = r is not None and not tapado(t)
        if vivo and ini is None: ini = t
        if not vivo and ini is not None:
            if t - ini >= MIN_TRAMO: tramos.append((ini, t))
            ini = None
    if ini is not None: tramos.append((ini, s[-1][0]))

    # Un tramo largo donde él se mueve mucho no tiene una sola solución: si la
    # barbilla recorre más de UMBRAL px, se parte en trozos de PASO segundos y
    # luego se vuelven a unir los contiguos que piden casi la misma altura, para
    # que el subtítulo no ande saltando cada dos por tres.
    UMBRAL, PASO, JUNTA, MINZONA = 150, 1.5, 70, 1.0
    def barbilla_de(a, b):
        v = [r[3] for t, r in s if a <= t <= b and r]
        return max(v) if v else None
    finos = []
    for a, b in tramos:
        bb = barbilla_de(a, b)
        chicos = [r[3] for t, r in s if a <= t <= b and r]
        if bb is not None and chicos and (bb - min(chicos)) > UMBRAL and (b - a) > PASO * 1.5:
            t0 = a
            while t0 < b:
                t1 = min(b, t0 + PASO)
                if barbilla_de(t0, t1) is not None: finos.append((t0, t1))
                t0 = t1
        else:
            finos.append((a, b))
    tramos, fusion = [], []
    for a, b in finos:
        bb = barbilla_de(a, b)
        if fusion and abs(bb - fusion[-1][2]) <= JUNTA and abs(a - fusion[-1][1]) < 0.2:
            fusion[-1] = (fusion[-1][0], b, max(bb, fusion[-1][2]))
        else:
            fusion.append((a, b, bb))
    # una zona de dos décimas es un parpadeo: se funde con la vecina quedándose
    # con la barbilla más baja de las dos (la posición más prudente de ambas)
    limpio = []
    for a, b, bb in fusion:
        if limpio and b - a < MINZONA and abs(a - limpio[-1][1]) < 0.2:
            limpio[-1] = (limpio[-1][0], b, max(bb, limpio[-1][2]))
        else:
            limpio.append((a, b, bb))
    tramos = [(a, b) for a, b, _ in limpio]

    def resolver(a, b):
        """Devuelve (zona, aviso). Baja el subtítulo bajo la barbilla; si no cabe,
        lo manda al lado libre; si tampoco, avisa."""
        barbilla = max(r[3] for t, r in s if a <= t <= b and r)
        cy = barbilla + ALTO_2L / 2
        z = {"start": round(a, 2), "end": round(b, 2), "size": 72, "maxWords": 3}
        if cy + ALTO_2L / 2 <= TOPE_UI:
            z["cy"] = round(cy); return z, "", barbilla
        z["cy"] = round(TOPE_UI - ALTO_2L / 2)
        # Pegado al tope puede sobrar con unos pocos píxeles: por debajo de TOLERA
        # el solape cae dentro del margen de la propia caja de la cabeza.
        if barbilla - (z["cy"] - ALTO_2L / 2) <= TOLERA:
            return z, "  (pegado al tope de la UI)", barbilla
        xs0 = min(r[0] for t, r in s if a <= t <= b and r)
        xs1 = max(r[2] for t, r in s if a <= t <= b and r)
        if (CAJA_X1 - xs1) >= ANCHO_MIN:
            z.update(x0=round(max(CAJA_X0, xs1 + 20)), x1=CAJA_X1, size=60, maxWords=2)
            return z, f"  -> a la DERECHA (x {z['x0']}..{z['x1']})", barbilla
        if (xs0 - CAJA_X0) >= ANCHO_MIN:
            z.update(x0=CAJA_X0, x1=round(min(CAJA_X1, xs0 - 20)), size=60, maxWords=2)
            return z, f"  -> a la IZQUIERDA (x {z['x0']}..{z['x1']})", barbilla
        return z, f"  ** sin hueco: barbilla {barbilla:.0f}, ocupa x {xs0:.0f}..{xs1:.0f} **", barbilla

    print("cap_zones propuestas (subtítulo por debajo de la barbilla):")
    zonas = []
    for a, b in tramos:
        barbilla = max(r[3] for t, r in s if a <= t <= b and r)
        z, aviso, barbilla = resolver(a, b)
        if "sin hueco" in aviso and (b - a) > 1.6:
            # se mueve demasiado para una sola solución: se parte en trozos de 1 s
            t0 = a
            while t0 < b:
                t1 = min(b, t0 + 1.0)
                if any(a2 <= t <= t1 and r for t, r in s for a2 in (t0,)):
                    zz, av, bb = resolver(t0, t1)
                    zonas.append(zz)
                    print(f'  {t0:6.2f}-{t1:6.2f}  barbilla y{bb:6.0f} -> cy {zz["cy"]}{av}')
                t0 = t1
            continue
        zonas.append(z)
        print(f'  {a:6.2f}-{b:6.2f}  barbilla y{barbilla:6.0f} -> cy {z["cy"]}{aviso}')
    (RAIZ / "work" / "cap_zones.json").write_text(json.dumps(zonas, ensure_ascii=False, indent=2))
    print(f"\n-> work/cap_zones.json ({len(zonas)} zonas)")

if __name__ == "__main__":
    main()
