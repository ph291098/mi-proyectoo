#!/usr/bin/env python3
"""Tiempos de palabra para sincronizar tarjetas, chips y nodos de diagrama con la voz.

Lee work/<cid>_words.json (o el JSON de mlx-whisper y lo convierte) y saca:
  - los tramos pedidos con cada palabra y su inicio      (para colocar `at` de un flow)
  - o las apariciones de palabras clave en todo el corte  (marcas, "Número", el CTA…)

USO
  python3 scripts/words.py work/c1_words.json 58-76 84-104
  python3 scripts/words.py work/c1_words.json --find Número Telegram comenta
  python3 scripts/words.py work/c1.json --convert            # whisper -> c1_words.json
"""
import json, pathlib, sys


def load(path: pathlib.Path):
    d = json.load(open(path))
    if isinstance(d, dict) and "segments" in d:      # salida cruda de whisper
        return [{"text": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
                for s in d["segments"] for w in s.get("words", []) if w["word"].strip()]
    return d


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    path = pathlib.Path(sys.argv[1]); ws = load(path); args = sys.argv[2:]
    if args == ["--convert"]:
        out = path.with_name(path.stem.split("_")[0] + "_words.json")
        json.dump(ws, open(out, "w"), ensure_ascii=False, indent=0)
        print(f"{len(ws)} palabras -> {out}"); return
    if args and args[0] == "--find":
        keys = [k.lower() for k in args[1:]]
        for w in ws:
            if any(k in w["text"].lower() for k in keys):
                print(f'{w["start"]:8.2f} {w["end"]:8.2f}  {w["text"]}')
        return
    for rng in args:
        a, b = (float(x) for x in rng.split("-"))
        print(f"--- {a:g}-{b:g}")
        print(" ".join(f'{w["text"]}[{w["start"]:.2f}]' for w in ws if a <= w["start"] < b))


if __name__ == "__main__":
    main()
