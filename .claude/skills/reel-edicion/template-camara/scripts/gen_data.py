#!/usr/bin/env python3
"""Genera src/data/<cid>.ts desde transcripts word-level + spans.

ENTRADA (por cada corte, en --work):
  <cid>_words.json  [{"text","start","end"}, ...]   segundos
  <cid>_spans.json  [{"start","end","scale"?,"x"?,"y"?}, ...]   encuadres (Plate.tsx)
                    OJO: aquí NO va "kind" (eso es de template/, la de 16:9); un campo
                    de más rompe el typecheck y el render no lo avisa.

USO
  python3 scripts/gen_data.py --work ../work/cuts --cuts c1 c2 --config cortes.json

El fichero de --config lleva kickers, tarjetas y correcciones:
  {
    "handle": "@tu_usuario",   (si falta, sale del perfil)
    "c1": {
      "kicker": "la ia no te quita el trabajo",
      "fix":    {"serem": "CRM", "ground": "cron"},
      "cards":  [{"t":"point","start":64.0,"end":71.2,"kicker":"lo que no cambia",
                  "lines":["El agente redacta.","No envía nada solo."]}],
      "teaser":   {...},   "sections": [...],   "flows": [...],
      "cap_zones": [...],  "kicker_from": 2.13
    }
  }
  teaser / sections / flows: ver cortes.example-lista.json (reel de lista numerada).

REGLA DE LAS CORRECCIONES (`fix`)
  Se corrige por CONTEXTO, no por parecido sonoro, y se documenta cada una.
  El subtítulo sigue al AUDIO: si él dijo un número equivocado, se deja. Cambiarlo
  sería poner en su boca algo que no dijo. Solo se arreglan errores del
  transcriptor (marcas mal escritas, palabras técnicas), nunca al hablante.
  Valor "" borra el token (dos tokens que deben fundirse en uno).
  Las claves de `cortes.json` que empiezan por "_" son notas de auditoría
  (por qué se corrigió cada cosa y qué se dejó tal cual); el script las ignora.
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
  title: {title} as ReelData["title"],
  topics: {topics} as ReelData["topics"],
  keyword: {keyword} as ReelData["keyword"],
  punches: {punches},
  sfx: {sfx} as ReelData["sfx"],
  hide: {hide},
  captions: {caps} as ReelData["captions"],
  capZones: {cap_zones} as ReelData["capZones"],
  kickerFrom: {kicker_from},
  teaser: {teaser} as ReelData["teaser"],
  sections: {sections} as ReelData["sections"],
  flows: {flows} as ReelData["flows"],
  tracks: {tracks} as ReelData["tracks"],
  muteRail: {mute_rail} as ReelData["muteRail"],
  split: {split} as ReelData["split"],
  escenas: {escenas} as ReelData["escenas"],
  music: {music} as ReelData["music"],
  muteTopic: {mute_topic} as ReelData["muteTopic"],
  broll: {broll} as ReelData["broll"],
  grandes: {grandes} as ReelData["grandes"],
}};
'''

def norm(t):
    return "".join(c for c in unicodedata.normalize("NFC", t).lower() if c.isalnum())

def captions(words_path, fix):
    """`fix` mapea token -> texto corregido ("" = el token lo absorbe el anterior).

    Una clave puede ir ANCLADA EN TIEMPO como "token@12.34": solo corrige la
    ocurrencia que empieza en ese segundo (±0.06 s). Hace falta cuando la palabra
    mal transcrita es común y una corrección global pisaría otras: p.ej. «cloud» es
    Nextcloud a los 16.70 s pero no en el resto del vídeo.
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
        # La clave va CRUDA a captions(): normalizarla aquí borraba también el "@" y el
        # "." del ancla temporal ("cloud@16.70" -> "cloud1670"), así que los fixes
        # anclados no casaban con nada y se aplicaban en silencio como si no existieran.
        fixes = {k: v for k, v in c.get("fix", {}).items() if not k.startswith("_")}
        caps, nfix = captions(wp, fixes)
        # Los tracks traen sus claves de work/track_<id>.json (scripts/rastrea.py).
        # Se inyectan aquí para que cortes.json no cargue con miles de números.
        tracks = []
        for tk in sin_notas(c.get("tracks", [])):
            kf = work / f"track_{tk['id']}.json"
            if not kf.exists():
                raise SystemExit(f"falta {kf}: corre scripts/rastrea.py --id {tk['id']}")
            tk = dict(tk); tk["keys"] = json.load(open(kf)); tk["t"] = "track"
            tk.pop("id", None)
            tracks.append(tk)
        # Tramos en pantalla dividida: los de cortes.json mandan; si no hay, los que
        # midió scripts/layout.py. El scrim y los valores por defecto cambian con ellos.
        split = c.get("split")
        if split is None:
            lf = work / f"{cid}_layout.json"
            split = json.load(open(lf))["split"] if lf.exists() else []
        # `src` configurable: una segunda versión (otro idioma, otro montaje) usa el MISMO
        # vídeo, no una copia — duplicar 300 MB por cambiar el texto no tiene sentido.
        (out_dir / f"{cid}.ts").write_text(TPL.format(
            cid=cid,
            src=json.dumps(c.get("src", f"{cid}.mp4")),
            kicker=json.dumps(c.get("kicker", ""), ensure_ascii=False),
            handle=handle,
            spans=json.dumps(json.load(open(sp))),
            cards=json.dumps(sin_notas(c.get("cards", [])), ensure_ascii=False),
            title=json.dumps(c.get("title"), ensure_ascii=False),
            topics=json.dumps(c.get("topics", []), ensure_ascii=False),
            keyword=json.dumps(c.get("keyword"), ensure_ascii=False),
            punches=json.dumps(c.get("punches", [])),
            sfx=json.dumps(c.get("sfx", []), ensure_ascii=False),
            # `hide` se escribe en SEGUNDOS en cortes.json (como todo lo demás);
            # el motor de subtítulos trabaja en ms.
            hide=json.dumps([[round(a * 1000), round(b * 1000)] for a, b in c.get("hide", [])]),
            caps=json.dumps(caps, ensure_ascii=False),
            cap_zones=json.dumps(c.get("cap_zones", []), ensure_ascii=False),
            # kickerFrom es `number | undefined` en Reel.tsx: emitir `null` rompe el typecheck
            kicker_from=(json.dumps(c["kicker_from"]) if c.get("kicker_from") is not None else "undefined"),
            teaser=json.dumps(c.get("teaser"), ensure_ascii=False),
            sections=json.dumps(c.get("sections", []), ensure_ascii=False),
            tracks=json.dumps(tracks, ensure_ascii=False),
            mute_rail=json.dumps(c.get("mute_rail", [])),
            split=json.dumps(split),
            escenas=json.dumps(sin_notas(c.get("escenas")), ensure_ascii=False),
            # al TS solo van src y gain: `tramos` es la receta de scripts/musica.py
            music=json.dumps({"src": c["music"].get("src", "musica.wav"), "gain": c["music"].get("gain", 0)} if c.get("music") else None),
            mute_topic=json.dumps(c.get("mute_topic", [])),
            broll=json.dumps(sin_notas(c.get("broll", [])), ensure_ascii=False),
            grandes=json.dumps(sin_notas(c.get("grandes")), ensure_ascii=False),
            flows=json.dumps(sin_notas(c.get("flows", [])), ensure_ascii=False)))
        print(f"  {cid}: {len(caps)} tokens, {nfix} correcciones -> {out_dir/f'{cid}.ts'}")
    print("datos generados")

if __name__ == "__main__":
    main()
