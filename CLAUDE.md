# Memoria del proyecto

## Quién es el usuario

- **Pablo Hernández**. Instagram: **@soypablo.ai**.
  Usa siempre `@soypablo.ai` como firma, handle, marca de agua y CTA en reels, portadas
  y perfiles (`perfil.json`, `*.config.json`). No uses `@pablohernandez.ai`: no es su
  cuenta de Instagram.
- Escribe en español; responde en español.

## Dónde está cada cosa

- `.claude/skills/reel-edicion/`: skill para montar reels con su marca (perfil.json + ESTILO.md).
- `.claude/skills/reel-referencia/`: skill para editar copiando el estilo de un vídeo de referencia
  (estilos guardados en `estilos/`, plantilla Remotion en `plantilla/`).
- `.claude/skills/kinetic-reel-edit/`: estilo fijo «spotlight + tipografía cinética» con Python + ffmpeg (sin Remotion).
- `.claude/skills/brag/` y `.claude/skills/brag-slim/`: `/brag`, convierte un proyecto o una web en un vídeo
  de lanzamiento de ~20 s con música y texto para compartir (de github.com/latent-spaces/brag, MIT; música
  CC BY 4.0 de Sascha Ende, SFX CC0 de Kenney). En Opus 5.5, `/brag` pasa a `brag-slim` salvo con `--full`.
- `valto-explicativo/`: vídeo explicativo de GetValto.ai (59 s, vertical y horizontal) con su guion (`guion.md`),
  subtítulos `.srt` y la composición re-renderizable en `src/` (HTML + scripts de audio y render).
- `brag-output/`: reel de 15 s de Valto hecho con `/brag`.
- Coolvetica tiene licencia de escritorio: nunca se sube al repo (solo su ruta local).

## Moodboards de vídeo

- **Azul, sacado de la referencia** (lienzo claro, azul #0050FB, Inter Tight + Instrument Serif):
  https://claude.ai/artifact/6FozXnemGjg8j7WSEcnJ4P — su estilo.md es
  `.claude/skills/reel-referencia/estilos/ejemplo-referencia.md`.
- **Lavanda, el primero** (lavanda #C9B8FF, violeta #6A4DF0, Coolvetica):
  https://claude.ai/artifact/Mz2y1wfY1rrbkaeZWfqJQU — usado por la skill reel-edicion.
