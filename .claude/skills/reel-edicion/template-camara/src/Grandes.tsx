import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "./theme";
import { Logo, LOGO_NAME, type LogoId } from "./Logos";
import { ICONS } from "./Icons";
import { at, outAt, mix, SPR } from "./anim";
import { fontFamily } from "./fonts";


/** Grafismo GRANDE: iconos grandes que se dibujan, más llamativos que una tarjeta de texto.
 *
 *  - `Pasos`: fila de baldosas de icono. La del paso que él está nombrando crece a 170 px,
 *    el icono se DIBUJA trazo a trazo, entra con rebote, lanza una onda y partículas; las ya
 *    hechas encogen y ganan un check; entre baldosas corre un paquete de datos. En modo
 *    `teaser` (el gancho) salen todas en cascada con las etiquetas difuminadas.
 *  - `Pregunta`: el remate, tarjeta grande con icono y la palabra letra a letra. */

const LOGOS = new Set<string>(Object.keys(LOGO_NAME));

/** Icono de Lucide que se dibuja: pathLength=1 en cada trazo y dashoffset 1→0. */
const DrawIcon: React.FC<{ id: string; size: number; draw: number; color?: string; width?: number }> =
  ({ id, size, draw, color = "#fff", width = 1.9 }) => {
  if (LOGOS.has(id)) return <Logo id={id as LogoId} size={size} />;
  const inner = (ICONS[id] ?? "").replace(/<(path|circle|rect|line|polyline|polygon|ellipse)\b/g, '<$1 pathLength="1"');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: "block", strokeDasharray: 1, strokeDashoffset: 1 - draw, overflow: "visible" }}
         dangerouslySetInnerHTML={{ __html: inner }} />
  );
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

/** Baldosa: degradado del color del paso, brillo arriba, sombra de su color. */
const Tile: React.FC<{ icon: string; color: string; size: number; draw: number; glow: number; ghost?: number; done?: number }> =
  ({ icon, color, size, draw, glow, ghost = 0, done = 0 }) => {
  const isLogo = LOGOS.has(icon);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, position: "relative", flex: "none",
      background: ghost > 0.99 ? "rgba(251,246,234,0.05)"
        : `linear-gradient(145deg, ${shade(color, 1.18)} 0%, ${color} 45%, ${shade(color, 0.55)} 100%)`,
      border: ghost > 0.99 ? "2px dashed rgba(251,246,234,0.28)" : "1.5px solid rgba(255,255,255,0.28)",
      boxShadow: ghost > 0.99 ? "none"
        : `0 ${size * 0.12}px ${size * 0.3}px -${size * 0.1}px ${shade(color, 0.4)}, 0 0 ${70 * glow}px ${8 * glow}px ${color}aa, inset 0 ${size * 0.05}px 0 rgba(255,255,255,0.35)`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* reflejo diagonal que barre la baldosa al activarse */}
      {glow > 0.02 ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: size * 0.28, overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: -size, left: mix(1 - glow, -size * 1.2, size * 1.4), width: size * 0.35, height: size * 3,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "rotate(25deg)",
          }} />
        </div>
      ) : null}
      <div style={{ opacity: ghost > 0.99 ? 0.35 : 1 }}>
        {isLogo
          ? <div style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}><Logo id={icon as LogoId} size={size * 0.74} /></div>
          : <DrawIcon id={icon} size={size * 0.56} draw={ghost > 0.99 ? 1 : draw} color={ghost > 0.99 ? COLORS.soft : "#fff"} />}
      </div>
      {done > 0.01 ? (
        <div style={{
          position: "absolute", right: -size * 0.12, top: -size * 0.12, width: size * 0.42, height: size * 0.42,
          borderRadius: 999, background: COLORS.ok, border: `3px solid ${COLORS.ink}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${done})`, boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
        }}>
          <DrawIcon id="check" size={size * 0.28} draw={Math.min(1, done)} width={3.2} />
        </div>
      ) : null}
    </div>
  );
};

/** Onda + chispas al activarse una baldosa. */
const Burst: React.FC<{ t: number; a: number; color: string; r0: number }> = ({ t, a, color, r0 }) => {
  const k = (t - a) / 0.7;
  if (k < 0 || k > 1) return null;
  const e = 1 - Math.pow(1 - k, 3);
  const N = 10;
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <circle r={r0 * mix(e, 0.6, 1.5)} fill="none" stroke={color} strokeWidth={mix(e, 8, 1)} opacity={1 - k} />
      <circle r={r0 * mix(e, 0.5, 1.15)} fill="none" stroke="#fff" strokeWidth={mix(e, 4, 0.5)} opacity={(1 - k) * 0.6} />
      {Array.from({ length: N }).map((_, i) => {
        const ang = (i / N) * Math.PI * 2 + 0.3;
        const d = r0 * mix(e, 0.7, 1.9);
        return <circle key={i} cx={Math.cos(ang) * d} cy={Math.sin(ang) * d} r={mix(k, 7, 1.5)}
                       fill={i % 2 ? color : COLORS.accent} opacity={1 - k * k} />;
      })}
    </svg>
  );
};

export type PasoNode = { icon: string; label: string; color: string; at?: number };
export type PasosData = {
  start: number; end: number; top: number; mode: "teaser" | "live";
  kicker?: string; nodes: PasoNode[];
  badge?: { text: string; icon: string; after: number; at: number };
  /** teaser: a partir de aquí un marcador de acento recorre las baldosas */
  sweepFrom?: number; sweepTo?: number;
};

export const Pasos: React.FC<{ d: PasosData }> = ({ d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < d.start || t >= d.end) return null;
  const inP = at(frame, fps, d.start, SPR.snap);
  const outP = outAt(t, d.end, 0.35);
  const teaser = d.mode === "teaser";
  const n = d.nodes.length;
  const ats = d.nodes.map((nd, i) => nd.at ?? d.start + 0.25 + i * 0.22);

  // estado de cada baldosa: 0 pendiente · activa · hecha
  const activeIdx = teaser ? -1 : ats.reduce((acc, a, i) => (t >= a ? i : acc), -1);
  const SIZE = { ghost: teaser ? 126 : 100, active: 172, done: 108, teaser: 126 };
  const sizes = d.nodes.map((_, i) => {
    const a = ats[i];
    if (teaser) return SIZE.teaser;
    const on = at(frame, fps, a, SPR.pop);                               // crece al nombrarlo
    const next = i + 1 < n ? at(frame, fps, ats[i + 1], SPR.snap) : 0;   // encoge al pasar al siguiente
    const act = t >= a ? on * (1 - next) : 0;
    const dn = t >= a ? on : 0;
    return SIZE.ghost + (SIZE.done - SIZE.ghost) * dn + (SIZE.active - SIZE.done) * act;
  });
  const GAP = 44;
  const total = sizes.reduce((s, v) => s + v, 0) + GAP * (n - 1);
  const cx0 = 485 - total / 2;
  const rowCy = d.top + (d.kicker ? 62 : 0) + SIZE.active / 2;
  const xs: number[] = []; let acc = cx0;
  sizes.forEach((s) => { xs.push(acc + s / 2); acc += s + GAP; });

  const label = activeIdx >= 0 ? d.nodes[activeIdx] : null;
  const lp = activeIdx >= 0 ? at(frame, fps, ats[activeIdx], SPR.snap) : 0;

  return (
    <div style={{
      position: "absolute", inset: 0, fontFamily,
      opacity: Math.min(inP, outP),
      transform: `translateY(${mix(inP, -40, 0) + mix(outP, -30, 0)}px)`,
      filter: outP < 1 ? `blur(${mix(outP, 10, 0)}px)` : "none",
    }}>
      {/* cristal de fondo: sostiene la fila sobre cualquier plano */}
      <div style={{
        position: "absolute", left: 50, width: 870, top: d.top - 22,
        height: (d.kicker ? 62 : 0) + SIZE.active + (teaser ? 90 : 110) + 22,
        borderRadius: 40, background: "linear-gradient(180deg, rgba(14,11,8,0.80), rgba(14,11,8,0.55))",
        border: "1px solid rgba(233,185,73,0.22)", backdropFilter: "blur(14px)",
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.9)",
        transform: `scaleX(${mix(inP, 0.85, 1)})`,
      }} />
      {d.kicker ? (
        <div style={{
          position: "absolute", left: 50, width: 870, top: d.top, textAlign: "center",
          color: COLORS.accent, fontSize: 30, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase",
          // cede el sitio a la insignia del paso humano, que cuelga en esa misma altura
          opacity: d.badge ? interpolate(t, [d.badge.at - 0.25, d.badge.at], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1,
        }}>{d.kicker}</div>
      ) : null}

      {/* conectores con paquete que viaja */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {d.nodes.slice(0, -1).map((_, i) => {
          const x1 = xs[i] + sizes[i] / 2 + 8, x2 = xs[i + 1] - sizes[i + 1] / 2 - 8;
          const fillAt = teaser ? ats[i + 1] : ats[i + 1] - 0.35;
          const f = interpolate(t, [fillAt, fillAt + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const col = d.nodes[i + 1].color;
          const pk = ((t - d.start) * 1.3 + i * 0.3) % 1;
          return (
            <g key={i}>
              <line x1={x1} y1={rowCy} x2={x2} y2={rowCy} stroke="rgba(251,246,234,0.18)" strokeWidth={5} strokeLinecap="round" />
              <line x1={x1} y1={rowCy} x2={mix(f, x1, x2)} y2={rowCy} stroke={col} strokeWidth={5} strokeLinecap="round" />
              {f >= 1 ? <circle cx={mix(pk, x1, x2)} cy={rowCy} r={6} fill="#fff" style={{ filter: `drop-shadow(0 0 8px ${col})` }} /> : null}
            </g>
          );
        })}
      </svg>

      {d.nodes.map((nd, i) => {
        const a = ats[i];
        const appeared = teaser ? t >= a : true;
        if (!appeared) return null;
        const pop = at(frame, fps, a, SPR.pop);
        const ghost = !teaser && t < a ? 1 : 0;
        const draw = interpolate(t, [a, a + 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const glowT = teaser && d.sweepFrom != null
          ? Math.max(0, 1 - Math.abs(t - (d.sweepFrom + (i / (n - 1)) * ((d.sweepTo ?? d.sweepFrom + 1) - d.sweepFrom))) / 0.35)
          : interpolate(t, [a, a + 0.15, a + 1.2], [0, 1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const glow = ghost ? 0 : (i === activeIdx ? Math.max(glowT, 0.45 + 0.15 * Math.sin(t * 5)) : glowT * (teaser ? 1 : 0.5));
        const done = !teaser && i < activeIdx ? at(frame, fps, ats[i + 1] + 0.1, SPR.pop) : 0;
        const s = sizes[i];
        const sc = ghost ? 1 : teaser ? mix(pop, 0.2, 1) : 1 + 0.12 * Math.sin(Math.min(1, (t - a) / 0.35) * Math.PI) * (t >= a ? 1 : 0);
        const rot = ghost ? 0 : mix(Math.min(1, pop), -18, 0);
        const lift = i === activeIdx ? -6 * Math.sin(t * 3.2) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: xs[i] - s / 2, top: rowCy - s / 2 + lift, width: s, height: s }}>
            <div style={{ transform: `scale(${sc}) rotate(${rot}deg)`, opacity: ghost ? 0.9 : Math.min(1, pop * 1.5) }}>
              <Tile icon={nd.icon} color={nd.color} size={s} draw={draw} glow={glow} ghost={ghost} done={done} />
            </div>
            {!ghost ? <div style={{ position: "absolute", left: s / 2, top: s / 2 }}><Burst t={t} a={a} color={nd.color} r0={s * 0.62} /></div> : null}
            {teaser ? (
              <div style={{
                position: "absolute", top: s + 16, left: -30, width: s + 60, textAlign: "center",
                color: COLORS.text, fontSize: 34, fontWeight: 800, filter: "blur(9px)", opacity: 0.85 * pop,
              }}>{nd.label}</div>
            ) : null}
          </div>
        );
      })}

      {/* etiqueta grande del paso activo: número + verbo, entra deslizando */}
      {label ? (
        <div style={{
          position: "absolute", left: 50, width: 870, top: rowCy + SIZE.active / 2 + 22, textAlign: "center",
          transform: `translateY(${mix(lp, 26, 0)}px) scale(${mix(lp, 0.8, 1)})`, opacity: lp,
        }}>
          <span style={{ color: label.color, fontSize: 40, fontWeight: 800, marginRight: 16 }}>
            {String(activeIdx + 1).padStart(2, "0")}
          </span>
          <span style={{ color: COLORS.text, fontSize: 58, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            {label.label}
          </span>
        </div>
      ) : null}

      {/* insignia del paso humano: cuelga del conector */}
      {d.badge && t >= d.badge.at ? (() => {
        const b = d.badge!; const bp = at(frame, fps, b.at, SPR.pop);
        const x = (xs[b.after] + xs[b.after + 1]) / 2;
        return (
          <div style={{
            position: "absolute", left: x - 110, width: 220, top: rowCy - SIZE.active / 2 - 58,
            display: "flex", justifyContent: "center",
            transform: `translateY(${mix(bp, -30, 0)}px) scale(${mix(bp, 0.4, 1)})`, opacity: Math.min(1, bp * 1.4),
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 8px 10px", borderRadius: 999,
              background: COLORS.accent, color: COLORS.ink, fontSize: 28, fontWeight: 800, letterSpacing: "0.04em",
              textTransform: "uppercase", boxShadow: `0 0 30px ${COLORS.accent}88`, whiteSpace: "nowrap",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DrawIcon id={b.icon} size={26} draw={interpolate(t, [b.at, b.at + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} color={COLORS.accent} width={2.4} />
              </div>
              {b.text}
            </div>
          </div>
        );
      })() : null}
    </div>
  );
};

export type PreguntaData = { start: number; end?: number; top: number; icon: string; pre: string; word: string };

/** El remate: baldosa grande que late + la palabra que cae letra a letra. */
export const Pregunta: React.FC<{ d: PreguntaData }> = ({ d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < d.start || (d.end != null && t >= d.end)) return null;
  const p = at(frame, fps, d.start, SPR.snap);
  const tileP = at(frame, fps, d.start + 0.05, SPR.pop);
  const draw = interpolate(t, [d.start + 0.1, d.start + 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const beat = 1 + 0.045 * Math.max(0, Math.sin((t - d.start) * 4.2));
  const wig = Math.sin((t - d.start) * 9) * 6 * Math.max(0, 1 - (t - d.start - 0.9) / 0.8) * (t > d.start + 0.9 ? 1 : 0);
  const glow = 0.55 + 0.3 * Math.sin((t - d.start) * 4.2);
  const under = interpolate(t, [d.start + 0.9, d.start + 1.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const TILE = 150;
  return (
    <div style={{
      position: "absolute", left: 60, width: 850, top: d.top, fontFamily,
      transform: `translateY(${mix(p, -50, 0)}px)`, opacity: p,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 30, padding: "26px 30px", borderRadius: 40,
        background: "linear-gradient(160deg, rgba(20,16,10,0.90), rgba(20,16,10,0.70))", backdropFilter: "blur(14px)",
        border: `1.5px solid rgba(233,185,73,${0.35 + 0.4 * glow})`,
        boxShadow: `0 30px 80px -30px rgba(0,0,0,0.9), 0 0 ${60 * glow}px -12px ${COLORS.accent}`,
      }}>
        <div style={{ transform: `scale(${mix(tileP, 0.2, 1) * beat}) rotate(${mix(tileP, -25, 0) + wig}deg)`, flex: "none" }}>
          <Tile icon={d.icon} color={COLORS.accent} size={TILE} draw={draw} glow={glow * 0.6} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ color: COLORS.soft, fontSize: 38, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                        opacity: at(frame, fps, d.start + 0.2, SPR.soft) }}>{d.pre}</div>
          <div style={{ display: "flex", position: "relative" }}>
            {d.word.split("").map((ch, i) => {
              const cp = at(frame, fps, d.start + 0.3 + i * 0.045, SPR.pop);
              return (
                <span key={i} style={{
                  display: "inline-block", color: COLORS.accent, fontSize: 74, fontWeight: 800, letterSpacing: "-0.01em",
                  transform: `translateY(${mix(cp, -60, 0)}px) scale(${mix(cp, 1.6, 1)})`, opacity: Math.min(1, cp * 1.5),
                  textShadow: `0 0 ${24 * glow}px ${COLORS.accent}66`,
                }}>{ch}</span>
              );
            })}
            <div style={{ position: "absolute", left: 0, bottom: -4, height: 7, borderRadius: 4, width: `${under * 100}%`,
                          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.alert})` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Grandes: React.FC<{ pasos?: PasosData[]; pregunta?: PreguntaData | null }> = ({ pasos, pregunta }) => (
  <>
    {(pasos ?? []).map((d, i) => <Pasos key={i} d={d} />)}
    {pregunta ? <Pregunta d={pregunta} /> : null}
  </>
);
