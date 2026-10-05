#!/usr/bin/env python3
"""Aplica tu perfil (el del cuestionario) a ESTE proyecto.

  python3 scripts/aplica_perfil.py              # perfil de ~/.config/reel-edicion/perfil.json
  python3 scripts/aplica_perfil.py --perfil otro.json

Qué toca, y nada más:
  - src/theme.ts  → el bloque entre «PERFIL» y «FIN PERFIL» (colores, subtítulos, raíl)
  - src/fonts.ts  → la tipografía (Google Fonts vía @remotion/google-fonts)
  - perfil.json   → copia en el proyecto, para que el proyecto se renderice igual
                    aunque cambies tu perfil más adelante

La geometría fina (bandas, CAPTION_CY, SPLIT_Y…) NO sale del perfil: depende de cada
grabación y se mide (SKILL.md → «Cómo encontrar el espacio muerto»).
"""
import argparse, json, pathlib, re, subprocess, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "scripts"))

DEF_COLORES = {
    "text": "#FFFFFF", "soft": "#D6DCE5", "accent": "#3DD6F5", "highlight": "#3DD6F5",
    "ok": "#4ADE80", "alert": "#FB7185", "ink": "#0B0F14", "line": "#7C8794",
}
NOTAS = {
    "text": "texto principal de paneles y rótulos", "soft": "texto secundario",
    "accent": "el color del CTA y de los detalles que mandan: úsalo poco",
    "highlight": "resalte de la palabra activa del subtítulo",
    "ok": "checks, «hecho», sellos en verde", "alert": "tachados, errores, sellos en rojo",
    "ink": "fondo de paneles y lienzo", "line": "líneas finas, handle, etiquetas apagadas",
}
DEF_SUBS = {"upper": True, "size": 80, "maxWords": 4, "band": False, "byBrand": True}
RAILES = {   # dónde queda la zona libre del plano → columna del kicker, secciones y chips
    "izquierda": {"x": 70, "w": 430},
    "derecha":   {"x": 470, "w": 430},
    "arriba":    {"x": 70, "w": 830},
}


def modulo(nombre):
    """«Plus Jakarta Sans» -> «PlusJakartaSans» (nombre del módulo de @remotion/google-fonts)."""
    return re.sub(r"[^A-Za-z0-9]", "", nombre.title() if nombre.islower() else nombre)


def pesos(mod, quiero):
    """Pesos disponibles de la fuente; si no hay node_modules, se confía en la lista."""
    nm = RAIZ / "node_modules" / "@remotion" / "google-fonts"
    if not nm.exists():
        return quiero
    js = f"const f=require('@remotion/google-fonts/{mod}');console.log(JSON.stringify(Object.keys(f.getInfo().fonts.normal||{{}})))"
    r = subprocess.run(["node", "-e", js], cwd=RAIZ, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"«{mod}» no está en Google Fonts (o el nombre no casa). Mira https://fonts.google.com")
    hay = json.loads(r.stdout)
    ok = [w for w in quiero if w in hay]
    if len(ok) < len(quiero):
        print(f"  aviso: {mod} no tiene los pesos {sorted(set(quiero) - set(ok))}; el navegador los simulará")
    return ok or hay[-1:]


def ts(v):
    return json.dumps(v, ensure_ascii=False) if not isinstance(v, bool) else ("true" if v else "false")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--perfil")
    a = ap.parse_args()
    if a.perfil:
        perfil = json.loads(pathlib.Path(a.perfil).read_text())
    else:
        from perfil import carga
        perfil = carga()
    if not perfil:
        print("sin perfil: se quedan los valores neutros (corre el cuestionario de la skill)")

    col = {**DEF_COLORES, **perfil.get("colores", {})}
    subs = {**DEF_SUBS, **perfil.get("subtitulos", {})}
    plano = perfil.get("plano", {})
    rail = RAILES.get(plano.get("espacio_libre", "izquierda"), RAILES["izquierda"])
    align = "inline" if plano.get("fuente_habitual") == "split" else "chip"

    w = max(len(k) for k in col) + 2
    bloque = "// ── PERFIL (generado por aplica_perfil.py) ──\nexport const COLORS = {\n"
    bloque += "".join(f'  {(k + ":").ljust(w)} "{v}",   // {NOTAS.get(k, "")}\n' for k, v in col.items())
    bloque += "} as const;\nexport const CAPTIONS = {\n"
    bloque += "".join(f"  {k}: {ts(v)},\n" for k, v in subs.items())
    bloque += "} as const;\n"
    bloque += f'export const RAIL = {{ x: {rail["x"]}, w: {rail["w"]} }} as const;   // columna libre del plano\n'
    bloque += f'export const TOPIC_ALIGN_DEFAULT: "chip" | "inline" | "off" = "{align}";\n'
    bloque += "// ── FIN PERFIL ──\n"

    th = RAIZ / "src" / "theme.ts"
    s = th.read_text()
    s2, n = re.subn(r"// ── PERFIL.*?// ── FIN PERFIL ──\n", lambda _: bloque, s, flags=re.S)
    if not n:
        sys.exit("theme.ts no tiene el bloque PERFIL")
    th.write_text(s2)

    fuente = perfil.get("fuente", {})
    fam, mono = modulo(fuente.get("principal", "Inter")), modulo(fuente.get("mono", "JetBrains Mono"))
    wf, wm = pesos(fam, ["600", "700", "800"]), pesos(mono, ["500", "700"])
    (RAIZ / "src" / "fonts.ts").write_text(f'''// GENERADO por scripts/aplica_perfil.py — cambia la fuente en tu perfil, no aquí.
import {{ loadFont }} from "@remotion/google-fonts/{fam}";
import {{ loadFont as loadMono }} from "@remotion/google-fonts/{mono}";

export const {{ fontFamily }} = loadFont("normal", {{
  weights: {json.dumps(wf)}, subsets: ["latin", "latin-ext"], ignoreTooManyRequestsWarning: true,
}});
export const {{ fontFamily: mono }} = loadMono("normal", {{
  weights: {json.dumps(wm)}, subsets: ["latin"], ignoreTooManyRequestsWarning: true,
}});
''')
    if perfil:
        (RAIZ / "perfil.json").write_text(json.dumps(perfil, ensure_ascii=False, indent=2) + "\n")
    print(f"perfil aplicado: fuente {fam} · acento {col['accent']} · resalte {col['highlight']} · "
          f"subtítulos {'MAYÚS' if subs['upper'] else 'normal'} {subs['size']}px · raíl {plano.get('espacio_libre', 'izquierda')}")


if __name__ == "__main__":
    main()
