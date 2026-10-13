#!/usr/bin/env python3
"""Sigue un punto del plano a lo largo de un tramo y saca sus fotogramas clave.

En este material la cámara se mueve y el rack está quieto, así que no hace falta
seguir un objeto: basta estimar el MOVIMIENTO GLOBAL entre fotogramas (Lucas-Kanade
sobre esquinas + transformación de similitud robusta) y arrastrar el punto con él.
Es mucho más estable que un tracker de caja, que se despega en cuanto una mano
cruza por delante.

  python3 scripts/rastrea.py --id nodo1 --desde 11.4 --hasta 18.8 --x 470 --y 1020

Escribe work/track_<id>.json: [{"t":..,"x":..,"y":..,"s":..}] con s = escala
acumulada (para que el retículo crezca si la cámara se acerca).

IMPORTANTE: un tramo NO puede cruzar un corte de plano. El punto saltaría.
"""
import argparse, json, pathlib, sys
import cv2, numpy as np

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="public/c1.mp4")
    ap.add_argument("--id", required=True)
    ap.add_argument("--desde", type=float, required=True)
    ap.add_argument("--hasta", type=float, required=True)
    ap.add_argument("--x", type=float, required=True, help="punto a seguir en el fotograma de --desde")
    ap.add_argument("--y", type=float, required=True)
    ap.add_argument("--paso", type=int, default=2, help="1 de cada N fotogramas como clave")
    a = ap.parse_args()

    raiz = pathlib.Path(__file__).resolve().parent.parent
    cap = cv2.VideoCapture(str(raiz / a.src))
    fps = cap.get(cv2.CAP_PROP_FPS)
    f0, f1 = int(round(a.desde*fps)), int(round(a.hasta*fps))
    cap.set(cv2.CAP_PROP_POS_FRAMES, f0)
    ok, prev = cap.read()
    if not ok: sys.exit("no pude leer el fotograma inicial")
    gprev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)

    p = np.array([a.x, a.y], dtype=np.float64)
    escala = 1.0
    claves = [{"t": round(f0/fps, 3), "x": round(float(p[0]),1), "y": round(float(p[1]),1), "s": 1.0}]
    LK = dict(winSize=(31,31), maxLevel=4,
              criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
    perdidos = 0
    for f in range(f0+1, f1+1):
        ok, cur = cap.read()
        if not ok: break
        gcur = cv2.cvtColor(cur, cv2.COLOR_BGR2GRAY)
        pts = cv2.goodFeaturesToTrack(gprev, maxCorners=600, qualityLevel=0.01,
                                      minDistance=12, blockSize=7)
        M = None
        if pts is not None and len(pts) >= 12:
            nxt, st, _ = cv2.calcOpticalFlowPyrLK(gprev, gcur, pts, None, **LK)
            if nxt is not None:
                st = st.reshape(-1).astype(bool)
                A, B = pts.reshape(-1,2)[st], nxt.reshape(-1,2)[st]
                if len(A) >= 12:
                    M, _ = cv2.estimateAffinePartial2D(A, B, method=cv2.RANSAC,
                                                       ransacReprojThreshold=3.0)
        if M is None:
            perdidos += 1                      # sin estimación: el punto se queda donde está
        else:
            p = M @ np.array([p[0], p[1], 1.0])
            escala *= float(np.hypot(M[0,0], M[1,0]))
        if (f - f0) % a.paso == 0 or f == f1:
            claves.append({"t": round(f/fps,3), "x": round(float(p[0]),1),
                           "y": round(float(p[1]),1), "s": round(escala,4)})
        gprev = gcur
    cap.release()

    out = raiz / "work" / f"track_{a.id}.json"
    out.write_text(json.dumps(claves))
    xs = [k["x"] for k in claves]; ys = [k["y"] for k in claves]
    print(f"{a.id}: {len(claves)} claves  {a.desde}->{a.hasta}s  "
          f"x {min(xs):.0f}..{max(xs):.0f}  y {min(ys):.0f}..{max(ys):.0f}  "
          f"escala final {claves[-1]['s']:.2f}" + (f"  ({perdidos} sin estimación)" if perdidos else ""))
    if min(xs) < -200 or max(xs) > 1280 or min(ys) < -200 or max(ys) > 2120:
        print("  AVISO: el punto se sale mucho del cuadro — ¿cruza un corte de plano?")

main()
