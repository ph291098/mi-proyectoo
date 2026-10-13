#!/usr/bin/env python3
"""Saca el bloque `escenas.crono` de los segundos que IMPRIME la pantalla.

  python3 scripts/crono_ocr.py [--desde 10 --hasta 55]

Lee work/ocr/normal.json (lo deja `tapar.py ocr`) y busca contadores tipo Claude
Code — «Osmosing… (48s · ↓ 1.7k tokens)», «(1m 12s · …)» — y devuelve la primera y
la última lectura. El cronómetro interpola entre las dos: por ejemplo,
si el terminal va de 2 s (14.23) a 58 s (51.37), casi 1:1 con el vídeo, así que el
reloj en pantalla dice la verdad aunque el tramo esté recortado.

Si no hay contador en pantalla NO se inventa: sin lecturas no hay crono.
"""
import argparse, json, pathlib, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
RX = re.compile(r"\((?:(\d+)m\s*)?(\d+)s\b")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--desde", type=float, default=0)
    ap.add_argument("--hasta", type=float, default=1e9)
    a = ap.parse_args()
    n = json.load(open(RAIZ / "work" / "ocr" / "normal.json"))
    lect = []
    for j, filas in enumerate(n["t"]):
        t = j * n["paso"] / n["fps"]
        if not (a.desde <= t <= a.hasta): continue
        for s, *_ in filas:
            m = RX.search(s)
            if m and re.search(r"ing|tokens|thinking|thought", s, re.I):
                lect.append((t, int(m.group(1) or 0) * 60 + int(m.group(2)), s[:60]))
    if not lect:
        print("sin contador en pantalla: no hay crono"); return
    lect.sort()
    # descarta lecturas que retroceden (OCR confundió 38 con 3 y cosas así)
    buenas = [lect[0]]
    for x in lect[1:]:
        if x[1] >= buenas[-1][1] and x[1] - buenas[-1][1] <= max(3, (x[0] - buenas[-1][0]) * 3):
            buenas.append(x)
    (t0, v0, s0), (t1, v1, s1) = buenas[0], buenas[-1]
    print(f"primera {t0:6.2f} s → {v0} s   «{s0}»")
    print(f"última  {t1:6.2f} s → {v1} s   «{s1}»   ({len(buenas)} lecturas coherentes)")
    print(f"ritmo: {(v1 - v0) / max(0.01, t1 - t0):.2f} s de pantalla por s de vídeo")
    print(json.dumps({"crono": {"start": round(t0, 2), "stop": round(t1 + 0.6, 2), "end": round(t1 + 10, 2),
                                "t0": round(t0, 2), "v0": v0, "t1": round(t1, 2), "v1": v1}}, indent=1))
    print("ajusta `stop` al momento en que la pantalla cambia al resultado y `end` a cuando deja de importar")

if __name__ == "__main__":
    main()
