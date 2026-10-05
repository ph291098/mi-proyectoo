#!/usr/bin/env python3
"""Busca candidatos CC0 en Freesound para cada hueco del kit.

Solo BUSCA e imprime: la elección es humana. `sfx_fetch.py` es el que descarga
los ids que se hayan elegido.
"""
import json, os, sys, urllib.parse, urllib.request

KEY = os.environ["FREESOUND_API_KEY"]
API = "https://freesound.org/apiv2/search/text/"

def search(query, dmin, dmax, n=6):
    q = urllib.parse.urlencode({
        "query": query,
        # CC0: sin atribución, sin riesgo de reclamación en Reels/TikTok
        "filter": f'license:"Creative Commons 0" duration:[{dmin} TO {dmax}]',
        "fields": "id,name,duration,avg_rating,num_ratings,previews,tags",
        "sort": "rating_desc",
        "page_size": n,
    })
    req = urllib.request.Request(f"{API}?{q}", headers={"Authorization": f"Token {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r).get("results", [])

# (hueco del kit, qué debe transmitir, consulta, duración mín/máx)
SLOTS = [
    ("impact",    "esto va en serio",        "cinematic impact hit deep",      0.3, 2.5),
    ("hit",       "choque, el VS",           "metal hit stinger short",        0.1, 1.2),
    ("whoosh_in", "algo entra, orden",       "whoosh transition swoosh",       0.2, 1.2),
    ("whoosh_out","soltar",                  "reverse whoosh soft",            0.2, 1.5),
    ("tick",      "precisión, control",      "ui click tick interface",        0.05, 0.5),
    ("riser",     "ahora escucha",           "riser tension build short",      0.5, 2.5),
    ("sub_drop",  "énfasis grave",           "sub bass drop boom low",         0.3, 2.0),
    ("notify_a",  "te llega (Telegram)",     "notification message pop",       0.2, 1.5),
    ("notify_b",  "te llega (Slack)",        "notification alert chime short", 0.2, 1.5),
    ("notify_c",  "te llega (Discord)",      "notification ding blip",         0.2, 1.5),
    ("chime",     "invitación, CTA",         "positive chime bell ascending",  0.3, 2.0),
    ("close",     "resolución",              "impact tail reverb cinematic",   1.0, 4.0),
]

out = {}
for slot, feel, query, a, b in SLOTS:
    try:
        res = search(query, a, b)
    except Exception as e:
        print(f"!! {slot}: {e}"); continue
    out[slot] = res
    print(f"\n=== {slot}  ({feel})  · '{query}'  {a}-{b}s")
    if not res:
        print("   sin resultados CC0")
    for r in res:
        rating = f"{r['avg_rating']:.1f}/{r['num_ratings']}" if r.get("num_ratings") else "-"
        tags = ",".join(r.get("tags", [])[:5])
        print(f"   {r['id']:>8}  {r['duration']:5.2f}s  rating {rating:>8}  {r['name'][:44]:<44} [{tags}]")

json.dump(out, open("work/sfx_candidates.json", "w"))
print("\ncandidatos -> work/sfx_candidates.json")
