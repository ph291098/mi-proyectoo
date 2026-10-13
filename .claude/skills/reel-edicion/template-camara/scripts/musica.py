#!/usr/bin/env python3
"""Monta la cama musical en public/musica.wav desde `music.tramos` de cortes.json.

  python3 scripts/musica.py [--cid c1]

  "music": { "src": "musica.wav", "gain": 0, "dur": 72.6,
    "tramos": [
      { "file": "~/ReelKit/musica/suspenso.mp3",
        "from": 2.3, "len": 51.95, "at": 0, "fadeIn": 0.3, "fadeOut": 0.2, "lufs": -29 },
      { "file": "~/ReelKit/musica/resolucion.mp3",
        "from": 60, "len": 20.5, "at": 52.1, "fadeIn": 0.25, "fadeOut": 1.2, "lufs": -29 } ] }

Música: la tuya, CC0 o con licencia para redes (Freesound con filtro CC0, Pixabay Music,
la biblioteca de YouTube…). Apunta en un manifest.json de la carpeta de música el autor y
para qué sirve cada pista. `from` salta el silencio de cabeza de la pista. El SUSPENSO corta EN SECO justo antes de la revelación y la resolución
entra encima de la frase que la da: ese silencio de 0.1 s es el golpe.

Nivel: cada tramo se normaliza a `lufs` (−29) y el conjunto entra con `gain`. Con una voz
de micro cercano (pico −10 dBFS en la mezcla) `gain: 0` deja la música en −25/−29 dBFS:
se siente. A −5 puede quedar 20 dB bajo la voz y no oírse. Mídelo con scripts/mide_sfx.sh, no a oído.
"""
import argparse, json, pathlib, subprocess

RAIZ = pathlib.Path(__file__).resolve().parent.parent

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--cid", default="c1")
    a = ap.parse_args()
    m = json.load(open(RAIZ / "cortes.json"))[a.cid]["music"]
    work = RAIZ / "work"; work.mkdir(exist_ok=True)
    ins, fil = [], []
    for k, tr in enumerate(m["tramos"]):
        out = work / f"musica_{k}.wav"
        fo = tr["len"] - tr.get("fadeOut", 0.3)
        af = (f"aresample=48000,afade=t=in:d={tr.get('fadeIn', 0.3)},afade=t=out:st={fo:.3f}:d={tr.get('fadeOut', 0.3)},"
              f"loudnorm=I={tr.get('lufs', -29)}:TP=-6:LRA=11")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(tr["from"]), "-t", str(tr["len"]), "-i", str(pathlib.Path(tr["file"]).expanduser()),
                        "-af", af, "-ac", "2", "-ar", "48000", str(out)], check=True)
        ins += ["-i", str(out)]
        ms = int(round(tr["at"] * 1000))
        fil.append(f"[{k}]adelay={ms}|{ms}[t{k}]")
    mix = "".join(f"[t{k}]" for k in range(len(m["tramos"])))
    fil.append(f"{mix}amix=inputs={len(m['tramos'])}:normalize=0:duration=longest,apad,atrim=0:{m['dur']}[m]")
    dst = RAIZ / "public" / m.get("src", "musica.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fil), "-map", "[m]", "-ar", "48000", str(dst)], check=True)
    print(f"-> {dst.relative_to(RAIZ)} ({len(m['tramos'])} tramos, {m['dur']} s)")

if __name__ == "__main__":
    main()
