#!/usr/bin/env python3
"""Genera work/<cid>_words.json en otro idioma a partir de una traducción por FRASES.

  python3 scripts/traduce.py --de c1 --a c1en --texto work/traduccion_en.json

Por qué por frases y no palabra a palabra: el orden cambia de un idioma a otro, así
que traducir token a token deja el resalte señalando la palabra equivocada. Lo que sí
se conserva es la VENTANA: cada segmento del transcriptor mantiene su inicio y su
final, y dentro de él las palabras nuevas se reparten en proporción a su longitud
(caracteres + 1), que aproxima la duración hablada mucho mejor que un reparto igual.

El resalte queda sincronizado a nivel de frase, que es lo que se percibe; pedirle
sincronía por palabra a una traducción es pedirle algo que no existe.
"""
import argparse, json, pathlib, sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--de", required=True, help="cid de origen (usa work/<cid>.json de whisper)")
    ap.add_argument("--a", required=True, help="cid de destino")
    ap.add_argument("--texto", required=True, help="JSON [{i, en}] con la traducción por segmento")
    a = ap.parse_args()
    raiz = pathlib.Path(__file__).resolve().parent.parent
    work = raiz / "work"
    segs = json.load(open(work / f"{a.de}.json"))["segments"]
    tra = {t["i"]: t["en"] for t in json.load(open(a.texto))}

    out = []
    for i, sg in enumerate(segs):
        txt = tra.get(i)
        if not txt: continue
        ws = txt.split()
        pesos = [len(w) + 1 for w in ws]
        total = sum(pesos)
        dur = sg["end"] - sg["start"]
        t = sg["start"]
        for w, p in zip(ws, pesos):
            d = dur * p / total
            out.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d
    (work / f"{a.a}_words.json").write_text(json.dumps(out, ensure_ascii=False))
    faltan = [i for i in range(len(segs)) if i not in tra]
    if faltan: print(f"  AVISO: sin traducir los segmentos {faltan}")
    print(f"{a.a}: {len(out)} palabras en {len(tra)} segmentos -> work/{a.a}_words.json")

main()
