#!/usr/bin/env python3
"""Amplía el kit CC0 compartido DERIVANDO sonidos de los que ya hay.

  python3 scripts/sfx_deriva.py            # escribe en el kit compartido
  python3 scripts/sfx_deriva.py --dry      # solo dice qué haría

Por qué derivar y no descargar: el kit vive en la biblioteca del perfil
(~/ReelKit/sfx por defecto) y se reutiliza en todas las piezas — que el whoosh sea siempre el mismo es lo que
hace que suene "suyo". Un sonido derivado del mismo material entra en esa familia;
uno bajado de otro autor la rompe. Y un render que llama a una API deja de ser
reproducible. Es la misma regla con la que `whoosh_out` salió de invertir
`whoosh_in`.

Lo que se añade y para qué:

  coin_1..coin_5  el tick subiendo de tono. Uno por fila de la tabla de ahorro:
                  se OYE cómo se acumula el dinero, que es justo lo que la tarjeta
                  cuenta. Cinco pasos de semitono y medio; más separados suenan a
                  escala de juguete.
  cash            el total aterrizando: hit + sub_drop en capas, con paso bajo.
  swell           cama grave larga bajo una revelación (riser estirado).
  air             transición suave entre bloques: whoosh_in con paso alto y cola.
  reveal          riser + impact en una sola pieza, para no encadenar dos cues.
  tick_soft       el tick 6 dB por debajo, para los cambios de sección, que son
                  muchos y con el tick normal se comen la voz.

Todo sale a WAV 48 kHz estéreo y normalizado a pico -3 dBFS, igual que el resto
del kit, para que las ganancias del montaje sigan siendo comparables.
"""
import argparse, json, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from perfil import KIT


# nombre -> (fuente(s), filtro ffmpeg, para qué sirve)
DERIVADOS = {
    "tick_soft": (["tick"], "volume=-6dB", "cambio de sección: el tick normal se come la voz"),
    "coin_1":    (["tick"], "asetrate=48000*1.00,aresample=48000", "fila 1 de la tabla de ahorro"),
    "coin_2":    (["tick"], "asetrate=48000*1.09,aresample=48000,atempo=1/1.09", "fila 2"),
    "coin_3":    (["tick"], "asetrate=48000*1.19,aresample=48000,atempo=1/1.19", "fila 3"),
    "coin_4":    (["tick"], "asetrate=48000*1.30,aresample=48000,atempo=1/1.30", "fila 4"),
    "coin_5":    (["tick"], "asetrate=48000*1.41,aresample=48000,atempo=1/1.41", "fila 5"),
    "swell":     (["riser"], "asetrate=48000*0.45,aresample=48000,lowpass=f=900,volume=2dB",
                  "cama grave bajo la revelación del NAS"),
    "air":       (["whoosh_in"], "highpass=f=700,aecho=0.8:0.7:120:0.25,volume=1dB",
                  "transición suave entre bloques"),
}
# los que se hacen mezclando dos fuentes
MEZCLAS = {
    "cash":   (["hit", "sub_drop"], "el total aterrizando"),
    "reveal": (["riser", "impact"], "revelación del NAS en una sola pieza"),
}

def ff(args):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y"] + args, capture_output=True, text=True)
    if r.returncode: sys.exit(f"ffmpeg falló:\n{r.stderr[:600]}")

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    if not KIT.exists(): sys.exit(f"no encuentro el kit en {KIT}")
    man_p = KIT / "manifest.json"
    man = json.loads(man_p.read_text()) if man_p.exists() else {}

    for nombre, (fuentes, filtro, para) in DERIVADOS.items():
        src = KIT / f"{fuentes[0]}.wav"
        if not src.exists(): sys.exit(f"falta la fuente {src}")
        dst = KIT / f"{nombre}.wav"
        print(f"  {nombre:10s} <- {fuentes[0]:10s} {filtro[:52]}")
        if a.dry: continue
        # pico a -3 dBFS como todo el kit: así las ganancias del montaje son comparables
        ff(["-i", str(src), "-af", f"{filtro},dynaudnorm=p=0.9:m=1:s=0,alimiter=limit=0.708:level=disabled",
            "-ar", "48000", "-ac", "2", str(dst)])
        man[nombre] = {"derivado_de": fuentes, "filtro": filtro, "para": para,
                       "license": "http://creativecommons.org/publicdomain/zero/1.0/"}

    for nombre, (fuentes, para) in MEZCLAS.items():
        a0, a1 = KIT / f"{fuentes[0]}.wav", KIT / f"{fuentes[1]}.wav"
        if not (a0.exists() and a1.exists()): sys.exit(f"faltan fuentes para {nombre}")
        dst = KIT / f"{nombre}.wav"
        print(f"  {nombre:10s} <- {fuentes[0]} + {fuentes[1]}")
        if a.dry: continue
        ff(["-i", str(a0), "-i", str(a1), "-filter_complex",
            "[0:a]volume=-1dB[a];[1:a]volume=-3dB[b];[a][b]amix=inputs=2:duration=longest:normalize=0,"
            "alimiter=limit=0.708:level=disabled[o]", "-map", "[o]", "-ar", "48000", "-ac", "2", str(dst)])
        man[nombre] = {"derivado_de": fuentes, "para": para,
                       "license": "http://creativecommons.org/publicdomain/zero/1.0/"}

    if not a.dry:
        man_p.write_text(json.dumps(man, ensure_ascii=False, indent=2))
        print(f"\nkit: {len(list(KIT.glob('*.wav')))} sonidos · manifest actualizado")

if __name__ == "__main__":
    main()
