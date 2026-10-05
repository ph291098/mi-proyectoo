#!/usr/bin/env python3
"""Mezcla de audio FUERA de Remotion: voz + música + efectos, con ffmpeg y sin normalizar.

Por qué: el mezclador de Remotion reescala según cuántas pistas suenan a la vez. Medido:
doblar un cue lo dejó MÁS BAJO y bajar la música 9 dB la
movió 2.3 dB: las ganancias de cortes.json dejaban de significar nada. Aquí la suma es
lineal (amix normalize=0), así que el nivel de cada cue es el pico RMS-50 ms de su fichero
+ su ganancia, y se calcula en vez de medirse con vecinos encima.

  python3 scripts/mezcla.py --cid c1 --objetivos   # fija gain de cada cue a su objetivo y lo escribe en cortes.json
  python3 scripts/mezcla.py --cid c1               # work/mezcla_c1.wav
  python3 scripts/mezcla.py --cid c1 --pega out/X.mp4   # sustituye el audio del render (vídeo copiado)

Objetivos (voz escalada a pico RMS −10 dBFS): golpes −14, finos −21, tick_soft −24, música −27.
Un cue puede fijar el suyo con "nivel": -18.
"""
import argparse, json, math, pathlib, subprocess, array

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FINOS = {"tick", "coin_1", "coin_2", "coin_3", "coin_4", "coin_5", "notify_a", "notify_b", "notify_c", "clock", "riser"}
NIVEL = lambda s: -24 if s == "tick_soft" else (-21 if s in FINOS else -14)

def pcm(path, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-i", str(path)] + (["-t", str(dur)] if dur else []) + ["-ac", "1", "-ar", "48000", "-f", "f32le", "-"]
    a = array.array("f"); a.frombytes(subprocess.run(cmd, capture_output=True).stdout); return a

def rms_ventanas(a):
    return [math.sqrt(sum(x * x for x in a[k:k + 2400]) / 2400) for k in range(0, max(1, len(a) - 2400), 1200)]

db = lambda v: 20 * math.log10(v + 1e-9)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--cid", default="c1")
    ap.add_argument("--objetivos", action="store_true"); ap.add_argument("--pega")
    a = ap.parse_args()
    cfg_all = json.load(open(RAIZ / "cortes.json")); c = cfg_all[a.cid]
    src = RAIZ / "public" / c.get("src", f"{a.cid}.mp4")
    voz = sorted(rms_ventanas(pcm(src)))
    voz_pico = db(voz[int(len(voz) * 0.995)])
    voz_gain = -10 - voz_pico
    mus = c.get("music"); mus_path = RAIZ / "public" / mus["src"] if mus else None
    if a.objetivos:
        cache = {}
        for q in c["sfx"]:
            k = (q["s"], q.get("dur"))
            if k not in cache: cache[k] = db(max(rms_ventanas(pcm(RAIZ / "public/sfx" / f"{q['s']}.wav", q.get("dur")))))
            q["gain"] = round(q.get("nivel", NIVEL(q["s"])) - cache[k], 1)
        if mus:
            m = sorted(rms_ventanas(pcm(mus_path)))
            mus["gain"] = round(mus.get("nivel", -27) - db(m[len(m) // 2]), 1)
        json.dump(cfg_all, open(RAIZ / "cortes.json", "w"), ensure_ascii=False, indent=2)
        print(f"voz: pico RMS {voz_pico:.1f} dBFS -> {voz_gain:+.1f} dB · música gain {mus['gain'] if mus else '-'} · {len(c['sfx'])} cues fijados")
        return
    ins, fil = ["-i", str(src)], [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,volume={voz_gain:.2f}dB[v0]"]
    labels = ["[v0]"]
    if mus:
        ins += ["-i", str(mus_path)]; fil.append(f"[1:a]aresample=48000,aformat=channel_layouts=stereo,volume={mus['gain']}dB[m]"); labels.append("[m]")
    for i, q in enumerate(c["sfx"]):
        n = len(ins) // 2; ins += ["-i", str(RAIZ / "public/sfx" / f"{q['s']}.wav")]
        ch = f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo"
        if q.get("dur"):
            fo = q.get("fadeOut", 0.1); ch += f",atrim=0:{q['dur']},afade=t=out:st={q['dur'] - fo}:d={fo}"
        if q.get("fadeIn"): ch += f",afade=t=in:d={q['fadeIn']}"
        ms = int(round(q["at"] * 1000))
        ch += f",volume={q.get('gain', -18)}dB,adelay={ms}|{ms}[s{i}]"; fil.append(ch); labels.append(f"[s{i}]")
    # −6 dB de margen: el pegado va a AAC, que no admite pasar de 0 dBFS; export.sh normaliza después
    fil.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=first,volume=-6dB[out]")
    out = RAIZ / "work" / f"mezcla_{a.cid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(fil), "-map", "[out]", "-c:a", "pcm_f32le", str(out)], check=True)
    print(f"-> {out.relative_to(RAIZ)} (voz {voz_gain:+.1f} dB, {len(c['sfx'])} cues)")
    if a.pega:
        v = RAIZ / a.pega; tmp = v.with_suffix(".tmp.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(v), "-i", str(out), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", str(tmp)], check=True)
        tmp.replace(v); print(f"-> audio pegado en {a.pega}")

if __name__ == "__main__":
    main()
