# Audio: fuentes y licencias

Resumen: **no hay música ni efectos de terceros**. Todo lo que suena, salvo la voz guía, lo sintetiza
`scripts/audio.py` con numpy (osciladores, ruido filtrado y una reverb por convolución con ruido).
No se usa ningún sample, loop ni librería de sonidos, así que no hay licencias que atribuir ni
reclamaciones de copyright posibles sobre la música o los efectos.

## Voz

| Qué | Fuente | Licencia y notas |
|---|---|---|
| Voz guía (`work/vo/toma_b.mp3`, incluida en `public/audio/con_voz.wav`) | ElevenLabs, voz de biblioteca «Axel - Voz Cálida» (id `rV64CW2okYlmW90kuqhp`), modelo `eleven_v4`, generada con tu cuenta | **Es temporal**: la versión final la grabas tú. Si llegaras a publicarla, el uso comercial depende de tu plan de ElevenLabs (los planes de pago lo incluyen; el gratuito no). No lo he verificado. |

La versión `sin-voz` no contiene voz: es la que debes usar para montar tu grabación.

## Música

| Qué | Fuente | Licencia |
|---|---|---|
| Base lo-fi a 80 BPM en re menor (piano eléctrico, pad, bajo, bombo, caja, hi-hat, melodía de pluck, ruido de vinilo) | Sintetizada en `scripts/audio.py` | Obra original generada para este vídeo. Es tuya; sin restricciones. |

## Efectos de sonido

Todos sintetizados en `scripts/audio.py`. Tiempos en segundos del vídeo.

| Efecto | Dónde | Cómo está hecho |
|---|---|---|
| Tic-tac del reloj | 0,00 – 2,63 (cada corchea) | Seno corto + ruido filtrado |
| Golpe grave en «agotado» | 1,50 | Seno con barrido descendente (boom) + golpe de ruido grave |
| Campanada de las 5:00 | 3,00 | Dos campanas (senos con parciales) con reverb |
| Aviso del celular en la mesa | 5,25 | Dos notas de campana |
| Whoosh del whip al celular | 5,67 – 6,00 | Ruido filtrado con envolvente |
| Whoosh de scroll | 7,15 · 8,30 · 9,95 · 11,10 | Ruido filtrado corto |
| Pop de cada tarjeta | 8,64 · 10,26 · 11,44 | Seno con barrido ascendente |
| Pings de notificación (12) | 9,00 – 14,06, cada vez más juntos | Dos notas de campana por ping, en la escala de la música |
| Golpe en «tarde» | 14,25 | Boom + golpe de ruido grave |
| Tics del contador de energía | 15,30 – 18,24 | Tics que bajan de tono |
| Riser hacia el sello | 16,45 – 18,75 | Ruido + dos senos que suben de tono |
| Bass hit del sello «1 HORA» | 18,75 | Boom largo + golpe + clic |
| Clic de la laptop | 20,40 y 20,52 | Seno corto + ruido agudo |
| Aire al abrirse la laptop | 20,40 – 21,30 | Ruido filtrado suave |
| Pop + campanita por paso del checklist | 22,90 · 23,40 · 23,90 · 24,40 · 24,90 | Seno con barrido + campana, subiendo de nota |
| Golpe al aparecer la portada | 25,50 | Boom |
| Shimmer y barrido de luz | 25,70 – 27,40 | Campanitas agudas aleatorias + ruido agudo |
| Pops de texto | 27,95 y 29,80 | Seno con barrido |
| Golpe final | 30,00 | Boom + acorde de campanas con reverb |

## Mezcla

- La música baja unos 6 dB cuando habla la voz (sidechain calculado a partir de la envolvente de la voz).
- La versión sin voz no tiene sidechain y lleva la música algo más arriba.
- Las dos mezclas se normalizan a **−14 LUFS integrados** con `scripts/normaliza.sh` (ffmpeg `ebur128`).

## Lo que no es audio

- Tipografías: Playfair Display e Inter, ambas con licencia SIL Open Font License 1.1 (se pueden usar y
  distribuir, también comercialmente).
- Ilustración: generada con Higgsfield (GPT Image 2.6) desde tu cuenta. Revisa los términos de tu plan
  para uso comercial.
