import React from "react";
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { WIDTH, HEIGHT, COLORS, SPLIT_Y, INK_RGB } from "./theme";
import { at, mix, SPR } from "./anim";

/** Un tramo de encuadre. La fuente ya es vertical, así que aquí no se recorta a
 *  otra forma: solo se acerca. `scale` 1 = plano tal cual; `x`/`y` desplazan el
 *  centro del zoom en px del cuadro final. */
export type Span = { start: number; end: number; scale?: number; x?: number; y?: number };

const geom = (s: Span) => ({ k: s.scale ?? 1, x: s.x ?? 0, y: s.y ?? 0 });

/** Envolvente de golpe: sube en 0.06s y decae en 0.28s. Es lo que sustituye al
 *  lavado de color a pantalla completa, que se leía como un fallo de render y
 *  además quemaba la exposición. Un corte se siente en el MOVIMIENTO, no en un
 *  destello de color. */
const impulse = (t: number, times: number[]): number => {
  const hit = times.find((x) => t >= x - 0.02 && t < x + 0.28);
  if (hit === undefined) return 0;
  const d = t - hit;
  return d < 0.06
    ? interpolate(d, [-0.02, 0.06], [0, 1], { extrapolateLeft: "clamp" })
    : interpolate(d, [0.06, 0.28], [1, 0], { extrapolateRight: "clamp" });
};

export const Plate: React.FC<{ src: string; spans: Span[]; punches?: number[] }> =
  ({ src, spans, punches = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const i = Math.max(0, spans.findIndex((s) => t < s.end));
  const cur = spans[i] ?? spans[spans.length - 1];
  const prev = spans[i - 1];
  let g = geom(cur);
  if (prev) {
    // El punch-in NO es una rampa lineal: entra con muelle y asienta. Se nota
    // como un movimiento de cámara, no como un zoom de software.
    const p = at(frame, fps, cur.start, SPR.soft);
    const b = geom(prev);
    g = { k: mix(p, b.k, g.k), x: mix(p, b.x, g.x), y: mix(p, b.y, g.y) };
  }

  // Golpe transitorio encima del encuadre: empuja, desenfoca un pelo y levanta
  // brillo. Sin tinte de color.
  const e = impulse(t, punches);

  return (
    <div style={{ position: "absolute", inset: 0, background: COLORS.ink, overflow: "hidden" }}>
      <OffthreadVideo
        // REMOTION_MUTE_VIDEO=1 (scripts/mide_sfx.sh) deja solo la capa de efectos y
        // música: es la única forma de medir a qué nivel suenan sin la voz encima.
        muted={process.env.REMOTION_MUTE_VIDEO === "1"}
        src={staticFile(src)}
        style={{
          position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT,
          transform: `translate(${-g.x}px, ${-g.y}px) scale(${g.k * (1 + 0.05 * e)})`,
          transformOrigin: "50% 42%",   // el zoom crece alrededor de la cara, no del centro geométrico
          filter: e > 0.01 ? `blur(${2.6 * e}px) brightness(${1 + 0.1 * e})` : "none",
        }}
      />
    </div>
  );
};

/** Degradados de legibilidad: el plano es una habitación oscura pero con luces
 *  azules detrás; sin esto el título y los subtítulos pierden borde según el
 *  fotograma. Es un scrim, no un viñeteado de estilo.
 *
 *  Con `split` (tramos en segundos, de scripts/layout.py) el scrim cambia EN EL
 *  TIEMPO: mientras hay pantalla dividida el degradado de arriba está prohibido
 *  (oscurecería la captura) y aparece una junta tenue bajo SPLIT_Y que asienta los
 *  subtítulos de la costura; a cámara completa esa junta caería sobre la barba, así
 *  que se funde fuera en 0.2 s y vuelve el scrim de siempre. */
export const Scrim: React.FC<{ split?: Array<[number, number]> }> = ({ split = [] }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = frame / fps;
  // k: 1 en pantalla dividida, 0 a cámara completa, rampa de 0.2 s en cada cambio
  // (sin rampa de entrada si el split arranca en el primer fotograma)
  let k = 0;
  for (const [a, b] of split) {
    if (t >= a && t < b) k = Math.min(1, a === 0 ? 1 : (t - a) / 0.2, (b - t) / 0.2);
  }
  const y = (SPLIT_Y / HEIGHT) * 100;
  const top = (0.30 * (1 - k)).toFixed(3), j = (0.34 * k).toFixed(3);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background:
      `linear-gradient(to bottom, rgba(${INK_RGB},${top}) 0%, rgba(${INK_RGB},0) 20%, rgba(${INK_RGB},0) ${(y - 0.2).toFixed(1)}%,`
      + ` rgba(${INK_RGB},${j}) ${(y + 0.6).toFixed(1)}%, rgba(${INK_RGB},${j}) ${(y + 6).toFixed(1)}%, rgba(${INK_RGB},0) ${(y + 10).toFixed(1)}%,`
      + ` rgba(${INK_RGB},0) 60%, rgba(${INK_RGB},0.30) 78%, rgba(${INK_RGB},0.42) 100%)` }} />
  );
};
