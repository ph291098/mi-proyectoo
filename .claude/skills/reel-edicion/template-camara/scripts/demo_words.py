#!/usr/bin/env python3
"""Genera la DEMO: un guion ficticio con tiempos de palabra sintéticos.

  python3 scripts/demo_words.py        # -> work/c1_words.json + work/c1_spans.json

Solo para ver la plantilla funcionando sin grabación propia. En un reel real los
tiempos salen de la transcripción (whisper con --word-timestamps).
"""
import json, pathlib

GUION = ("Hay tres tareas que ya no hago a mano, y te las enseño de la más fácil a la más rentable. "
         "Número uno: los correos. Cada mañana un agente lee la bandeja, separa lo urgente y me deja borradores. "
         "Yo solo reviso y envío. "
         "Número dos: las reuniones. La grabación se transcribe sola, sale un resumen y las tareas acaban en Notion. "
         "Número tres: el contenido. De un solo vídeo salen el guion, los subtítulos y el post. "
         "Lo que antes me llevaba una tarde ahora son diez minutos. "
         "¿Y tú qué le delegarías primero?")

def main():
    t, out = 0.4, []
    for w in GUION.split():
        d = 0.16 + 0.035 * len(w)
        out.append({"text": w, "start": round(t, 2), "end": round(t + d, 2)})
        t += d + 0.04 + (0.35 if w[-1] in ".:?" else 0.12 if w[-1] == "," else 0)
    work = pathlib.Path(__file__).resolve().parent.parent / "work"
    work.mkdir(exist_ok=True)
    (work / "c1_words.json").write_text(json.dumps(out, ensure_ascii=False, indent=0))
    dur = round(t + 1.2, 2)
    # un punch-in suave por bloque, como harías en un plano fijo real
    (work / "c1_spans.json").write_text(json.dumps([
        {"start": 0, "end": 7.45}, {"start": 7.45, "end": 17.2, "scale": 1.12},
        {"start": 17.2, "end": 25.1}, {"start": 25.1, "end": dur, "scale": 1.1}]))
    print(f"demo: {len(out)} palabras, {dur:.1f} s")
    for w in out:
        print(f"  {w['start']:6.2f} {w['text']}")

if __name__ == "__main__":
    main()
