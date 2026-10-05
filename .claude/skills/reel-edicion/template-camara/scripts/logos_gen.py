#!/usr/bin/env python3
"""Regenera src/Logos.tsx desde public/logos/marcas.json y los SVG de public/logos/.

Los trazos son los oficiales de Simple Icons (CC0). El COLOR se aclara cuando el
oficial es negro o casi negro: sobre un plano oscuro no se lee. Cada desvío queda
anotado en marcas.json («nota») y en su línea de Logos.tsx.

USO
  python3 scripts/logos_gen.py                       # regenera con lo que haya
  python3 scripts/logos_gen.py --add figma notion    # baja de Simple Icons, añade y regenera
  python3 scripts/logos_gen.py --imagen mimarca public/logos/mimarca.png "Mi Marca" "#FF5A36"
        # un logo que NO está en Simple Icons (el tuyo, una herramienta pequeña):
        # se pinta como pegatina redonda con anillo de color. Nunca inventes un trazo.

Nunca metas una marca que el vídeo no nombre.
"""
import argparse, colorsys, json, pathlib, re, shutil, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
L = ROOT / "public" / "logos"
SPEC_F = L / "marcas.json"
CDN = "https://cdn.jsdelivr.net/npm/simple-icons@latest"


def claro(hexc):
    """Aclara un color que no se lee sobre fondo oscuro (luminosidad < 0.35)."""
    r, g, b = (int(hexc[i:i + 2], 16) / 255 for i in (0, 2, 4))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l >= 0.35:
        return "#" + hexc.upper(), None
    l2 = 0.62 if s > 0.15 else 0.9
    r, g, b = colorsys.hls_to_rgb(h, l2, s)
    return "#%02X%02X%02X" % (round(r * 255), round(g * 255), round(b * 255)), f"oficial #{hexc.upper()}: aclarado para fondo oscuro"


def add(slugs, spec):
    data = json.load(urllib.request.urlopen(f"{CDN}/data/simple-icons.json"))
    data = data["icons"] if isinstance(data, dict) else data
    por_slug = {d.get("slug") or re.sub(r"[^a-z0-9]", "", d["title"].lower()): d for d in data}
    for s in slugs:
        d = por_slug.get(s)
        if not d:
            cand = [k for k in por_slug if s in k][:8]
            sys.exit(f"«{s}» no está en Simple Icons. Parecidos: {', '.join(cand) or 'ninguno'}")
        urllib.request.urlretrieve(f"{CDN}/icons/{s}.svg", L / f"{s}.svg")
        color, nota = claro(d["hex"])
        spec[s] = {"name": d["title"], "color": color, **({"nota": nota} if nota else {})}
        print(f"  + {s}: {d['title']} {color}{'  (' + nota + ')' if nota else ''}")


def read(slug):
    s = (L / f"{slug}.svg").read_text()
    vb = re.search(r'viewBox="([^"]+)"', s)
    d = re.search(r'<path[^>]*\sd="([^"]+)"', s)
    if not (vb and d):
        sys.exit(f"no pude extraer el trazo de {slug}.svg")
    return vb.group(1), d.group(1)


def tsid(slug):
    t = re.sub(r"[^A-Za-z0-9_]", "", slug)
    return t if t and not t[0].isdigit() else "m" + t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--add", nargs="+", default=[])
    ap.add_argument("--imagen", nargs=4, metavar=("ID", "RUTA", "NOMBRE", "COLOR"))
    a = ap.parse_args()
    spec = json.loads(SPEC_F.read_text()) if SPEC_F.exists() else {}
    if a.add:
        add(a.add, spec)
    if a.imagen:
        i, ruta, nombre, color = a.imagen
        dst = L / f"{i}{pathlib.Path(ruta).suffix.lower()}"
        if pathlib.Path(ruta).resolve() != dst.resolve():
            shutil.copy(ruta, dst)
        spec[i] = {"name": nombre, "color": color, "img": dst.name}
    SPEC_F.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n")

    marks, colors, names, ids, imgs = [], [], [], [], []
    for slug, m in spec.items():
        t = tsid(slug)
        ids.append(t)
        colors.append(f'  {t}: "{m["color"]}",')
        names.append(f'  {t}: {json.dumps(m["name"], ensure_ascii=False)},')
        if m.get("img"):
            imgs.append(f'  {t}: "logos/{m["img"]}",')
            continue
        vb, d = read(slug)
        if m.get("nota"):
            marks.append(f"  // {m['name']}: {m['nota']}.")
        marks.append(f'  {t}: {{ viewBox: "{vb}", path: "{d}" }},')

    ids_ts = " | ".join(f'"{i}"' for i in ids) or "never"
    out = f'''// GENERADO por scripts/logos_gen.py desde public/logos/marcas.json — no editar a mano.
// Trazos oficiales de Simple Icons (CC0). El color se aclara cuando el oficial es negro
// o casi negro: sobre un plano oscuro no se lee. Las marcas con `img` (fuera de Simple
// Icons) se pintan como pegatina redonda con anillo de su color.
import React from "react";
import {{ Img, staticFile }} from "remotion";

export type LogoId = {ids_ts};

const MARKS: Partial<Record<LogoId, {{ viewBox: string; path: string }}>> = {{
{chr(10).join(marks)}
}};

const IMGS: Partial<Record<LogoId, string>> = {{
{chr(10).join(imgs)}
}};

export const LOGO_COLOR: Record<LogoId, string> = {{
{chr(10).join(colors)}
}};

export const LOGO_NAME: Record<LogoId, string> = {{
{chr(10).join(names)}
}};

export const Logo: React.FC<{{ id: LogoId; size: number; color?: string }}> = ({{ id, size, color }}) => {{
  const img = IMGS[id];
  if (img) {{
    return (
      <div style={{{{
        width: size, height: size, borderRadius: "50%", background: "#FFFFFF",
        border: `${{Math.max(2, size * 0.05)}}px solid ${{LOGO_COLOR[id]}}`, boxSizing: "border-box",
        overflow: "hidden", display: "block",
      }}}}>
        <Img src={{staticFile(img)}} style={{{{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}}} />
      </div>
    );
  }}
  const m = MARKS[id]!;
  return (
    <svg width={{size}} height={{size}} viewBox={{m.viewBox}} style={{{{ display: "block", overflow: "visible" }}}}>
      <path d={{m.path}} fill={{color ?? LOGO_COLOR[id]}} />
    </svg>
  );
}};
'''
    (ROOT / "src" / "Logos.tsx").write_text(out)
    print(f"Logos.tsx: {len(ids)} marcas -> {', '.join(ids)}")


if __name__ == "__main__":
    main()
