# Valto · vídeo explicativo (59,4 s)

Motion graphics 2D plano para GetValto.ai. Fondo #0d0f14, verde WhatsApp #25D366, ámbar #FFB547
para CTA y destacados, tipografía Nunito (redondeada, gruesa) y JetBrains Mono para lo secundario.
Dos formatos con la misma animación: vertical 1080×1920 y horizontal 1920×1080, 30 fps.

| # | Tiempo | Escena | Texto en pantalla | Voz en off |
|---|---|---|---|---|
| 1 | 0:00–0:04,8 | Gancho: teléfono de noche (11:47 PM), cuatro WhatsApp sin responder | Tu negocio cierra. Tu agente, no. | Tu negocio cierra. Tu agente, no. |
| 2 | 0:04,8–0:09,6 | Problema: preguntas de clientes, «Visto», reloj acelerado hasta las 7:05 AM | Preguntas. Pedidos. Citas. Todo el día. | Cada mensaje sin responder es una venta que se enfría. |
| 3 | 0:09,6–0:19,2 | Solución: logo, burbuja de chat con Vera y lo que hace | Valto: tu agente de IA que responde y vende por ti. | Valto es un agente de inteligencia artificial que contesta, agenda, cotiza y toma pedidos, las 24 horas, en WhatsApp y en tu web. |
| 4 | 0:19,2–0:27,6 | Paso 1: se escribe la URL, se escanea la web y los datos entran en Valto | 1. Conecta tu negocio | Uno: conecta tu negocio. Tu web, catálogo o Google Sheet. Valto aprende tus precios y horarios en minutos. |
| 5 | 0:27,6–0:37,2 | Paso 2: cuatro tarjetas y un cursor que activa cada interruptor | 2. Elige qué hace tu agente | Dos: elige qué hace tu agente. Agenda citas sin duplicar horarios, cobra con tus precios reales, cotiza al instante. |
| 6 | 0:37,2–0:43,2 | Paso 3: Valto se enlaza con WhatsApp Business; chat embebido en una web | 3. Conecta WhatsApp o el chat de tu web | Tres: conecta WhatsApp o el chat de tu web. Listo para atender en minutos. |
| 7 | 0:43,2–0:50,4 | Demo: conversación de WhatsApp; la cita confirmada vuela al panel (Citas 2 → 3) | Tu agente, en acción. | Mientras tú trabajas, tu agente cierra la venta y te deja todo anotado. |
| 8 | 0:50,4–0:59,4 | Cierre: el teléfono de día (8:05 AM) con 3 citas, 2 pedidos y 1 cotización; logo y CTA | Por la mañana, solo revisas. → getvalto.ai — Demo gratis | Valto. Tu negocio cierra. Tu agente, no. Prueba la demo gratis, sin tarjeta, en getvalto.ai |

## Audio
- **Voz:** ElevenLabs, voz «ALE ALEJANDRO - Your Friendly Pal» (español latino neutro), modelo eleven_v4.
  Una toma por escena en `src/vo/`.
- **Música:** original, generada por `src/scripts/audio.py`. 100 BPM en do mayor; sube en la escena 3 y en la 7,
  y baja 6,5 dB cuando habla la voz.
- **Efectos:** pop en cada burbuja, aviso de dos notas en cada mensaje entrante, swoosh en los cambios de escena,
  clic en los interruptores. Todos en la tonalidad de la música.
- **Mezcla final:** −14 LUFS, pico real por debajo de −1,5 dBTP.

## Cómo volver a renderizar
```bash
python3 src/scripts/audio.py <carpeta con escena1..8.wav a 48 kHz mono> mezcla.wav
src/scripts/build.sh <carpeta de trabajo> mezcla.wav <carpeta de salida>
```
`src/index.html?fmt=v` (o `fmt=h`) es la composición: `window.render(t)` pinta el fotograma del segundo `t`.
