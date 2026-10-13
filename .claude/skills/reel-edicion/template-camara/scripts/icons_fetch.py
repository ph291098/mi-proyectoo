#!/usr/bin/env python3
"""Baja iconos de Lucide (ISC) y los vuelca a src/Icons.ts como markup inline.

Los diagramas de proceso (Flow.tsx) usan iconos de trazo para los pasos que NO son
marcas: reloj, base de datos, ticket, rama, tests, campana… Las marcas siguen saliendo
de Simple Icons (ver Logos.tsx); esto es para conceptos.

USO
  python3 scripts/icons_fetch.py clock database bell git-branch      # añade a los que ya hay
  python3 scripts/icons_fetch.py --list                              # qué hay en public/icons

Nombres: los de https://lucide.dev/icons (kebab-case). Los SVG quedan en public/icons/
por si hay que auditarlos; src/Icons.ts se regenera entero a partir de esa carpeta.
"""
import pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
OUT = ROOT / "src" / "Icons.ts"
CDN = "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/{}.svg"


def fetch(name: str) -> bool:
    dst = ICONS / f"{name}.svg"
    if dst.exists():
        return True
    try:
        with urllib.request.urlopen(CDN.format(name), timeout=20) as r:
            dst.write_bytes(r.read())
        return True
    except Exception as e:  # noqa: BLE001
        print(f"  !! {name}: {e}")
        return False


def regenerate() -> int:
    out = ["// generado por scripts/icons_fetch.py desde public/icons/*.svg (Lucide, ISC).",
           "// Trazos de 24x24 sin relleno; se pintan con stroke=currentColor para colorearlos por nodo.",
           "export const ICONS: Record<string, string> = {"]
    n = 0
    for p in sorted(ICONS.glob("*.svg")):
        inner = re.search(r"<svg[^>]*>(.*)</svg>", p.read_text(), re.S).group(1)
        inner = re.sub(r"<!--.*?-->", "", inner, flags=re.S)
        inner = re.sub(r"\s+", " ", inner).strip()
        out.append(f'  "{p.stem}": `{inner}`,')
        n += 1
    out += ["};", "export type IconId = keyof typeof ICONS;", ""]
    OUT.write_text("\n".join(out))
    return n


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    args = sys.argv[1:]
    if args == ["--list"]:
        for p in sorted(ICONS.glob("*.svg")):
            print(p.stem)
        return
    for name in args:
        fetch(name)
    print(f"{regenerate()} iconos -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
