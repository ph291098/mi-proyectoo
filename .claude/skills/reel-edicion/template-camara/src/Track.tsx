import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, SAFE, FEED_CROP, INK_RGB } from "./theme";
import { Logo, LOGO_COLOR, type LogoId } from "./Logos";
import { at, outAt, mix, SPR } from "./anim";
import { fontFamily } from "./fonts";


/** Etiqueta ANCLADA a una zona del plano, que la sigue mientras la cámara se mueve.
 *
 *  En un recorrido por un espacio o un equipo, la tarjeta no flota en una
 *  banda fija tapando lo que se ha venido a ver, sino que señala el aparato del que está hablando y
 *  se mueve con él. Un retículo marca el punto, una guía se dibuja hasta la
 *  etiqueta, y la etiqueta vive en el hueco que le queda al lado.
 *
 *  Los fotogramas clave los produce `scripts/rastrea.py`, que estima el movimiento
 *  global de la cámara (el objeto no se mueve) y arrastra el punto con él. Un tramo
 *  NUNCA cruza un corte de plano: el punto saltaría.
 *
 *  `bounds` limita dónde puede caer la etiqueta. Se calcula fuera, contra la pista
 *  de caras, para que no aterrice encima de él en ningún fotograma. */
export type TrackKey = { t: number; x: number; y: number; s: number };
export type TrackData = {
  t: "track"; start: number; end: number;
  keys: TrackKey[];
  label: string;
  sub?: string;
  logo?: LogoId;
  n?: number;
  side?: "left" | "right" | "above" | "below";
  gap?: number;
  bounds?: [number, number, number, number];
};

const CHIP_W = 640;
const RETICULO = 62;          // radio base; se escala con la cámara

/** Interpola el punto seguido. Las claves van cada 2 fotogramas: lineal es
 *  suficiente y evita el rebote que daría un spline sobre ruido de estimación. */
const puntoEn = (keys: TrackKey[], t: number): TrackKey => {
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  let i = 1;
  while (i < keys.length && keys[i].t < t) i++;
  const a = keys[i - 1], b = keys[i];
  const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return { t, x: mix(u, a.x, b.x), y: mix(u, a.y, b.y), s: mix(u, a.s, b.s) };
};

export const Track: React.FC<{ data: TrackData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < data.start || t >= data.end || !data.keys?.length) return null;

  const inP  = at(frame, fps, data.start, SPR.snap);
  const outP = outAt(t, data.end, 0.30);
  const p    = Math.min(inP, outP);
  const linea = at(frame, fps, data.start + 0.16, SPR.soft);
  const chipP = at(frame, fps, data.start + 0.26, SPR.snap);

  const k = puntoEn(data.keys, t);
  const r = RETICULO * Math.max(0.75, Math.min(1.6, k.s));

  // el anillo respira: un latido lento basta para que se lea como "esto de aquí"
  const late = 1 + 0.05 * Math.sin(((t - data.start) * Math.PI * 2) / 1.9);
  const giro = (t - data.start) * 26;

  const side = data.side ?? "right";
  const gap  = data.gap ?? 46;

  // Posición cruda de la etiqueta y recorte a la zona permitida. El recorte es lo
  // que garantiza que nunca aterrice sobre la cara ni fuera de la zona segura.
  const alto = data.sub ? 156 : 108;
  const [bx0, by0, bx1, by1] = data.bounds ?? [SAFE.x0, FEED_CROP.y0, SAFE.x1, SAFE.y1];
  let lx = k.x, ly = k.y;
  if (side === "right") { lx = k.x + r + gap;               ly = k.y - alto / 2; }
  if (side === "left")  { lx = k.x - r - gap - CHIP_W;      ly = k.y - alto / 2; }
  if (side === "above") { lx = k.x - CHIP_W / 2;            ly = k.y - r - gap - alto; }
  if (side === "below") { lx = k.x - CHIP_W / 2;            ly = k.y + r + gap; }
  lx = Math.max(bx0, Math.min(bx1 - CHIP_W, lx));
  ly = Math.max(by0, Math.min(by1 - alto, ly));

  // la guía sale del borde del retículo y muere en el borde del chip más cercano
  const cx = lx + CHIP_W / 2, cy = ly + alto / 2;
  const ang = Math.atan2(cy - k.y, cx - k.x);
  const x1 = k.x + Math.cos(ang) * (r + 6);
  const y1 = k.y + Math.sin(ang) * (r + 6);
  const hx = Math.max(lx, Math.min(lx + CHIP_W, k.x));
  const hy = Math.max(ly, Math.min(ly + alto, k.y));
  const largo = Math.hypot(hx - x1, hy - y1);

  const acento = data.logo ? LOGO_COLOR[data.logo] : COLORS.accent;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily, opacity: p }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* guía: se dibuja, no aparece */}
        <line x1={x1} y1={y1} x2={hx} y2={hy}
              stroke={acento} strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray={largo} strokeDashoffset={mix(linea, largo, 0)}
              opacity={0.9} />
        {/* retículo: dos arcos que giran despacio + punto fijo en el centro */}
        <g transform={`translate(${k.x} ${k.y}) scale(${mix(inP, 0.4, 1) * late})`}>
          <circle r={r} fill="none" stroke={acento} strokeWidth={3}
                  strokeDasharray={`${r * 1.1} ${r * 0.55}`}
                  transform={`rotate(${giro})`} opacity={0.95} />
          <circle r={r * 0.62} fill="none" stroke={acento} strokeWidth={2}
                  strokeDasharray={`${r * 0.5} ${r * 0.9}`}
                  transform={`rotate(${-giro * 1.5})`} opacity={0.6} />
          <circle r={5.5} fill={acento} />
        </g>
      </svg>

      <div style={{
        position: "absolute", left: lx, top: ly, width: CHIP_W, minHeight: alto,
        boxSizing: "border-box", padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 14,
        background: `rgba(${INK_RGB},${0.88 * chipP})`,
        backdropFilter: `blur(${12 * chipP}px)`,
        border: `1px solid ${acento}66`,
        borderLeft: `4px solid ${acento}`,
        borderRadius: 16,
        boxShadow: `0 20px 50px -20px rgba(0,0,0,${0.85 * chipP})`,
        transform: `translate(${mix(chipP, side === "left" ? 26 : -26, 0)}px, 0) scale(${mix(chipP, 0.9, 1)})`,
        opacity: chipP,
      }}>
        {data.n != null ? (
          <div style={{ color: acento, fontSize: 54, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {String(data.n).padStart(2, "0")}
          </div>
        ) : null}
        {data.logo ? <Logo id={data.logo} size={52} /> : null}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: COLORS.text, fontSize: 42, fontWeight: 800,
                        letterSpacing: "-0.02em", lineHeight: 1.1 }}>{data.label}</div>
          {data.sub ? (
            <div style={{ color: COLORS.soft, fontSize: 30, fontWeight: 700,
                          marginTop: 6, lineHeight: 1.15 }}>{data.sub}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
