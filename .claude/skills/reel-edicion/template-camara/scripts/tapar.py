#!/usr/bin/env python3
"""Difumina datos sensibles de la CAPTURA DE PANTALLA antes de montar el reel.

Caso típico: una demo con un documento real y un terminal con nombre, empresa y
correos de un cliente. En el vídeo se dice «vamos a borrar los datos privados», pero
el export los trae en claro.

  uv run --with numpy --with opencv-python-headless python scripts/tapar.py ocr      --config work/tapar.json
  uv run --with numpy python scripts/tapar.py busca --config work/tapar.json          # qué se ve: PREGUNTAR al usuario
  uv run --with numpy --with opencv-python-headless python scripts/tapar.py render   --config work/tapar.json
  uv run --with numpy --with opencv-python-headless python scripts/tapar.py verifica --config work/tapar.json

NUNCA se decide solo qué tapar: `busca` lista correos, teléfonos, IPs, URLs, tokens
y los nombres que se le pasen, con sus tiempos; se le enseña al usuario y él elige (a veces
solo quiere tapar al cliente y deja sus propios datos).

work/tapar.json:
  {
    "src": "../grabacion/x.mp4",  "out": "public/c1.mp4",  "alto": 1000,  "alto_mov": 838,
    "patron": "acme|acmne|juan|perez|pport@",   // incluye las lecturas torcidas del OCR
    "rapidos": [[0, 3.6], [62.7, 66.5]],      // tramos donde la pantalla se DESPLAZA rápido
    "antes":  [{"si": "platfo", "salvo": "acme", "chars": 10}],
    "bajo":   [{"si": "platfo\\\\w*\\\\s+l\\\\.?l\\\\.?c", "max_len": 32, "alto": 4.6, "ancho": 1.45}],
    "manual": [{"desde": 3832, "hasta": 3842, "linea": "…", "x": 177, "y": 818, "w": 758, "h": 20}]
  }

LO QUE COSTÓ (cada punto es un escape real que pilló la verificación):
- Por TOKEN, no por línea: la caja sale de la proporción de caracteres dentro de la
  línea que da Vision. En un terminal (monoespaciado) es exacta; en serif, margen.
- Margen vertical con techo (6 px): a 0.35·alto la línea de 36 px se comía la
  mitad del título de encima.
- OCR a 30 fps + unión de ±4 muestras cubre el terminal, que salta a golpes. NO
  cubre un documento que se desplaza 40-90 px entre muestras: ahí (`rapidos`) OCR
  de CADA fotograma, al DOBLE de tamaño (pies de página de 12 px), y los vecinos se
  unen COMPENSADOS en movimiento (phaseCorrelate). Sin compensar emborronaban la
  línea de al lado; sin unirlos, se escapaban lecturas.
- `antes`: si el OCR solo leyó «Platform», tapar también la palabra anterior.
- `bajo`: texto blanco sobre etiqueta negra (bloque de firma) no lo lee el OCR en
  pleno barrido; se ancla a una cabecera que sí lee y se tapa lo que tiene debajo.
- `manual`: una línea medio cortada por el borde que el OCR no lee hasta que sube.
- Se difumina sobre los planos YUV 4:2:0: sin pasar a RGB no hay matriz de color
  que se equivoque, y el resto del cuadro sale idéntico salvo la recompresión.
- La verificación hace OCR del RESULTADO en los fotogramas que el primer pase NO
  miró (desfase de medio paso) y en los del primero, y ×2 en los `rapidos`. Solo
  vale «LIMPIO» en las tres.
"""
import argparse, glob, json, os, pathlib, re, shutil, subprocess, sys
import numpy as np

RAIZ = pathlib.Path(__file__).resolve().parent.parent
OCRD = RAIZ / "work" / "ocr"
BIN = OCRD / "ocr"
HOLD = 4          # ±4 muestras del pase normal
HOLD_R = 4        # ±4 fotogramas en los tramos rápidos (compensados)

def cfg_de(p):
    c = json.load(open(p))
    c.setdefault("alto", 1000); c.setdefault("rapidos", []); c.setdefault("antes", [])
    c.setdefault("bajo", []); c.setdefault("manual", [])
    c["src"] = str((RAIZ / c["src"]).resolve()) if not os.path.isabs(c["src"]) else c["src"]
    c["out"] = str(RAIZ / c.get("out", "public/c1.mp4"))
    return c

def probe(src):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,r_frame_rate:format=duration", "-of", "json", src],
                                  capture_output=True, text=True).stdout)
    s = j["streams"][0]; n, d = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(n) / float(d), float(j["format"]["duration"])

def compila():
    if BIN.exists(): return
    OCRD.mkdir(parents=True, exist_ok=True)
    subprocess.run(["swiftc", "-O", str(RAIZ / "scripts" / "ocr" / "ocr.swift"), "-o", str(BIN)], check=True)

def ocr_lote(lista, salida):
    """Vision en paralelo. Devuelve {ruta: [[texto,x,y,w,h]...]} en el orden de `lista`."""
    compila()
    n = max(2, (os.cpu_count() or 8) // 2)
    partes = [lista[i::n] for i in range(n)]
    for f in glob.glob(f"{salida}_*.jsonl"): os.remove(f)
    procs = [subprocess.Popen([str(BIN), f"{salida}_{k}.jsonl", *p]) for k, p in enumerate(partes) if p]
    for p in procs: p.wait()
    res = {}
    for k, p in enumerate(partes):
        if not p: continue
        filas = [json.loads(l) for l in open(f"{salida}_{k}.jsonl")]
        assert len(filas) == len(p), f"OCR incompleto en la parte {k}: {len(filas)}/{len(p)}"
        for ruta, d in zip(p, filas):
            assert os.path.basename(ruta) == d["f"]
            res[ruta] = d["t"]
    return res

def extrae(src, carpeta, sel, alto, escala=1):
    shutil.rmtree(carpeta, ignore_errors=True); os.makedirs(carpeta)
    W = probe(src)[0]
    vf = f"select='{sel}',crop={W}:{alto}:0:0" + (f",scale={W*escala}:{alto*escala}:flags=lanczos" if escala != 1 else "")
    subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", vf, "-fps_mode", "passthrough", "-q:v", "2",
                    f"{carpeta}/%05d.jpg"], check=True)
    return sorted(glob.glob(f"{carpeta}/*.jpg"))

def paso_de(fps):
    return max(1, round(fps / 30))

def rapidos_frames(c, fps):
    return [(round(a * fps), round(b * fps)) for a, b in c["rapidos"]]

# ───────────────────────── OCR del original ─────────────────────────
def cmd_ocr(c):
    W, H, fps, dur = probe(c["src"])
    paso = paso_de(fps)
    print(f"{W}x{H} a {fps:g} fps · OCR 1 de cada {paso} fotogramas sobre y 0→{c['alto']}")
    fs = extrae(c["src"], OCRD / "n", f"not(mod(n\\,{paso}))", c["alto"])
    res = ocr_lote(fs, str(OCRD / "n"))
    json.dump({"paso": paso, "fps": fps, "t": [res[f] for f in fs]}, open(OCRD / "normal.json", "w"))
    rap = {}
    for k, (a, b) in enumerate(rapidos_frames(c, fps)):
        fr = extrae(c["src"], OCRD / f"r{k}", f"between(n\\,{a}\\,{b})", c["alto"], escala=2)
        rr = ocr_lote(fr, str(OCRD / f"r{k}"))
        for j, f in enumerate(fr):
            rap[a + j] = rr[f]
        print(f"  rápido {k}: fotogramas {a}-{b}, {len(fr)} a ×2")
    json.dump({str(k): v for k, v in rap.items()}, open(OCRD / "rapidos.json", "w"))
    print("-> work/ocr/normal.json, work/ocr/rapidos.json")

# ───────────────────────── búsqueda ─────────────────────────
SENSIBLE = {
    "correo": r"[\w.+-]+@[\w-]+\.[\w.]+",
    "teléfono": r"\+?\d[\d\s().-]{7,}\d",
    "ip": r"\b\d{1,3}(?:\.\d{1,3}){3}\b",
    "url": r"\b(?:https?://)?(?:www\.)?[\w-]+\.(?:com|net|org|io|dev|app|co|es|do|mx)\b\S*",
    "token": r"\b(?:sk-|ghp_|xox[bp]-|AKIA)[\w-]{8,}|\b[a-f0-9]{32,}\b",
    "fiscal": r"\b(?:EIN|RNC|NIF|CIF|RFC|SSN)\b[\s:#]*[\w-]+",
}

def cmd_busca(c, extra):
    n = json.load(open(OCRD / "normal.json"))
    t_of = lambda j: j * n["paso"] / n["fps"]
    pats = dict(SENSIBLE)
    if c.get("patron"): pats["patrón"] = c["patron"]
    for e in extra: pats[f"«{e}»"] = re.escape(e)
    vistos = {}
    for j, filas in enumerate(n["t"]):
        for s, *_ in filas:
            for nom, p in pats.items():
                for m in re.finditer(p, s, re.I):
                    k = (nom, m.group(0).strip())
                    a, b, cnt = vistos.get(k, (t_of(j), t_of(j), 0))
                    vistos[k] = (min(a, t_of(j)), max(b, t_of(j)), cnt + 1)
    for (nom, txt), (a, b, cnt) in sorted(vistos.items(), key=lambda x: (x[0][0], x[1][0])):
        if cnt >= 2:
            print(f"  {nom:10s} {a:6.1f}-{b:6.1f} s  ×{cnt:<4d} {txt[:80]}")
    print("\nEnséñale esto al usuario y que elija. Luego pon en `patron` lo que se tapa, con las "
          "variantes torcidas del OCR: `busca --nombres Acme` y relee la lista buscando «Acrne», «Aeme»…")

# ───────────────────────── cajas ─────────────────────────
def cajas_de_linea(c, pat, s, x, y, w, h):
    out = []
    n = max(1, len(s)); cw = w / n
    for m in re.finditer(r"\S+", s):
        tok = m.group(0)
        if not pat.search(tok): continue
        a, b = m.start(), m.end()
        pc = c.get("pad_chars", 0.9)
        x0 = x + cw * a - cw * pc - 6
        x1 = x + cw * b + cw * pc + 6
        for r in c["antes"]:
            if re.search(r["si"], tok, re.I) and not re.search(r.get("salvo", "^$"), s[max(0, a - 12):a], re.I):
                x0 -= cw * r.get("chars", 10)
        pv = min(h * c.get("pv_k", 0.35), c.get("pv_max", 6))
        out.append((int(x0), int(y - pv), int(x1), int(y + h + pv)))
    # `lineas`: con cámara en mano la línea se inclina y la caja por token se queda corta:
    # se tapa la línea ENTERA donde vive el dato (correo, nombre)
    if c.get("lineas") and re.search(c["lineas"], s, re.I):
        pv = min(h * c.get("pv_k", 0.35), c.get("pv_max", 6))
        out.append((int(x - 12), int(y - pv), int(x + w + 12), int(y + h + pv)))
    for r in c["bajo"]:
        if len(s) < r.get("max_len", 40) and re.search(r["si"], s, re.I):
            out.append((int(x - 10), int(y + h * 0.8), int(x + w * r.get("ancho", 1.45)), int(y + h * r.get("alto", 4.6))))
    return out

def carga(c):
    pat = re.compile(c["patron"], re.I)
    n = json.load(open(OCRD / "normal.json"))
    normal = [[b for f in filas for b in cajas_de_linea(c, pat, *f)] for filas in n["t"]]
    rap = {}
    if (OCRD / "rapidos.json").exists():
        for k, filas in json.load(open(OCRD / "rapidos.json")).items():
            rap[int(k)] = [tuple(v // 2 for v in b) for f in filas for b in cajas_de_linea(c, pat, *f)]
    return n["paso"], normal, rap

def movimiento(c, fps):
    """(dx, dy) del fotograma i-1 al i dentro de los tramos rápidos, en px del cuadro."""
    import cv2
    mov = {}
    for k, (a, b) in enumerate(rapidos_frames(c, fps)):
        prev = None
        for j, f in enumerate(sorted(glob.glob(str(OCRD / f"r{k}" / "*.jpg")))):
            g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
            # solo la captura (alto_mov): la cámara de debajo se mueve por su cuenta y ensucia la correlación
            g = g[: c.get("alto_mov", c["alto"]) * 2]
            g = cv2.resize(g, (g.shape[1] // 4, g.shape[0] // 4), interpolation=cv2.INTER_AREA).astype(np.float32)
            if prev is not None:
                (sx, sy), _ = cv2.phaseCorrelate(prev, g)
                mov[a + j] = (sx * 2, sy * 2)        # cuarto de ×2 → px del cuadro
            prev = g
    return mov

def desplaza(mov, k, i):
    dx = dy = 0.0
    rango = range(k + 1, i + 1) if k < i else range(i + 1, k + 1)
    sg = 1 if k < i else -1
    for m in rango:
        x, y = mov.get(m, (0, 0)); dx += sg * x; dy += sg * y
    return int(round(dx)), int(round(dy))

# ───────────────────────── render ─────────────────────────
def cmd_render(c):
    import cv2
    W, H, fps, dur = probe(c["src"])
    paso, normal, rap = carga(c)
    mov = movimiento(c, fps)
    rapidos = rapidos_frames(c, fps)
    pat = re.compile(c["patron"], re.I)
    TOP = c["alto"]
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", c["src"], "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", f"{W}x{H}",
                            "-r", f"{fps:g}", "-i", "-", "-i", c["src"], "-map", "0:v", "-map", "1:a?",
                            "-c:v", "libx264", "-crf", "10", "-preset", "medium", "-pix_fmt", "yuv420p",
                            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                            "-c:a", "copy", "-movflags", "+faststart", c["out"]], stdin=subprocess.PIPE)
    fsz = W * H * 3 // 2
    EXTRA = json.load(open(RAIZ / c["cajas"])) if c.get("cajas") else {}
    i = tapados = 0

    def borra(P, m, s):
        h, w = P.shape
        small = cv2.resize(P, (max(1, w // (14 // s)), max(1, h // (14 // s))), interpolation=cv2.INTER_AREA)
        big = cv2.GaussianBlur(cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST), (0, 0), 10 / s)
        soft = cv2.GaussianBlur(m, (0, 0), 3 / s).astype(np.float32) / 255
        return (P * (1 - soft) + big * soft).astype(np.uint8)

    while True:
        buf = dec.stdout.read(fsz)
        if len(buf) < fsz: break
        f = np.frombuffer(buf, np.uint8).copy()
        Y = f[:W * H].reshape(H, W)
        U = f[W * H:W * H + (W // 2) * (H // 2)].reshape(H // 2, W // 2)
        V = f[W * H + (W // 2) * (H // 2):].reshape(H // 2, W // 2)
        bx = []
        if any(a <= i <= b for a, b in rapidos):
            hr = c.get("hold_r", HOLD_R)
            for k in range(i - hr, i + hr + 1):
                if k in rap:
                    dx, dy = desplaza(mov, k, i)
                    bx += [(x0 + dx, y0 + dy, x1 + dx, y1 + dy) for x0, y0, x1, y1 in rap[k]]
        else:
            j = round(i / paso)
            for k in range(j - HOLD, j + HOLD + 1):
                if 0 <= k < len(normal): bx += normal[k]
        # `cajas`: cajas por fotograma calculadas fuera (p. ej. la barra de URL interpolada entre lecturas)
        bx += [tuple(b) for b in EXTRA.get(str(i), [])]
        for mm in c["manual"]:
            if mm["desde"] <= i <= mm["hasta"]:
                bx += cajas_de_linea(c, pat, mm["linea"], mm["x"], mm["y"], mm["w"], mm["h"])
        if bx:
            tapados += 1
            mask = np.zeros((TOP, W), np.uint8)
            for x0, y0, x1, y1 in bx:
                cv2.rectangle(mask, (max(0, x0), max(0, y0)), (min(W - 1, x1), min(TOP - 1, y1)), 255, -1)
            Y[:TOP] = borra(Y[:TOP], mask, 1)
            m2 = cv2.resize(mask, (W // 2, TOP // 2), interpolation=cv2.INTER_AREA)
            U[:TOP // 2] = borra(U[:TOP // 2], m2, 2)
            V[:TOP // 2] = borra(V[:TOP // 2], m2, 2)
        enc.stdin.write(f.tobytes())
        i += 1
    enc.stdin.close(); enc.wait(); dec.wait()
    print(f"{i} fotogramas, {tapados} con tapado -> {c['out']}")

# ───────────────────────── verificación ─────────────────────────
def cmd_verifica(c):
    W, H, fps, dur = probe(c["src"])
    paso = paso_de(fps)
    pat = re.compile(c["patron"], re.I)
    V = OCRD / "ver"
    lotes = []
    sels = [("medio", f"eq(mod(n\\,{paso})\\,{paso // 2})") if paso > 1 else None, ("mismos", f"not(mod(n\\,{paso}))")]
    for nom, sel in [s for s in sels if s]:
        lotes.append((nom, extrae(c["out"], V / nom, sel, c["alto"])))
    for k, (a, b) in enumerate(rapidos_frames(c, fps)):
        lotes.append((f"rapido{k}x2", extrae(c["out"], V / f"r{k}", f"between(n\\,{a}\\,{b})", c["alto"], escala=2)))
    malos = 0
    for nom, fs in lotes:
        res = ocr_lote(fs, str(V / nom))
        n = 0
        for f in fs:
            for s, *_ in res[f]:
                if pat.search(s):
                    print(f"  {nom:10s} {os.path.basename(f)}  {s[:90]}"); n += 1
        print(f"  {nom}: {len(fs)} fotogramas, {n} lecturas")
        malos += n
    print("LIMPIO" if not malos else f"{malos} lecturas con datos a tapar")
    return 1 if malos else 0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("accion", choices=["ocr", "busca", "render", "verifica"])
    ap.add_argument("--config", default="work/tapar.json")
    ap.add_argument("--nombres", nargs="*", default=[], help="busca: nombres propios a rastrear además de los patrones")
    a = ap.parse_args()
    c = cfg_de(RAIZ / a.config if not os.path.isabs(a.config) else a.config)
    if a.accion == "ocr": cmd_ocr(c)
    elif a.accion == "busca": cmd_busca(c, a.nombres)
    elif a.accion == "render": cmd_render(c)
    else: sys.exit(cmd_verifica(c))

if __name__ == "__main__":
    main()
