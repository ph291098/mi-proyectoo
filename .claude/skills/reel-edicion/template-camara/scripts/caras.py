#!/usr/bin/env python3
"""Pista de la CABEZA a lo largo del corte, para que ningún gráfico la tape.

  uv run --with opencv-python-headless --with numpy python scripts/caras.py

Escribe work/<cid>_caras.json y saca por pantalla las ventanas SIN cara, que son
los únicos tramos donde cabe un panel fijo a ancho completo.

Detector: YuNet (opencv_zoo, CC BY 4.0) — el modelo se descarga a work/yunet.onnx.
Da 5 puntos faciales (ojos, nariz, comisuras), no la cabeza: la caja se levanta al
gorro y se baja a la barba con factores sobre d = boca_y - ojos_y, que escala sola
con el tamaño de la cara en el cuadro.

CALIBRADO contra stills de este material: en 92.5 s la cabeza real va de y 430
(gorro) a y 1240 (barba), x 250..900. Una caja demasiado generosa es peor que
inútil: en la primera pasada metía 290 px de barba de más y declaraba «no cabe»
en sitios donde sí cabía.
"""
import argparse, json, pathlib, sys, urllib.request

K_TOP, K_BOT, K_W = 1.55, 0.90, 1.55
MODELO = ("https://media.githubusercontent.com/media/opencv/opencv_zoo/main/"
          "models/face_detection_yunet/face_detection_yunet_2023mar.onnx")

def caja(d, m=0):
    """Caja de la cabeza a partir de los 5 puntos faciales."""
    lm = d["lm"]
    ecy = (lm[1] + lm[3]) / 2
    mcy = (lm[7] + lm[9]) / 2
    cx  = ((lm[0] + lm[2]) / 2 + (lm[6] + lm[8]) / 2) / 2
    dd  = max(20.0, mcy - ecy)
    return [cx - K_W*dd - m, ecy - K_TOP*dd - m, cx + K_W*dd + m, mcy + K_BOT*dd + m]

# La CARA propiamente dicha — de la frente a la barbilla — sin gorro ni melena.
# Es la que no se puede tapar nunca; el resto del casco admite que un rótulo del
# raíl le roce el borde del gorro, que es fondo, no rostro.
F_TOP, F_BOT, F_W = 0.85, 0.55, 1.05

def cara(d, m=0):
    lm = d["lm"]
    ecy = (lm[1] + lm[3]) / 2
    mcy = (lm[7] + lm[9]) / 2
    cx  = ((lm[0] + lm[2]) / 2 + (lm[6] + lm[8]) / 2) / 2
    dd  = max(20.0, mcy - ecy)
    return [cx - F_W*dd - m, ecy - F_TOP*dd - m, cx + F_W*dd + m, mcy + F_BOT*dd + m]

def serie(caras, margen=26, tolerancia=4, caja_fn=None):
    """(t, caja|None) por muestra. Un parpadeo del detector no abre una ventana
    falsa: se mantiene la última caja hasta `tolerancia` muestras seguidas sin cara."""
    caja_fn = caja_fn or caja
    out, ult, falta = [], None, 0
    for d in caras:
        if "lm" in d:
            ult, falta = caja_fn(d, margen), 0
        else:
            falta += 1
            if falta > tolerancia:
                ult = None
        out.append((d["t"], ult))
    return out

def ventanas_libres(s, minimo=1.0):
    libres, a = [], None
    for t, r in s:
        if r is None:
            if a is None: a = t
        else:
            if a is not None and t - a >= minimo:
                libres.append((round(a, 2), round(t, 2)))
            a = None
    if a is not None:
        libres.append((round(a, 2), round(s[-1][0], 2)))
    return libres

def main():
    import cv2
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="public/c1.mp4")
    ap.add_argument("--cid", default="c1")
    ap.add_argument("--paso", type=int, default=3, help="1 de cada N fotogramas")
    a = ap.parse_args()
    raiz = pathlib.Path(__file__).resolve().parent.parent
    modelo = raiz / "work" / "yunet.onnx"
    if not modelo.exists() or modelo.stat().st_size < 100_000:
        print("bajando el modelo YuNet…")
        urllib.request.urlretrieve(MODELO, modelo)

    cap = cv2.VideoCapture(str(raiz / a.src))
    fps = cap.get(cv2.CAP_PROP_FPS)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    SC = 2; w2, h2 = W // SC, H // SC
    det = cv2.FaceDetectorYN.create(str(modelo), "", (w2, h2), 0.75, 0.3, 5000)
    out, i = [], -1
    while True:
        ok, fr = cap.read()
        if not ok: break
        i += 1
        if i % a.paso: continue
        _, faces = det.detect(cv2.resize(fr, (w2, h2)))
        rec = {"f": i, "t": round(i / fps, 3)}
        if faces is not None and len(faces):
            f = max(faces, key=lambda f: f[2] * f[3])
            if 120 <= f[2] * SC <= 760:                 # descarta detecciones absurdas
                rec["lm"] = [round(float(v) * SC, 1) for v in f[4:14]]
                rec["s"]  = round(float(f[14]), 3)
        out.append(rec)
    cap.release()
    (raiz / "work" / f"{a.cid}_caras.json").write_text(json.dumps(out))

    s = serie(out)
    con = sum(1 for _, r in s if r)
    print(f"{con}/{len(s)} muestras con cara ({100*con//len(s)} %)")
    print("\nVENTANAS SIN CARA — aquí y solo aquí cabe un panel fijo:")
    tot = 0
    for x, y in ventanas_libres(s):
        tot += y - x
        print(f"  {x:6.2f} → {y:6.2f}   ({y-x:5.2f} s)")
    print(f"  total {tot:.1f} s de {s[-1][0]:.1f} ({100*tot/s[-1][0]:.0f} %)")

if __name__ == "__main__":
    main()
