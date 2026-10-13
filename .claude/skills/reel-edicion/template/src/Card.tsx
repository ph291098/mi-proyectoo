import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, STAGE } from "./theme";
import { fontFamily } from "./fonts";


/** Una tarjeta NUNCA repite lo que dice la voz: contrasta, deduce o remata. */
export type CardData =
  | { t: "contrast"; start: number; end: number; kicker?: string;
      left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { t: "stat"; start: number; end: number; kicker?: string; value: string; label: string }
  | { t: "point"; start: number; end: number; kicker?: string; lines: string[] };

const Shell: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <div style={{
    position: "absolute", left: 0, top: STAGE.cy - STAGE.hMax / 2, width: STAGE.w, height: STAGE.hMax,
    display: "flex", flexDirection: "column", justifyContent: "center",
    padding: "0 74px", boxSizing: "border-box", fontFamily,
    background: `rgba(10,8,6,${0.90 * p})`,
    backdropFilter: `blur(${12 * p}px)`,
    opacity: p,
  }}>{children}</div>
);

const Kicker: React.FC<{ text?: string }> = ({ text }) =>
  text ? (
    <div style={{ color: COLORS.line, fontSize: 27, fontWeight: 700, letterSpacing: "0.19em",
                  textTransform: "uppercase", marginBottom: 26 }}>{text}</div>
  ) : null;

export const Card: React.FC<{ card: CardData }> = ({ card }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < card.start || t >= card.end) return null;
  // entrada y salida NO son el mismo movimiento invertido
  const inP  = spring({ frame: frame - card.start * fps, fps, config: { damping: 17, mass: 0.6 } });
  const outP = interpolate(t, [card.end - 0.32, card.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p = Math.min(inP, outP);

  if (card.t === "contrast") {
    const Col: React.FC<{ c: { title: string; items: string[] }; accent: string; delay: number }> =
      ({ c, accent, delay }) => {
      const cp = spring({ frame: frame - (card.start + delay) * fps, fps, config: { damping: 18, mass: 0.55 } });
      return (
        <div style={{ flex: 1, transform: `translateY(${interpolate(cp, [0, 1], [22, 0])}px)`, opacity: cp }}>
          <div style={{ color: accent, fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 20 }}>
            {c.title}
          </div>
          {c.items.map((it, i) => (
            <div key={i} style={{ color: COLORS.soft, fontSize: 31, fontWeight: 600, lineHeight: 1.38, opacity: 0.93 }}>
              {it}
            </div>
          ))}
        </div>
      );
    };
    return (
      <Shell p={p}>
        <Kicker text={card.kicker} />
        <div style={{ display: "flex", gap: 44, alignItems: "flex-start" }}>
          <Col c={card.left} accent={COLORS.alert} delay={0.06} />
          <div style={{ width: 2, alignSelf: "stretch", background: "rgba(140,130,114,0.45)" }} />
          <Col c={card.right} accent={COLORS.ok} delay={0.18} />
        </div>
      </Shell>
    );
  }
  if (card.t === "stat") {
    return (
      <Shell p={p}>
        <Kicker text={card.kicker} />
        <div style={{ color: COLORS.accent, fontSize: 168, fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.045em" }}>
          {card.value}
        </div>
        <div style={{ color: COLORS.soft, fontSize: 38, fontWeight: 700, marginTop: 20, lineHeight: 1.28, whiteSpace: "pre-line" }}>
          {card.label}
        </div>
      </Shell>
    );
  }
  return (
    <Shell p={p}>
      <Kicker text={card.kicker} />
      {card.lines.map((l, i) => {
        const lp = spring({ frame: frame - (card.start + 0.06 + i * 0.12) * fps, fps, config: { damping: 18, mass: 0.55 } });
        return (
          <div key={i} style={{
            color: i === 0 ? COLORS.text : COLORS.soft,
            fontSize: i === 0 ? 52 : 36, fontWeight: i === 0 ? 800 : 600,
            lineHeight: 1.3, marginBottom: 14, letterSpacing: "-0.02em",
            transform: `translateY(${interpolate(lp, [0, 1], [20, 0])}px)`, opacity: lp,
          }}>{l}</div>
        );
      })}
    </Shell>
  );
};
