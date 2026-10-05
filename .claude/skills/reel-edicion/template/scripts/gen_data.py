#!/usr/bin/env python3
"""Genera src/data/<cid>.ts desde transcripts word-level + spans.

ENTRADA (por cada corte, en --work):
  <cid>_words.json  [{"text","start","end"}, ...]   segundos
  <cid>_spans.json  [{"kind":"room"|"slide","start","end","crop"?}, ...]

USO
  python3 scripts/gen_data.py --work ../work/cuts --cuts c1 c2 --config cortes.json

El fichero de --config lleva kickers, tarjetas y correcciones:
  {
    "handle": "@tu_usuario",   (si falta, sale del perfil)
    "c1": {
      "kicker": "la ia no te quita el trabajo",
      "fix":    {"serem": "CRM", "ground": "cron"},
      "cards":  [{"t":"point","start":64.0,"end":71.2,"kicker":"lo que no cambia",
                  "lines":["El agente redacta.","No envía nada solo."]}]
    }
  }

REGLA DE LAS CORRECCIONES (`fix`)
  Se corrige por CONTEXTO, no por parecido sonoro, y se documenta cada una.
  El subtítulo sigue al AUDIO: si él dijo un número equivocado, se deja. Cambiarlo
  sería poner en su boca algo que no dijo. Solo se arreglan errores del
  transcriptor (marcas mal escritas, palabras técnicas), nunca al hablante.
  Valor "" borra el token (dos tokens que deben fundirse en uno).
"""
import argparse, json, pathlib, sys, unicodedata
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

def _perfil_handle():
    from perfil import carga
    return carga().get("handle", "")

TPL = '''// generado por scripts/gen_data.py — no editar a mano
import type {{ ReelData }} from "../Reel";
export const {cid}: ReelData = {{
  src: {src},
  voice: "{cid}_voice.mp3",
  kicker: {kicker},
  handle: {handle},
  spans: {spans},
  cards: {cards} as ReelData["cards"],
  captions: {caps} as ReelData["captions"],
  seams: {seams},
}};
'''

def norm(t):
    return "".join(c for c in unicodedata.normalize("NFC", t).lower() if c.isalnum())

def captions(words_path, fix):
    """`fix` mapea token -> texto corregido ("" = el token lo absorbe el anterior).

    Una clave puede ir ANCLADA EN TIEMPO como "token@12.34": solo corrige la
    ocurrencia que empieza en ese segundo (±0.06 s). Hace falta cuando la palabra
    mal transcrita es común y una corrección global pisaría otras: en el reel del
    NAS «cloud» es Nextcloud a los 16.70 s, y «7» forma parte del modelo a los
    72.92 s pero es el 7 de «24/7» a los 86.84 s.
    """
    anclados = {}                             # (token, ms) -> nuevo
    globales = {}
    for k, v in fix.items():
        if "@" in k:
            tok, t = k.rsplit("@", 1)
            anclados[(norm(tok), round(float(t) * 1000))] = v
        else:
            globales[norm(k)] = v
    ws = json.load(open(words_path))
    out, nfix, usados = [], 0, set()
    for w in ws:
        txt, k = w["text"], norm(w["text"])
        ms = round(w["start"] * 1000)
        clave = next(((tok, t) for (tok, t) in anclados
                      if tok == k and abs(t - ms) <= 60), None)
        if clave is not None:
            new = anclados[clave]; nfix += 1; usados.add(clave)
        elif k in globales:
            new = globales[k]; nfix += 1
        else:
            new = None
        if new is not None:
            if new == "":
                continue                      # token absorbido por el anterior
            txt = new
        out.append({"text": txt,
                    "startMs": round(w["start"] * 1000),
                    "endMs": round(w["end"] * 1000),
                    "timestampMs": round((w["start"] + w["end"]) / 2 * 1000),
                    "confidence": 1})
    # Un `@tiempo` mal puesto no falla: simplemente no corrige nada y el subtítulo
    # sale mal. Avisar es la única forma de verlo sin mirar un still de ese segundo.
    for clave in anclados:
        if clave not in usados:
            print(f"  AVISO: el fix anclado {clave[0]}@{clave[1]/1000:.2f} no casó con ninguna palabra")
    # mayúscula en la primera palabra del corte (regla del motor de captions)
    if out:
        out[0]["text"] = out[0]["text"][:1].upper() + out[0]["text"][1:]
    return out, nfix

def sin_notas(x):
    """Quita las claves de auditoría (las que empiezan por "_") a cualquier
    profundidad. La doctrina pide documentar cada corrección y cada tarjeta
    DENTRO de cortes.json; sin esto esas notas se colaban al TypeScript
    generado y el typecheck fallaba con TS2352."""
    if isinstance(x, dict):
        return {k: sin_notas(v) for k, v in x.items() if not k.startswith("_")}
    if isinstance(x, list):
        return [sin_notas(v) for v in x]
    return x


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", required=True, help="carpeta con <cid>_words.json y <cid>_spans.json")
    ap.add_argument("--cuts", required=True, nargs="+", help="ids de corte: c1 c2 ...")
    ap.add_argument("--config", default="cortes.json")
    ap.add_argument("--out", default="src/data")
    a = ap.parse_args()

    work = pathlib.Path(a.work)
    out_dir = pathlib.Path(a.out); out_dir.mkdir(parents=True, exist_ok=True)
    cfg = json.load(open(a.config)) if pathlib.Path(a.config).exists() else {}
    handle = json.dumps(cfg.get("handle", _perfil_handle()), ensure_ascii=False)

    for cid in a.cuts:
        c = cfg.get(cid, {})
        wp, sp = work / f"{cid}_words.json", work / f"{cid}_spans.json"
        for p in (wp, sp):
            if not p.exists():
                raise SystemExit(f"falta {p}")
        # Las notas de auditoría de `fix` se quitan ANTES de normalizar: norm() borra
        # el "_" (no es alfanumérico), así que "_prongs" se convertía en "prongs" y la
        # NOTA pisaba la corrección — el subtítulo salía con el texto de la nota dentro.
        fixes = {k: v for k, v in c.get("fix", {}).items() if not k.startswith("_")}
        caps, nfix = captions(wp, fixes)
        # costuras del densificado: solo las que se notan piden tapado
        cp = work / f"{cid}_costuras.json"
        seams = ([round(x["t"], 3) for x in json.load(open(cp))["costuras"] if x["se_nota"]]
                 if cp.exists() else [])
        (out_dir / f"{cid}.ts").write_text(TPL.format(
            cid=cid,
            src=json.dumps(c.get("src", f"{cid}.mp4"), ensure_ascii=False),
            kicker=json.dumps(c.get("kicker", ""), ensure_ascii=False),
            handle=handle,
            spans=json.dumps(json.load(open(sp))),
            cards=json.dumps(sin_notas(c.get("cards", [])), ensure_ascii=False),
            caps=json.dumps(caps, ensure_ascii=False),
            seams=json.dumps(seams)))
        print(f"  {cid}: {len(caps)} tokens, {nfix} correcciones, {len(seams)} costuras -> {out_dir/f'{cid}.ts'}")
    print("datos generados")

if __name__ == "__main__":
    main()
