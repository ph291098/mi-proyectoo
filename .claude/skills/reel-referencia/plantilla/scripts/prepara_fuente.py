#!/usr/bin/env python3
"""Deja la grabación lista para Remotion: public/fuente.mp4 (1080x1920, H.264, bt709) + work/audio.wav.

  python3 scripts/prepara_fuente.py work/mi-video.mov
  python3 scripts/prepara_fuente.py work/mi-video.mov --lut luts/DLogM-to-Rec709.cube      # D-Log / D-Log M
  python3 scripts/prepara_fuente.py work/mi-video.mov --color "curves=b='0/0 0.34/0.43 1/1'"

En UNA sola pasada (sin generaciones de pérdida intermedias):
  1. --lut: LUT 3D (.cube) PRIMERO, sobre el log original y en alta precisión. Para D-Log usa el
     LUT oficial de DJI de esa cámara y ese perfil (D-Log y D-Log M no son intercambiables).
  2. Barras negras: cropdetect sobre todo el vídeo; se recorta 1 px más por lado (las columnas
     de transición antialiasadas dejan una línea) y se ajusta a 9:16 exacto.
  3. Escala a 1080x1920 con lanczos; si se amplía más de ×1,2, un enfoque suave (unsharp 0,55).
  4. --color: corrección extra (curvas, eq…), medida antes con scripts/mide_color.py.
"""
import argparse, json, pathlib, re, subprocess, sys

ap = argparse.ArgumentParser()
ap.add_argument("fuente")
ap.add_argument("--lut")
ap.add_argument("--color", help="filtro ffmpeg extra tras escalar, p. ej. curves=… o eq=…")
ap.add_argument("--out", default="public/fuente.mp4")
ap.add_argument("--audio", default="work/audio.wav")
ap.add_argument("--sin-barras", action="store_true", help="no recortar aunque cropdetect encuentre algo")
a = ap.parse_args()

info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height,pix_fmt,codec_name", "-of", "json", a.fuente],
                                 capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = info["width"], info["height"]
print(f"fuente: {W}x{H} {info['codec_name']} {info['pix_fmt']}")

filtros = []
if a.lut:
    if not pathlib.Path(a.lut).exists():
        sys.exit(f"no encuentro el LUT {a.lut}")
    # el LUT se aplica en RGB de 16 bits por canal: sin bandas al expandir el log
    filtros += ["format=rgb48le", f"lut3d=file='{a.lut}':interp=tetrahedral"]

x, y, w, h = 0, 0, W, H
if not a.sin_barras:
    # cropdetect sobre la imagen ya convertida (si hay LUT, el log lavado engaña al umbral)
    pre = ",".join(filtros + ["cropdetect=24:2:0"])
    det = subprocess.run(["ffmpeg", "-hide_banner", "-i", a.fuente, "-vf", pre, "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    vals = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", det)
    if vals:
        cw, ch, cx, cy = map(int, max(set(vals), key=vals.count))
        if cw < W - 4 or ch < H - 4:
            x, y, w, h = cx + 1, cy, cw - 2, ch          # fuera las columnas de transición
            print(f"barras: imagen útil {cw}x{ch} en x={cx}, y={cy}")
# ajusta a 9:16 exacto recortando lo mínimo del lado que sobra
if w / h > 9 / 16:
    nw = int(h * 9 / 16) // 2 * 2; x += (w - nw) // 2; w = nw
else:
    nh = int(w * 16 / 9) // 2 * 2; y += (h - nh) // 2; h = nh
filtros.append(f"crop={w}:{h}:{x}:{y}")
factor = 1080 / w
filtros.append("scale=1080:1920:flags=lanczos")
if factor > 1.2:
    filtros.append("unsharp=5:5:0.55:5:5:0.0")
    print(f"aviso: se amplía ×{factor:.2f} — se verá algo blando; mejor exportar en vertical desde el origen")
if a.color:
    filtros.append(a.color)
filtros.append("format=yuv420p")

pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
pathlib.Path(a.audio).parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a.fuente, "-vf", ",".join(filtros),
                "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", a.out], check=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a.fuente, "-vn", "-ac", "1", "-ar", "16000", a.audio], check=True)
print(f"listo: {a.out} (recorte {w}x{h}+{x}+{y}, ×{factor:.2f}) · {a.audio}")
print("filtro:", ",".join(filtros))
