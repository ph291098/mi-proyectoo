"""Lee el perfil del creador (lo escribe el cuestionario de la skill).

Orden: $REEL_PERFIL → ./perfil.json del proyecto → ~/.config/reel-edicion/perfil.json.
Sin perfil todo funciona con valores neutros.
"""
import json, os, pathlib

def carga():
    for p in (os.environ.get("REEL_PERFIL"),
              pathlib.Path(__file__).resolve().parent.parent / "perfil.json",
              pathlib.Path.home() / ".config" / "reel-edicion" / "perfil.json"):
        if p and pathlib.Path(p).exists():
            return json.loads(pathlib.Path(p).read_text())
    return {}

def ruta(clave, defecto):
    """Ruta de la biblioteca de audio: perfil.audio.<clave> o el valor por defecto.
    Solo cuenta si es texto: `audio.musica`/`audio.efectos` del cuestionario son booleanos."""
    v = carga().get("audio", {}).get(clave)
    v = v if isinstance(v, str) and v else defecto
    return pathlib.Path(os.path.expanduser(v))

BIBLIOTECA = ruta("biblioteca", "~/ReelKit")
KIT = ruta("sfx", str(BIBLIOTECA / "sfx"))           # kit de efectos compartido entre piezas
MUSICA = ruta("musica", str(BIBLIOTECA / "musica"))  # tus pistas de música (CC0 o con licencia)
