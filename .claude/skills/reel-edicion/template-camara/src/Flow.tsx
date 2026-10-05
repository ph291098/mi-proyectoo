import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "./theme";
import { Shell, CardKicker } from "./Card";
import { Logo, LOGO_COLOR, LOGO_NAME, type LogoId } from "./Logos";
import { ICONS } from "./Icons";
import { at, outAt, mix, SPR } from "./anim";
import { fontFamily } from "./fonts";


/** Diagrama de proceso animado: nodos con icono que aparecen cuando él nombra
 *  cada paso (`at`, en segundos) y flechas que se DIBUJAN entre ellos. Es lo
 *  que sustituye al B-roll en un plano fijo: el proceso se ve mientras se cuenta.
 *
 *  Layouts:
 *   chain   a → b → c → d          (secuencia; `badge` etiqueta una flecha)
 *   fanin   [a b c] → hub → out    (varias fuentes convergen)
 *   fanout  in → hub → [a b c]     (una fuente se reparte)
 *   rows    a → b  /  c → d        (pares apilados)
 *  `icon` es un id de Lucide (src/Icons.ts) o un LogoId ("github", "telegram"…). */
export type FlowNode = { icon: string; label?: string; at?: number };
export type FlowData = {
  t: "flow"; start: number; end: number; kicker?: string; cy?: number;
  layout: "chain" | "fanin" | "fanout" | "rows";
  nodes: FlowNode[];
  hub?: FlowNode;
  end_node?: FlowNode;     // fanin: salida única · fanout: entrada única
  badge?: { text: string; after: number; at?: number };
};

const W = 750;                        // ancho interior del panel (830 − 2·40)
// Se deriva de Logos.tsx en vez de repetir la lista: cuando logos_gen.py añade una
// marca, el diagrama la reconoce sola. Escrita a mano se quedaba atrás en silencio —
// un `icon: "n8n"` sin entrada aquí no falla, pinta un hueco.
const LOGOS = new Set<string>(Object.keys(LOGO_NAME));

const Icon: React.FC<{ id: string; size: number; color: string }> = ({ id, size, color }) => {
  if (LOGOS.has(id)) return <Logo id={id as LogoId} size={size} />;
  const inner = ICONS[id];
  if (!inner) return <div style={{ width: size, height: size }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: "block" }} dangerouslySetInnerHTML={{ __html: inner }} />
  );
};

/** Un nodo: chip con icono que entra con rebote y brilla ~0.9 s al aparecer. */
const Node: React.FC<{ n: FlowNode; x: number; y: number; size: number; t: number; frame: number; fps: number;
                       labelPos: "below" | "left" | "right"; labelW?: number }> =
  ({ n, x, y, size, t, frame, fps, labelPos, labelW = 130 }) => {
  const a = n.at ?? 0;
  if (t < a) return null;
  const p = at(frame, fps, a, SPR.pop);
  const glow = interpolate(t, [a, a + 0.25, a + 1.1], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isLogo = LOGOS.has(n.icon);
  const accent = isLogo ? LOGO_COLOR[n.icon as LogoId] : COLORS.accent;
  const chip = (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26, flex: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: isLogo ? "transparent" : "rgba(251,246,234,0.07)",
      border: isLogo ? "none" : `1.5px solid rgba(233,185,73,${0.35 + 0.65 * glow})`,
      boxShadow: `0 0 ${34 * glow}px -4px ${accent}`,
      transform: `scale(${mix(p, 0.3, 1)}) rotate(${mix(p, -14, 0)}deg)`,
      boxSizing: "border-box",
    }}>
      <Icon id={n.icon} size={isLogo ? size : size * 0.52} color={mix(glow, 0, 1) > 0.5 ? COLORS.accent : COLORS.text} />
    </div>
  );
  const lp = at(frame, fps, a + 0.1, SPR.soft);
  const label = n.label ? (
    <div style={{
      color: COLORS.soft, fontSize: 22, fontWeight: 700, lineHeight: 1.12, letterSpacing: "0.02em",
      width: labelPos === "below" ? labelW : undefined, maxWidth: labelPos === "below" ? undefined : labelW,
      textAlign: labelPos === "below" ? "center" : labelPos === "left" ? "right" : "left",
      whiteSpace: labelPos === "below" ? undefined : "nowrap",   // a los lados no parte: «muse-glimmer:30b» salía en dos líneas
      opacity: lp * 0.92, transform: `translateY(${mix(lp, 6, 0)}px)`,
    }}>{n.label}</div>
  ) : null;
  if (labelPos === "below") {
    return (
      <div style={{ position: "absolute", left: x - labelW / 2, top: y - size / 2, width: labelW,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 9, fontFamily, opacity: p }}>
        {chip}{label}
      </div>
    );
  }
  // etiqueta al lado: el grupo se ancla por el borde del chip (x es el borde interior)
  return (
    <div style={{
      position: "absolute", top: y - size / 2, fontFamily, opacity: p,
      left: labelPos === "right" ? x : undefined, right: labelPos === "left" ? W - x : undefined,
      display: "flex", flexDirection: labelPos === "right" ? "row" : "row-reverse", alignItems: "center", gap: 12,
    }}>
      {chip}{label}
    </div>
  );
};

type Edge = { x1: number; y1: number; x2: number; y2: number; at: number };

/** Flecha que se dibuja de origen a destino; la punta aparece al llegar. */
const Arrow: React.FC<{ e: Edge; t: number; color: string }> = ({ e, t, color }) => {
  if (t < e.at) return null;
  const p = interpolate(t, [e.at, e.at + 0.32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ep = 1 - Math.pow(1 - p, 3);
  const dx = e.x2 - e.x1, dy = e.y2 - e.y1;
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const hx = e.x1 + dx * ep, hy = e.y1 + dy * ep;
  return (
    <g>
      <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={color} strokeWidth={2.5}
            strokeDasharray={len} strokeDashoffset={len * (1 - ep)} strokeLinecap="round" opacity={0.85} />
      <polygon points="0,-6 11,0 0,6" fill={color} opacity={ep > 0.55 ? (ep - 0.55) / 0.45 : 0}
               transform={`translate(${hx} ${hy}) rotate(${ang})`} />
    </g>
  );
};

export const Flow: React.FC<{ flow: FlowData }> = ({ flow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < flow.start || t >= flow.end) return null;
  const inP  = at(frame, fps, flow.start, SPR.snap);
  const outP = outAt(t, flow.end, 0.34);
  const p = Math.min(inP, outP);

  const def = (n: FlowNode, i: number, base = flow.start + 0.18): FlowNode => ({ ...n, at: n.at ?? base + i * 0.24 });
  const nodes = flow.nodes.map((n, i) => def(n, i));
  const hub = flow.hub ? def(flow.hub, 0, flow.start + 0.12) : undefined;
  const endNode = flow.end_node ? def(flow.end_node, 0, flow.start + 0.5) : undefined;
  const edgeAt = (a: FlowNode, b: FlowNode) => Math.max(a.at ?? 0, b.at ?? 0) + 0.18;

  const items: React.ReactNode[] = [];
  const edges: Edge[] = [];
  let H = 170;

  if (flow.layout === "chain") {
    const n = nodes.length, size = 74, sp = W / n, cy = size / 2 + 2;
    nodes.forEach((nd, i) => {
      const x = sp * (i + 0.5);
      items.push(<Node key={i} n={nd} x={x} y={cy} size={size} t={t} frame={frame} fps={fps} labelPos="below" labelW={Math.min(124, sp - 6)} />);
      if (i < n - 1) edges.push({ x1: x + size / 2 + 8, y1: cy, x2: x + sp - size / 2 - 8, y2: cy, at: edgeAt(nd, nodes[i + 1]) });
    });
    if (flow.badge) {
      const b = flow.badge, ba = b.at ?? edgeAt(nodes[b.after], nodes[b.after + 1]) + 0.1;
      if (t >= ba) {
        const bp = at(frame, fps, ba, SPR.pop);
        items.push(
          <div key="badge" style={{
            position: "absolute", left: sp * (b.after + 1) - 60, width: 120, top: cy - size / 2 - 30, textAlign: "center",
            fontFamily, color: COLORS.accent, fontSize: 19, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
            transform: `scale(${mix(bp, 0.5, 1)}) translateY(${mix(bp, 8, 0)}px)`, opacity: bp,
          }}>{b.text}</div>);
      }
    }
    H = size + 2 + 9 + 46;
  } else if (flow.layout === "rows") {
    const size = 64, rowH = 92; H = rowH * (nodes.length / 2);
    for (let r = 0; r < nodes.length / 2; r++) {
      const a = nodes[r * 2], b = nodes[r * 2 + 1], y = rowH * r + size / 2 + 4;
      items.push(<Node key={`a${r}`} n={a} x={230} y={y} size={size} t={t} frame={frame} fps={fps} labelPos="left" labelW={170} />);
      items.push(<Node key={`b${r}`} n={b} x={470} y={y} size={size} t={t} frame={frame} fps={fps} labelPos="right" labelW={250} />);
      edges.push({ x1: 244, y1: y, x2: 456, y2: y, at: edgeAt(a, b) });   // b a 470 y etiqueta de 250: «muse-glimmer:30b» partía en dos líneas a 190
    }
  } else {
    // fanin / fanout: lado de varios a la izquierda (fanin) o a la derecha (fanout)
    const many = nodes, side = 52, rowH = 70;
    H = Math.max(250, rowH * many.length + 10);
    const cyH = H / 2, hubSize = 96;
    const hubX = W / 2;
    if (hub) items.push(<Node key="hub" n={hub} x={hubX} y={cyH} size={hubSize} t={t} frame={frame} fps={fps} labelPos="below" labelW={150} />);
    const multiX = flow.layout === "fanin" ? 250 : 500;     // borde interior del grupo
    many.forEach((nd, i) => {
      const y = cyH + (i - (many.length - 1) / 2) * rowH;
      items.push(<Node key={i} n={nd} x={multiX} y={y} size={side} t={t} frame={frame} fps={fps}
                       labelPos={flow.layout === "fanin" ? "left" : "right"} labelW={180} />);
      if (hub) {
        const e = flow.layout === "fanin"
          ? { x1: multiX + 10, y1: y, x2: hubX - hubSize / 2 - 10, y2: cyH + (y - cyH) * 0.25 }
          : { x1: hubX + hubSize / 2 + 10, y1: cyH + (y - cyH) * 0.25, x2: multiX - 10, y2: y };
        edges.push({ ...e, at: edgeAt(nd, hub) });
      }
    });
    if (endNode && hub) {
      const ex = flow.layout === "fanin" ? W - 70 : 70;
      items.push(<Node key="end" n={endNode} x={ex} y={cyH} size={72} t={t} frame={frame} fps={fps} labelPos="below" labelW={130} />);
      edges.push(flow.layout === "fanin"
        ? { x1: hubX + hubSize / 2 + 10, y1: cyH, x2: ex - 36 - 10, y2: cyH, at: edgeAt(hub, endNode) }
        : { x1: ex + 36 + 10, y1: cyH, x2: hubX - hubSize / 2 - 10, y2: cyH, at: edgeAt(endNode, hub) });
    }
  }

  return (
    <Shell p={p} inP={inP} outP={outP} cy={flow.cy}>
      <CardKicker text={flow.kicker} start={flow.start} />
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {edges.map((e, i) => <Arrow key={i} e={e} t={t} color={COLORS.accent} />)}
        </svg>
        {items}
      </div>
    </Shell>
  );
};
