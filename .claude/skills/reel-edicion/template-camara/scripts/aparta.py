#!/usr/bin/env python3
"""Calcula los tramos donde el raíl y el chip de marca deben APARTARSE.

  uv run --with opencv-python-headless --with numpy python scripts/aparta.py [--escribe]

El raíl (kicker · secciones · chip de keyword, y 275..400) y el chip de marca
(y 560..640) viven sobre la zona muerta del plano (RAIL en theme.ts). Casi siempre. Cuando él
se acerca a la cámara la cara sube y entra en esas bandas, y un rótulo encima de
su cara es justo lo que no puede pasar nunca.

En vez de moverlos —arriba no hay hueco: el recorte 4:5 empieza en y 285— se
desvanecen mientras dure la invasión y vuelven solos (`aparta()` en anim.ts).

Con `--escribe` mete los tramos en cortes.json como `mute_rail` y `mute_topic`.
"""
import argparse, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from caras import serie, cara
from verifica import solape, RAIL, TOPIC

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TOLERA   = 0.01     # solape con la cara por debajo del cual no pasa nada
JUNTA    = 0.6      # dos tramos sucios separados por menos de esto se unen
MINIMO   = 0.0      # con las rampas de 0.3 s, hasta un parpadeo suelto se lee como un fundido

def tramos_sucios(s, rect):
    sucio = [t for t, r in s if r and solape(r, rect) >= TOLERA]
    if not sucio: return []
    out, ini, ult = [], sucio[0], sucio[0]
    for t in sucio[1:]:
        if t - ult > JUNTA:
            out.append([ini, ult]); ini = t
        ult = t
    out.append([ini, ult])
    # se ensancha un pelo por cada lado: la cara entra antes de que el detector la sitúe ahí
    return [[round(max(0, a - 0.15), 2), round(b + 0.15, 2)] for a, b in out if b - a >= MINIMO]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--escribe", action="store_true")
    a = ap.parse_args()
    caras = json.load(open(RAIZ / "work" / "c1_caras.json"))
    s = serie(caras, margen=0, caja_fn=cara)
    rail  = tramos_sucios(s, RAIL)
    topic = tramos_sucios(s, TOPIC)
    for nom, tr in (("raíl (kicker · secciones · keyword)", rail), ("chip de marca", topic)):
        tot = sum(b - a for a, b in tr)
        print(f"{nom}: {len(tr)} tramos, {tot:.1f} s apartado")
        for x, y in tr: print(f"   {x:6.2f} → {y:6.2f}")
    if a.escribe:
        import collections
        p = RAIZ / "cortes.json"
        d = json.load(open(p, encoding="utf-8"), object_pairs_hook=collections.OrderedDict)
        d["c1"]["mute_rail"], d["c1"]["mute_topic"] = rail, topic
        d["c1"]["_mute"] = ("tramos calculados por scripts/aparta.py: donde la cara invade la banda del "
                            "raíl (y 275..400) o la del chip de marca (y 560..640), el rótulo se "
                            "desvanece con una rampa de 0.3 s y vuelve solo. Arriba no hay dónde "
                            "moverlo: el recorte 4:5 del feed empieza en y 285.")
        json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("\n-> escrito en cortes.json")

if __name__ == "__main__":
    main()
