# Después de las 5 PM — reel vertical (Remotion)

Vídeo de 32 s, 1080×1920 a 30 fps, para TikTok, Reels y Shorts. Ilustración pictórica separada en capas,
cámara 2.5D con parallax, captions palabra por palabra y audio sintetizado.

## Entregables (`out/`)

| Archivo | Qué es |
|---|---|
| `despues-de-las-5pm-con-voz.mp4` | Con la voz guía de ElevenLabs (temporal) |
| `despues-de-las-5pm-sin-voz.mp4` | Solo música y efectos, para montar tu voz |
| `despues-de-las-5pm-portada.png` | Portada (el último fotograma) |
| `hoja-de-contacto.jpg` | Un fotograma cada 0,5 s con las zonas seguras marcadas |

## Cómo se usa

```bash
npm install
npm run dev                                           # Remotion Studio
npx remotion render ConVoz out/despues-de-las-5pm-con-voz.mp4
npx remotion render SinVoz out/despues-de-las-5pm-sin-voz.mp4
npx remotion still Portada out/despues-de-las-5pm-portada.png
```

En la nube de Claude Code, `remotion.config.ts` usa el headless shell de Playwright. En tu equipo Remotion
descarga su propio navegador.

## Dónde está cada cosa

- `src/contenido.ts`: **todo el texto** (captions con sus tiempos, tarjetas del feed, notificaciones,
  los 5 pasos, la portada del ebook y el handle).
- `src/tiempos.ts`: los golpes del vídeo (rejilla de 80 BPM) y las tomas de cámara.
- `src/componentes/Cuarto.tsx`: la escena por capas (pared y ventana, mesa, personaje, laptop con tapa
  articulada, taza, celular, lámpara con halo y reloj) y el parallax.
- `src/beats/`: los cinco beats (gancho, celular, gráfica, plan y CTA).
- `scripts/audio.py`: música, efectos y colocación de la voz. `scripts/normaliza.sh`: −14 LUFS.
- `scripts/palabras.py`: tiempos palabra por palabra con Whisper.
- `scripts/prepara_arte.py`: convierte las capas originales en los assets de `public/arte/`.
- `scripts/fotos.mjs` y `scripts/hoja.py`: fotogramas sueltos y hoja de contacto para control de calidad.
- `AUDIO-LICENCIAS.md`: fuente y licencia de cada audio.

## Cambiar la voz guía por tu grabación

1. Exporta tu voz en WAV mono a 48 kHz.
2. Saca los tiempos: `uv run --with faster-whisper python scripts/palabras.py tu_voz.wav work/vo/tu_voz.json`.
3. En `scripts/audio.py`, ajusta `SEGS` (inicio y fin de cada frase en tu grabación, y dónde va en el vídeo)
   y ejecútalo: `python3 scripts/audio.py tu_voz.wav work/vo/tu_voz.json`.
4. `scripts/normaliza.sh work/audio/con_voz_raw.wav public/audio/con_voz.wav`.
5. Copia los tiempos nuevos de `src/data/voz.json` a los captions de `src/contenido.ts` y renderiza.

Lo más cómodo es grabar siguiendo el ritmo de la versión con voz guía: así los golpes (corte en «agotado»,
sello «1 HORA», etc.) siguen cayendo en su sitio sin tocar `src/tiempos.ts`.

## Contenido provisional que debes revisar

- **Los 5 pasos del checklist** (`PASOS` en `src/contenido.ts`): los escribí yo, no salen del ebook.
- **La portada del ebook**: es tipográfica, hecha en código. Si tienes la real, pon el archivo en `public/`
  y escribe su nombre en `EBOOK.portadaReal`.

## Episodio 2 · «hora 2: elige una sola cosa» (20,5 s)

Segundo capítulo de la serie. Reutiliza el cuarto y añade tres poses del mismo personaje
(`public/arte/pose_*.webp`: mirando, agobiado, aliviado), que solo cambian en cortes de cámara.

- Código: `src/ep2/Episodio2.tsx`; texto y tiempos: `src/ep2/contenido.ts`.
- Audio: `scripts/audio_ep2.py` (usa `scripts/sinte.py`).
- Render: `npx remotion render Ep2ConVoz out/ep2/hora-2-con-voz.mp4` (también `Ep2SinVoz` y el still `Ep2Portada`).
- Fotogramas sueltos: `COMP=Ep2ConVoz node scripts/fotos.mjs carpeta 3.2 8.3`.
- **Provisional**: el paso 1 («elige una sola cosa») y el ejemplo de la nota los escribí yo, no salen del ebook.
