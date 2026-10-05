import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { type Caption } from "@remotion/captions";
import { COLORS, DZ, WIDTH, CAPTIONS } from "./theme";
import { fontFamily } from "./fonts";


type Range = [number, number];
type Page = { startMs: number; endMs: number; tokens: Caption[] };

/** Ventanas mínimas/máximas de lectura de una página de subtítulo. */
const MIN_PAGE_MS = 950;
const MAX_PAGE_MS = 2200;
const MERGE_LIMIT = 5;
/** El resalte necesita durar algo o estrobea en las palabras cortas. */
const MIN_ACTIVE_MS = 150;
/** La página entra ENTERA y rápido. Ver nota larga abajo. */
const PAGE_IN_MS = 120;
/** Cruce con las tarjetas: los subtítulos se apagan y encienden con rampa. */
const CROSS_MS = 160;

const paginate = (caps: Caption[], maxWords: number, maxGapMs = 950): Page[] => {
  const pages: Page[] = [];
  let cur: Caption[] = [];
  const push = () => {
    if (cur.length) pages.push({ startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs, tokens: cur });
  };
  for (const c of caps) {
    if (cur.length && (cur.length >= maxWords || c.startMs - cur[cur.length - 1].endMs > maxGapMs)) {
      push();
      cur = [];
    }
    cur.push(c);
  }
  push();

  // Whisper comprime rachas: llega a meter 6 palabras en 0.18s. Esa página
  // parpadearía, así que se FUSIONA con la vecina en vez de mostrarse suelta.
  const merged: Page[] = [];
  for (const pg of pages) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      pg.startMs - prev.startMs < MIN_PAGE_MS &&
      prev.tokens.length + pg.tokens.length <= MERGE_LIMIT
    ) {
      prev.tokens = prev.tokens.concat(pg.tokens);
      prev.endMs = pg.endMs;
      continue;
    }
    merged.push({ ...pg, tokens: [...pg.tokens] });
  }

  // Contiguas pero con techo: si la siguiente tarda, la página se retira en vez
  // de quedarse colgada segundos después de que la frase terminó.
  for (let i = 0; i < merged.length; i++) {
    const next = merged[i + 1];
    const natural = next ? next.startMs : merged[i].endMs + MIN_PAGE_MS;
    merged[i].endMs = Math.min(natural, merged[i].startMs + MAX_PAGE_MS);
  }
  return merged;
};

const baseShadow = "0 4px 18px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.4)";

/**
 * POR QUÉ LA PALABRA NO ENTRA SOLA
 *
 * La versión anterior hacía aparecer cada palabra con su propio muelle
 * (opacidad 0→1 en ~0.30s). Medido sobre este mismo transcript:
 *
 *   páginas 85 · mediana 0.86s · 55 de 85 por debajo de 1s
 *   palabras: mediana 0.18s · 149 de 342 duran menos de 0.15s
 *   → 90.2s de 195.9s de tiempo-palabra con la palabra aún entrando
 *
 * O sea: el 46% del tiempo el subtítulo estaba a medio aparecer. La entrada
 * palabra por palabra está peleada con la velocidad del habla.
 *
 * Ahora la página aparece ENTERA en 0.12s y lo único que sigue a la voz es el
 * resalte. Se lee siempre, y además deja leer por delante, que es lo que
 * retiene. El movimiento no se pierde: cada palabra conserva un desplazamiento
 * escalonado, pero en TRANSFORMADA, nunca en opacidad.
 */
const Word: React.FC<{ tok: Caption; nowMs: number; pageStartMs: number; size: number; i: number; accent: string; gap: number }> =
  ({ tok, nowMs, pageStartMs, size, i, accent, gap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = ((pageStartMs + i * 26) / 1000) * fps;
  const p = spring({ frame: frame - enter, fps, config: { damping: 20, mass: 0.4, stiffness: 250 } });
  const y = interpolate(p, [0, 1], [14, 0]);
  // opacidad NUNCA se anima: en este reel hay páginas de 0.34s y cualquier
  // fundido deja la palabra ilegible justo cuando se está diciendo.

  const active = nowMs >= tok.startMs && nowMs < Math.max(tok.endMs, tok.startMs + MIN_ACTIVE_MS);
  const ap = spring({ frame: frame - (tok.startMs / 1000) * fps, fps, config: { damping: 14, mass: 0.45, stiffness: 220 } });
  const activeScale = active ? interpolate(ap, [0, 1], [1, 1.09]) : 1;

  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${y}px) scale(${activeScale})`,
        color: active ? accent : COLORS.soft,
        margin: `0 ${gap}px`,
        WebkitTextStroke: "2px rgba(0,0,0,0.4)",
        paintOrder: "stroke fill",
        textShadow: active ? `${baseShadow}, 0 0 26px ${accent}77` : baseShadow,
        fontSize: size,
      }}
    >
      {tok.text}
    </span>
  );
};

/** Rampa de presencia: 1 normalmente, 0 dentro de un tramo `hide`.
 *
 *  La rampa va POR DENTRO del tramo, no por fuera. La tarjeta empieza a entrar
 *  en `a` y tarda ~0.25s en abrirse; si los subtítulos se apagaran antes de `a`
 *  quedaría pantalla vacía entre medias — que es justo lo que pasaba. Así los
 *  dos se cruzan: uno se va mientras el otro llega. */
const presence = (nowMs: number, hide: Range[]): number => {
  let p = 1;
  for (const [a, b] of hide) {
    if (nowMs < a || nowMs >= b) continue;
    const cross = Math.min(CROSS_MS, (b - a) / 2);
    if (nowMs < a + cross) p = Math.min(p, 1 - (nowMs - a) / cross);        // se va con la tarjeta entrando
    else if (nowMs >= b - cross) p = Math.min(p, (nowMs - (b - cross)) / cross); // vuelve con la tarjeta saliendo
    else return 0;
  }
  return p;
};

export const Captions: React.FC<{
  captions: Caption[];
  cy?: number;
  band?: boolean;
  maxWords?: number;
  size?: number;
  show?: Range[];
  hide?: Range[];
  /** color del resalte: por defecto oro, pero el montaje le pasa el color de la
   *  marca de la que se está hablando en ese tramo */
  accent?: string;
}> = ({ captions, cy = 1120, band = false, maxWords = 3, size = 92, show, hide = [], accent = COLORS.highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = React.useMemo(() => paginate(captions, maxWords), [captions, maxWords]);
  const nowMs = (frame / fps) * 1000;

  if (show && !show.some(([a, b]) => nowMs >= a && nowMs < b)) return null;
  const vis = presence(nowMs, hide);
  if (vis <= 0) return null;
  const page = pages.find((pg) => nowMs >= pg.startMs && nowMs < pg.endMs);
  if (!page) return null;

  // La caja NO se funde en cada cambio: las páginas son contiguas, así que está
  // presente de forma continua. Lo único que la apaga es una tarjeta (`vis`).
  // Antes se fundía con la página y dejaba un recuadro vacío 85 veces.
  // SEPARACIÓN ENTRE PALABRAS — no puede ser fija.
  // El resalte escala la palabra activa a 1.09 desde su centro, así que crece
  // hacia los lados la mitad de ese 9%: una palabra ancha invade al vecino.
  // Con margen fijo de 10 px salían pegadas ("A BLENDER. LE" -> "ABLENDER.LE",
  // "CON DESARROLLO" -> "CONDESARROLLO") y solo en las largas, que es lo que
  // hacía difícil de ver el fallo. El ancho se estima a partir del número de
  // caracteres (una sans a peso 800 en mayúsculas ronda 0.58em por carácter), y el
  // margen se calcula UNA VEZ POR PÁGINA con la palabra más larga: si se
  // calculara por palabra, el espaciado del bloque bailaría de una a otra.
  const maxLen = Math.max(...page.tokens.map((t) => t.text.length));
  const gap = Math.min(30, Math.round((size > 70 ? 14 : 10) + Math.min(maxLen, 11) * size * 0.026));

  const pf = spring({ frame: frame - (page.startMs / 1000) * fps, fps,
                      config: { damping: 20, mass: 0.4, stiffness: 250 } });
  const a = vis;
  const blockY = interpolate(pf, [0, 1], [8, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: DZ.right,
        width: WIDTH - DZ.right * 2,
        top: cy - (band ? 70 : 200),
        height: band ? 140 : 400,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        transform: `translateY(${blockY}px)`,
        opacity: a,
        fontFamily,
        fontWeight: 800,
        lineHeight: 1.02,
        letterSpacing: "-0.02em",
        textAlign: "center",
        textTransform: CAPTIONS.upper ? "uppercase" : "none",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          padding: band ? "16px 34px" : 0,
          minWidth: band ? 560 : undefined,
          borderRadius: band ? 20 : 0,
          background: band ? `rgba(10,8,6,${0.66 * a})` : "transparent",
          backdropFilter: band ? "blur(10px)" : undefined,
          border: band ? `1px solid rgba(140,130,114,${0.4 * a})` : undefined,
          boxShadow: band ? `0 12px 40px -14px rgba(0,0,0,${0.75 * a})` : undefined,
        }}
      >
        {page.tokens.map((t, i) => (
          <Word key={`${page.startMs}-${i}`} nowMs={nowMs} tok={t} pageStartMs={page.startMs}
                size={size} i={i} accent={accent} gap={gap} />
        ))}
      </div>
    </div>
  );
};
