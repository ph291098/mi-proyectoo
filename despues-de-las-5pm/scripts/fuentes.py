"""Genera src/data/fuentes.json: las tipografías en base64 para incrustarlas en el bundle.
Uso: python3 scripts/fuentes.py
"""
import base64, json
FUENTES = [
    ("Playfair Display", "playfair-display-latin-700-italic.woff2", "700", "italic"),
    ("Playfair Display", "playfair-display-latin-900-italic.woff2", "900", "italic"),
    ("Inter", "inter-latin-600-normal.woff2", "600", "normal"),
    ("Inter", "inter-latin-800-normal.woff2", "800", "normal"),
    ("Inter", "inter-latin-900-normal.woff2", "900", "normal"),
    ("Caveat", "caveat-latin-700-normal.woff2", "700", "normal"),     # letra a mano de la nota (OFL)
]
json.dump([{"family": f, "weight": w, "style": s, "b64": base64.b64encode(open(f"public/fonts/{a}", "rb").read()).decode()} for f, a, w, s in FUENTES],
          open("src/data/fuentes.json", "w"))
print("ok", len(FUENTES), "fuentes")
