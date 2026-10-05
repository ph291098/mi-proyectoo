import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, CARD_BAND, SAFE, INK_RGB } from "./theme";
import { Logo, LOGO_COLOR, LOGO_NAME, type LogoId } from "./Logos";
import { ICONS } from "./Icons";
import { at, outAt, mix, SPR } from "./anim";
import { fontFamily, mono } from "./fonts";


/* ESCENAS — grafismo de «suspenso y drama» para demos de pantalla, donde una versión
 * con solo subtítulos se queda corta: animaciones, diagramas, logos, interactividad.
 *
 * Todo se declara en cortes.json → `escenas` (ver cortes.example-escenas.json):
 *
 *   sellos      tampón que cae con rebote y hace temblar el cuadro («CONFIDENCIAL»)
 *   pins        punto que late sobre algo de la PANTALLA + guía + chip que lo nombra
 *   marcas      recuadro de acento que sigue una línea del terminal a saltos (keys)
 *   crono       cronómetro que COPIA los segundos que imprime la pantalla (OCR)
 *   expedientes campos que «se encuentran» (caracteres barajando) y se tachan
 *   censuras    barras de censura que barren una zona + sello
 *   entregas    rejilla de casillas que se marcan 0/N → N/N al nombrarlas
 *   firmas      cursor que recorre, pulsa un botón real de la captura y firma
 *   tuberias    fila de pasos: DIFUMINADA en el hook, NÍTIDA y marcada en el cierre
 *   glitches    franjas de color desplazadas, 0.2-0.4 s, sobre una banda
 *
 * Reglas: todo dato que se afirme (segundos, precios, nombres de app) sale de la
 * pantalla, del audio o de una web consultada — y se anota en cortes.json. Nada de
 * esto puede tapar la cara: `verifica.py` lo juzga igual que a tarjetas y chips. */

export type Tone = "red" | "green" | "accent" | string;
const TONE = (c?: Tone) => c === "red" ? "#FF4D5E" : c === "green" ? COLORS.ok : c === "accent" || c === "gold" || !c ? COLORS.accent : c;
const RED = "#FF4D5E";
const GREEN = COLORS.ok;
const LOGOS = new Set<string>(Object.keys(LOGO_NAME));

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rnd = (n: number) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const useT = () => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return { frame, fps, t: frame / fps }; };
/** spring() no admite Infinity: un evento que no llega se pone lejos, no en ∞. */
const NUNCA = 1e4;

export const Ico: React.FC<{ id: string; size: number; color?: string; stroke?: number }> = ({ id, size, color = COLORS.text, stroke = 2 }) => {
  if (LOGOS.has(id)) return <Logo id={id as LogoId} size={size} />;
  const inner = ICONS[id];
  if (!inner) return <div style={{ width: size, height: size }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}
         dangerouslySetInnerHTML={{ __html: inner }} />
  );
};
const accentOf = (id: string) => (LOGOS.has(id) ? LOGO_COLOR[id as LogoId] : COLORS.accent);

const Check: React.FC<{ size: number; p: number }> = ({ size, p }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: GREEN, display: "flex",
                alignItems: "center", justifyContent: "center", transform: `scale(${p}) rotate(${mix(p, -90, 0)}deg)` }}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={COLORS.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/* ─────────────── Sello ─────────────── */
export type SelloData = { text: string; start: number; end: number; cx: number; cy: number;
  rot?: number; color?: Tone; size?: number; sub?: string };
export const Sello: React.FC<{ s: SelloData }> = ({ s }) => {
  const { frame, fps, t } = useT();
  if (t < s.start || t >= s.end) return null;
  const color = TONE(s.color ?? "red"), size = s.size ?? 92;
  const p = at(frame, fps, s.start, SPR.pop);
  const out = outAt(t, s.end, 0.25);
  // el temblor del golpe: 0.3 s, no más, o se lee como fallo
  const hitK = interpolate(t, [s.start + 0.08, s.start + 0.14, s.start + 0.4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sx = Math.sin(t * 90) * 7 * hitK, sy = Math.cos(t * 77) * 5 * hitK;
  return (
    <div style={{
      position: "absolute", left: s.cx, top: s.cy, fontFamily,
      transform: `translate(-50%, -50%) translate(${sx}px, ${sy - (1 - out) * 30}px) rotate(${s.rot ?? -8}deg) scale(${mix(p, 2.8, 1)})`,
      opacity: clamp(p * 1.8) * out,
    }}>
      <div style={{
        border: `${Math.round(size * 0.07)}px solid ${color}`, borderRadius: size * 0.16,
        padding: `${size * 0.1}px ${size * 0.3}px`, background: `${color}14`,
        boxShadow: `0 0 ${40 + 60 * hitK}px -12px ${color}`,
        outline: `${Math.round(size * 0.025)}px dashed ${color}88`, outlineOffset: -size * 0.16,
      }}>
        <div style={{ color, fontSize: size, fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1,
                      textTransform: "uppercase", whiteSpace: "nowrap", textShadow: "0 4px 22px rgba(0,0,0,0.55)" }}>{s.text}</div>
        {s.sub ? <div style={{ color, fontSize: size * 0.28, fontWeight: 700, letterSpacing: "0.3em", textAlign: "center",
                               marginTop: size * 0.08, textTransform: "uppercase" }}>{s.sub}</div> : null}
      </div>
    </div>
  );
};

/* ─────────────── Pin ─────────────── */
export type PinData = { start: number; end: number; x: number; y: number; lx: number; ly: number;
  icon: string; label: string; kicker?: string };
export const Pin: React.FC<{ d: PinData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const out = outAt(t, d.end, 0.28);
  const dp = at(frame, fps, d.start, SPR.pop);
  const lineP = clamp((t - d.start - 0.08) / 0.3);
  const cp = at(frame, fps, d.start + 0.3, SPR.pop);
  const acc = accentOf(d.icon);
  const pulse = ((t - d.start) % 1.1) / 1.1;
  const len = Math.hypot(d.lx - d.x, d.ly - d.y);
  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={d.x} cy={d.y} r={9 * dp} fill={acc} />
        <circle cx={d.x} cy={d.y} r={10 + 34 * pulse} fill="none" stroke={acc} strokeWidth={3} opacity={(1 - pulse) * dp} />
        <line x1={d.x} y1={d.y} x2={d.lx} y2={d.ly} stroke={acc} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - lineP)} opacity={0.9} />
      </svg>
      <div style={{
        position: "absolute", left: d.lx, top: d.ly, transform: `translate(-12%, -50%) scale(${mix(cp, 0.4, 1)})`,
        transformOrigin: "left center", opacity: cp, fontFamily,
        display: "flex", alignItems: "center", gap: 16, padding: "14px 26px 14px 16px", borderRadius: 999,
        background: `rgba(${INK_RGB},0.9)`, border: `2px solid ${acc}`, boxShadow: `0 16px 40px -14px #000, 0 0 30px -10px ${acc}`,
      }}>
        <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ico id={d.icon} size={LOGOS.has(d.icon) ? 48 : 36} color={acc} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {d.kicker ? <div style={{ color: acc, fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>{d.kicker}</div> : null}
          <div style={{ color: COLORS.text, fontSize: 32, fontWeight: 800, whiteSpace: "nowrap" }}>{d.label}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ─────────────── Marca ─────────────── */
/** keys: [inicio, fin, y] — la línea salta cuando el terminal hace scroll; se saca del OCR. */
export type MarcaData = { keys: Array<[number, number, number]>; x: number; w: number; h: number; tag: string };
export const Marca: React.FC<{ d: MarcaData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  const k = d.keys.find(([a, b]) => t >= a && t < b);
  if (!k) return null;
  const p = at(frame, fps, d.keys[0][0], SPR.snap);
  const out = outAt(t, d.keys[d.keys.length - 1][1], 0.25);
  const glow = 0.6 + 0.4 * Math.sin(t * 7);
  return (
    <div style={{ position: "absolute", left: d.x - 10, top: k[2] - 8, width: d.w + 20, height: d.h + 16, borderRadius: 12,
                  border: `3px solid ${COLORS.accent}`, boxShadow: `0 0 ${26 * glow}px -2px ${COLORS.accent}`,
                  opacity: p * out, transform: `scale(${mix(p, 1.25, 1)})`, fontFamily }}>
      <div style={{ position: "absolute", left: d.w + 34, top: "50%", transform: "translateY(-50%)",
                    background: COLORS.accent, color: COLORS.ink, fontSize: 24, fontWeight: 800, letterSpacing: "0.16em",
                    padding: "8px 16px", borderRadius: 8, whiteSpace: "nowrap", textTransform: "uppercase" }}>{d.tag}</div>
    </div>
  );
};

/* ─────────────── Crono ─────────────── */
/** Interpola los segundos entre dos lecturas reales (t0,v0)→(t1,v1) y se congela
 *  en verde en `stop`. Sale de `scripts/crono_ocr.py`, no de un número a ojo. */
export type CronoData = { start: number; stop: number; end: number; t0: number; v0: number; t1: number; v1: number;
  x?: number; y?: number; running?: string; done?: string };
const mmss = (v: number) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
export const Crono: React.FC<{ d: CronoData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const p = at(frame, fps, d.start, SPR.snap);
  const out = outAt(t, d.end, 0.3);
  const done = t >= d.stop;
  const v = Math.round(clamp(d.v0 + (t - d.t0) * (d.v1 - d.v0) / (d.t1 - d.t0), 0, d.v1));
  const dp = done ? at(frame, fps, d.stop, SPR.pop) : 0;
  const acc = done ? GREEN : COLORS.accent;
  const R = 26, C = 2 * Math.PI * R;
  const sweep = done ? 1 : ((t - d.t0) % 1);
  const beat = done ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI));
  return (
    <div style={{
      position: "absolute", left: d.x ?? 70, top: d.y ?? 196, fontFamily, opacity: p * out,
      transform: `translateX(${mix(p, -60, 0)}px) scale(${done ? mix(dp, 1.15, 1) : 1})`, transformOrigin: "left center",
      display: "flex", alignItems: "center", gap: 16, padding: "10px 24px 10px 12px", borderRadius: 20,
      background: `rgba(${INK_RGB},0.9)`, border: `2px solid ${acc}${done ? "" : "99"}`,
      boxShadow: `0 14px 40px -14px #000, 0 0 ${done ? 34 : 20 * beat}px -8px ${acc}`,
    }}>
      <svg width={66} height={66} viewBox="0 0 66 66">
        <circle cx={33} cy={33} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
        <circle cx={33} cy={33} r={R} fill="none" stroke={acc} strokeWidth={6} strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - sweep)} transform="rotate(-90 33 33)" />
        {done
          ? <path d="M21 34 l8 8 l16 -17" fill="none" stroke={acc} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={40} strokeDashoffset={40 * (1 - dp)} />
          : <circle cx={33} cy={33} r={5} fill={acc} opacity={beat} />}
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: acc, fontSize: 20, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {done ? (d.done ?? "terminó en") : (d.running ?? "agente trabajando")}
        </div>
        <div style={{ color: COLORS.text, fontSize: 46, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{mmss(v)}</div>
      </div>
    </div>
  );
};

/* ─────────────── Panel ─────────────── */
/** Fondo común de expediente y entrega. Mismo gesto que Card.Shell (barrido de
 *  entrada, desenfoque hacia abajo de salida), pero con alto y posición propios. */
const Panel: React.FC<{ start: number; end: number; cy?: number; h?: number; tone?: string; children: React.ReactNode }> =
  ({ start, end, cy = CARD_BAND.cy, h = 480, tone = "rgba(140,130,114,0.45)", children }) => {
  const { frame, fps, t } = useT();
  const inP = at(frame, fps, start, SPR.snap);
  const outP = outAt(t, end, 0.32);
  return (
    <div style={{
      position: "absolute", left: SAFE.x0, width: SAFE.x1 - SAFE.x0, top: cy - h / 2, height: h, boxSizing: "border-box",
      padding: "30px 38px", borderRadius: 24, background: `rgba(${INK_RGB},${0.9 * Math.min(inP, outP)})`, backdropFilter: "blur(12px)",
      border: `1.5px solid ${tone}`, boxShadow: "0 30px 80px -24px rgba(0,0,0,0.9)", fontFamily,
      clipPath: `inset(0 ${(1 - inP) * 100}% 0 0 round 24px)`,
      transform: `translateY(${mix(outP, 26, 0)}px)`, filter: outP < 1 ? `blur(${mix(outP, 8, 0)}px)` : "none", opacity: outP,
    }}>{children}</div>
  );
};

/* ─────────────── Expediente ─────────────── */
/** bar = ancho de la barra en px; suffix = lo único legible («LLC», «.com»). */
export type ExpedienteData = { start: number; end: number; done: number; cy?: number; h?: number;
  title?: string; doneTitle?: string; tag?: string;
  rows: Array<{ label: string; at: number; bar: number; suffix?: string }> };
const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789@._";
export const Expediente: React.FC<{ d: ExpedienteData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const done = t >= d.done;
  const h = d.h ?? 480;
  const scanY = ((t - d.start) % 1.3) / 1.3;
  const dots = ".".repeat(1 + Math.floor((t * 3) % 3));
  return (
    <Panel start={d.start} end={d.end} cy={d.cy} h={h} tone={done ? `${GREEN}aa` : `${COLORS.accent}66`}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
        <Ico id="scan-search" size={40} color={done ? GREEN : COLORS.accent} />
        <div style={{ color: done ? GREEN : COLORS.accent, fontSize: 28, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {done ? (d.doneTitle ?? "expediente completo") : `${d.title ?? "buscando"}${dots}`}
        </div>
      </div>
      {d.rows.map((r, i) => {
        if (t < r.at - 0.35) return <div key={i} style={{ height: 74, borderBottom: "1px solid rgba(140,130,114,0.18)" }} />;
        const rp = at(frame, fps, r.at - 0.35, SPR.snap);
        const bar = clamp((t - r.at) / 0.22);
        const chars = Array.from({ length: 14 }, (_, k) => GLYPHS[Math.floor(rnd(frame * 0.37 + k * 11 + i * 97) * GLYPHS.length)]).join("");
        return (
          <div key={i} style={{ height: 74, display: "flex", alignItems: "center", gap: 22,
                                borderBottom: "1px solid rgba(140,130,114,0.18)", opacity: rp, transform: `translateX(${mix(rp, -20, 0)}px)` }}>
            <div style={{ width: 150, color: COLORS.line, fontSize: 24, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>{r.label}</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ position: "relative", width: r.bar, height: 40 }}>
                <div style={{ position: "absolute", inset: 0, color: COLORS.accent, fontSize: 30, fontWeight: 700,
                              fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em", opacity: 1 - bar, overflow: "hidden", whiteSpace: "nowrap" }}>{chars}</div>
                {/* barra rayada, no negra: sobre el panel negro una barra negra no se ve */}
                <div style={{ position: "absolute", left: 0, top: 2, height: 36, width: r.bar * bar, borderRadius: 4,
                              background: "repeating-linear-gradient(135deg, #2a1a1b 0 9px, #3d2224 9px 18px)", boxShadow: `0 0 0 2px ${RED}55` }} />
              </div>
              {r.suffix && bar >= 1 ? <div style={{ color: COLORS.text, fontSize: 30, fontWeight: 800, marginLeft: 8 }}>{r.suffix}</div> : null}
            </div>
            {bar >= 1 ? <div style={{ marginLeft: "auto", color: RED, fontSize: 20, fontWeight: 800, letterSpacing: "0.2em",
                                      border: `2px solid ${RED}`, borderRadius: 6, padding: "3px 10px",
                                      transform: `scale(${mix(at(frame, fps, r.at + 0.22, SPR.pop), 1.6, 1)})` }}>{d.tag ?? "PRIVADO"}</div> : null}
          </div>
        );
      })}
      {!done ? <div style={{ position: "absolute", left: 0, right: 0, top: 96 + scanY * (h - 150), height: 3,
                             background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`,
                             boxShadow: `0 0 18px 4px ${COLORS.accent}66` }} /> : null}
    </Panel>
  );
};

/* ─────────────── Censura ─────────────── */
/** Barras que barren la banda y0→y1 a partir de `start` y se van a la derecha en `end`. */
export type CensuraData = { start: number; end: number; y0?: number; y1?: number; bars?: number;
  stamp?: { text: string; sub?: string; cx?: number; cy?: number; size?: number; rot?: number } };
export const Censura: React.FC<{ d: CensuraData }> = ({ d }) => {
  const { t } = useT();
  if (t < d.start - 0.05 || t >= d.end + 0.4) return null;
  const y0 = d.y0 ?? 206, y1 = d.y1 ?? 830, n = d.bars ?? 9;
  const step = (y1 - y0) / n;
  const leaving = clamp((t - d.end) / 0.35);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = d.start + i * 0.07;
        if (t < a) return null;
        const ep = 1 - Math.pow(1 - clamp((t - a) / 0.16), 3);
        const w = 420 + rnd(i * 3.1) * 480, x = 24 + rnd(i * 7.7) * 60;
        return <div key={i} style={{ position: "absolute", left: x, top: y0 + i * step, height: Math.min(44, step - 18), borderRadius: 4,
                                     width: w * ep, background: "#050403", boxShadow: `0 0 0 1.5px ${RED}33`,
                                     transform: `translateX(${leaving * (300 + i * 60)}px)`, opacity: 1 - leaving }} />;
      })}
      {d.stamp ? <Sello s={{ text: d.stamp.text, sub: d.stamp.sub, start: d.start + 0.42, end: d.end,
                             cx: d.stamp.cx ?? 520, cy: d.stamp.cy ?? (y0 + y1) / 2, rot: d.stamp.rot ?? -7, size: d.stamp.size ?? 104 }} /> : null}
    </AbsoluteFill>
  );
};

/* ─────────────── Glitch ─────────────── */
export type GlitchData = { at: number; dur?: number; y0?: number; y1?: number };
export const Glitch: React.FC<{ d: GlitchData }> = ({ d }) => {
  const { frame, t } = useT();
  const dur = d.dur ?? 0.3;
  if (t < d.at || t >= d.at + dur) return null;
  const k = 1 - (t - d.at) / dur;
  const y0 = d.y0 ?? 0, span = (d.y1 ?? 840) - y0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 7 }, (_, i) => {
        const y = y0 + rnd(frame * 1.3 + i * 17) * span, h = 10 + rnd(frame + i * 5) * 60;
        const dx = (rnd(frame * 2.1 + i) - 0.5) * 120 * k;
        return <div key={i} style={{ position: "absolute", left: dx, top: y, width: 1080, height: h, mixBlendMode: "screen",
                                     background: i % 2 ? "rgba(0,255,240,0.28)" : "rgba(255,40,90,0.28)" }} />;
      })}
    </AbsoluteFill>
  );
};

/* ─────────────── Entrega ─────────────── */
export type EntregaData = { start: number; end: number; cy?: number; h?: number; title?: string; cols?: number;
  items: Array<{ icon: string; label: string; at: number }> };
export const Entrega: React.FC<{ d: EntregaData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const total = d.items.length, cols = d.cols ?? 3;
  const n = d.items.filter((x) => t >= x.at).length;
  const np = n ? at(frame, fps, d.items[n - 1].at, SPR.pop) : 1;
  const all = n === total;
  return (
    <Panel start={d.start} end={d.end} cy={d.cy} h={d.h ?? 500} tone={all ? `${GREEN}aa` : "rgba(140,130,114,0.45)"}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ color: COLORS.soft, fontSize: 28, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>{d.title ?? "lo que entregó"}</div>
        <div style={{ color: all ? GREEN : COLORS.accent, fontSize: 52, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                      transform: `scale(${n ? mix(np, 1.35, 1) : 1})`, transformOrigin: "right center" }}>{n}/{total}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18 }}>
        {d.items.map((it, i) => {
          const on = t >= it.at;
          const ip = at(frame, fps, d.start + 0.1 + i * 0.06, SPR.snap);
          const cp = on ? at(frame, fps, it.at, SPR.pop) : 0;
          return (
            <div key={i} style={{
              position: "relative", height: 170, borderRadius: 18, boxSizing: "border-box", padding: "20px 14px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
              background: on ? "rgba(95,191,122,0.10)" : "rgba(251,246,234,0.03)",
              border: `2px ${on ? "solid" : "dashed"} ${on ? GREEN : "rgba(140,130,114,0.4)"}`,
              opacity: ip * (on ? 1 : 0.55), transform: `scale(${on ? mix(cp, 0.86, 1) : mix(ip, 0.9, 1)})`,
              boxShadow: on ? `0 0 ${36 * (1 - clamp((t - it.at) / 1.2))}px -4px ${GREEN}` : "none",
            }}>
              <div style={{ filter: on ? "none" : "grayscale(1) brightness(0.7)" }}>
                <Ico id={it.icon} size={LOGOS.has(it.icon) ? 58 : 50} color={on ? accentOf(it.icon) : COLORS.line} />
              </div>
              <div style={{ color: on ? COLORS.text : COLORS.line, fontSize: 23, fontWeight: 700, textAlign: "center", lineHeight: 1.1 }}>{it.label}</div>
              {on ? <div style={{ position: "absolute", right: -10, top: -10 }}><Check size={44} p={cp} /></div> : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

/* ─────────────── Firma ─────────────── */
/** btn = centro del botón REAL de la captura (OCR). from = de dónde sale el cursor.
 *  click → onda en el botón; sign → tarjeta con la firma dibujándose; done → ✓. */
export type FirmaData = { start: number; click: number; sign: number; done: number; end: number;
  btn: { x: number; y: number }; from?: { x: number; y: number };
  card?: { x: number; y: number; w?: number; h?: number }; title?: string; doneText?: string };
const FIRMA_PATH = "M20 92 C60 20 90 18 96 70 C100 110 70 112 88 64 C104 22 140 30 140 76 C140 104 160 60 184 58 C204 56 196 96 222 88 C250 80 262 40 290 52 C318 64 300 96 340 84 C360 78 372 66 392 70";
export const Firma: React.FC<{ d: FirmaData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const from = d.from ?? { x: 860, y: 420 };
  const card = { w: 600, h: 250, ...(d.card ?? { x: 240, y: 470 }) };
  const move = clamp((t - d.start - 0.2) / Math.max(0.2, d.click - 0.12 - d.start - 0.2));
  const e = move < 0.5 ? 4 * move ** 3 : 1 - Math.pow(-2 * move + 2, 3) / 2;
  // en curva, como quien lee antes de firmar
  const cx = mix(e, from.x, d.btn.x) + Math.sin(e * Math.PI) * -140;
  const cy = mix(e, from.y, d.btn.y) + Math.sin(e * Math.PI * 2) * 30;
  const press = interpolate(t, [d.click - 0.06, d.click, d.click + 0.12], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ripple = clamp((t - d.click) / 0.45);
  const cp = t >= d.sign ? at(frame, fps, d.sign, SPR.snap) : 0;
  const draw = clamp((t - d.sign - 0.08) / 0.34);
  const dp = t >= d.done ? at(frame, fps, d.done, SPR.pop) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {t >= d.click ? <div style={{ position: "absolute", left: d.btn.x, top: d.btn.y, width: 40 + 260 * ripple, height: 40 + 260 * ripple,
                                    transform: "translate(-50%, -50%)", borderRadius: "50%", border: `4px solid ${COLORS.accent}`, opacity: 1 - ripple }} /> : null}
      {t >= d.sign ? (
        <div style={{ position: "absolute", left: card.x, top: card.y, width: card.w, height: card.h, borderRadius: 22, fontFamily,
                      background: "#FBF8F1", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85)", overflow: "hidden",
                      transform: `translateY(${mix(cp, 40, 0)}px) scale(${mix(cp, 0.9, 1)})`, opacity: cp }}>
          <div style={{ position: "absolute", left: 28, top: 20, color: "#6B6357", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{d.title ?? "firma del cliente"}</div>
          <svg width={card.w} height={card.h} viewBox={`0 0 ${card.w} ${card.h}`} style={{ position: "absolute", inset: 0 }}>
            <line x1={60} y1={card.h - 54} x2={card.w - 60} y2={card.h - 54} stroke="#CFC6B6" strokeWidth={2} />
            <g transform={`translate(${card.w / 2 - 210} ${card.h / 2 - 55})`}>
              <path d={FIRMA_PATH} fill="none" stroke="#1B2A6B" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
                    pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            </g>
          </svg>
          {t >= d.done ? <div style={{ position: "absolute", right: 24, top: 16, background: GREEN, color: COLORS.ink, fontSize: 24, fontWeight: 800,
                                       padding: "6px 16px", borderRadius: 999, transform: `scale(${mix(dp, 1.8, 1)})`, opacity: clamp(dp * 2) }}>{d.doneText ?? "✓ FIRMADO"}</div> : null}
        </div>
      ) : null}
      <svg width={64} height={64} viewBox="0 0 24 24" style={{ position: "absolute", left: cx - 8, top: cy - 5,
           transform: `scale(${press * 1.2})`, transformOrigin: "8px 5px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))",
           opacity: clamp((t - d.start) / 0.2) }}>
        <path d="M4 3 L4 19 L8.5 15 L11.5 21.5 L14.2 20.3 L11.3 14 L17 14 Z" fill="#fff" stroke="#111" strokeWidth={1.3} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

/* ─────────────── Tubería ─────────────── */
/** Los mismos nodos dos veces: `blur: true` en el hook (la promesa: se ve que hay N
 *  pasos, no cuáles) y `blur: false` + `checkFrom` en el cierre (el pago). */
export type TuberiaData = { start: number; end: number; blur: boolean; checkFrom?: number; cy?: number;
  nodes: Array<{ icon: string; label: string }> };
export const Tuberia: React.FC<{ d: TuberiaData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const cy = d.cy ?? 1060, W = SAFE.x1 - SAFE.x0, N = d.nodes.length;
  const out = outAt(t, d.end, 0.3);
  const bp = at(frame, fps, d.start, SPR.snap);
  const sp = W / N;
  return (
    <div style={{ position: "absolute", left: SAFE.x0, top: cy - 90, width: W, height: 180, fontFamily, opacity: out }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: `rgba(${INK_RGB},${0.78 * bp})`, backdropFilter: "blur(10px)",
                    border: "1px solid rgba(140,130,114,0.35)", clipPath: `inset(0 ${(1 - bp) * 100}% 0 0 round 28px)` }} />
      <svg width={W} height={180} style={{ position: "absolute", inset: 0 }}>
        {d.nodes.slice(0, -1).map((_, i) => {
          const p = clamp((t - (d.start + 0.25 + (i + 1) * 0.2)) / 0.25);
          const x1 = sp * (i + 0.5) + 44, x2 = sp * (i + 1.5) - 44;
          return <line key={i} x1={x1} y1={70} x2={mix(p, x1, x2)} y2={70} stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" opacity={0.8} />;
        })}
      </svg>
      {d.nodes.map((n, i) => {
        const a = d.start + 0.2 + i * 0.2;
        const p = t >= a ? at(frame, fps, a, SPR.pop) : 0;
        const ck = d.checkFrom !== undefined ? d.checkFrom + i * 0.24 : NUNCA;
        const cp = t >= ck ? at(frame, fps, ck, SPR.pop) : 0;
        const isLogo = LOGOS.has(n.icon);
        return (
          <div key={i} style={{ position: "absolute", left: sp * i, top: 28, width: sp, display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                                opacity: t < a ? 0 : 1, transform: `scale(${mix(p, 0.3, 1)})` }}>
            <div style={{ position: "relative", width: 84, height: 84, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
                          background: isLogo ? "transparent" : "rgba(251,246,234,0.08)", border: isLogo ? "none" : `2px solid ${COLORS.accent}88`,
                          boxShadow: t >= ck ? `0 0 30px -4px ${GREEN}` : "none" }}>
              <Ico id={n.icon} size={isLogo ? 64 : 42} color={COLORS.accent} />
              {t >= ck ? <div style={{ position: "absolute", right: -12, bottom: -8 }}><Check size={36} p={cp} /></div> : null}
            </div>
            <div style={{ color: COLORS.text, fontSize: 24, fontWeight: 800, whiteSpace: "nowrap",
                          filter: d.blur ? "blur(8px)" : "none", opacity: d.blur ? 0.8 : 1 }}>{n.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────── Consola ─────────────── */
/** Terminal que se escribe AL RITMO DE LA VOZ: cada línea entra en el segundo en que
 *  él nombra la acción (`at`). Sirve para contar el dolor
 *  «por terminal» con los comandos REALES del setup antes de enseñar la solución. */
export type ConsolaData = { start: number; end: number; cy?: number; title?: string;
  lines: Array<{ at: number; text: string; tone?: Tone; out?: string }> };
export const Consola: React.FC<{ d: ConsolaData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const cy = d.cy ?? 860, W = SAFE.x1 - SAFE.x0, H = 118 + d.lines.length * 78;
  const inP = at(frame, fps, d.start, SPR.snap);
  const out = outAt(t, d.end, 0.25);
  const shake = d.lines.reduce((k, l) => {
    const e = t - l.at; return e > 0 && e < 0.25 && l.tone === "red" ? Math.max(k, 1 - e / 0.25) : k;
  }, 0);
  return (
    <div style={{
      position: "absolute", left: SAFE.x0, top: cy - H / 2, width: W, height: H, boxSizing: "border-box",
      borderRadius: 22, overflow: "hidden", background: `rgba(8,8,10,${0.93})`, backdropFilter: "blur(12px)",
      border: "1.5px solid rgba(140,130,114,0.45)", boxShadow: "0 30px 80px -24px rgba(0,0,0,0.9)",
      transform: `translate(${Math.sin(t * 95) * 8 * shake}px, ${mix(inP, 40, 0) + (1 - out) * 30}px) scale(${mix(inP, 0.94, 1)})`,
      opacity: Math.min(inP, out), filter: out < 1 ? `blur(${(1 - out) * 8}px)` : "none",
    }}>
      <div style={{ height: 54, display: "flex", alignItems: "center", gap: 12, padding: "0 22px",
                    background: "rgba(251,246,234,0.06)", borderBottom: "1px solid rgba(140,130,114,0.3)" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
        <div style={{ flex: 1, textAlign: "center", marginRight: 60, color: COLORS.line, fontFamily, fontSize: 22, fontWeight: 700 }}>{d.title ?? "zsh"}</div>
      </div>
      <div style={{ padding: "22px 26px", fontFamily: mono, fontSize: 25, lineHeight: 1.25 }}>
        {d.lines.map((l, i) => {
          if (t < l.at) return null;
          const dur = Math.min(0.42, 0.1 + l.text.length * 0.008);
          const n = Math.round(clamp((t - l.at) / dur) * l.text.length);
          const typing = n < l.text.length;
          const last = d.lines.filter((x) => t >= x.at).length - 1 === i;
          const blink = Math.floor((t - l.at) * 3.2) % 2 === 0;
          const col = l.tone ? TONE(l.tone) : COLORS.text;
          return (
            <div key={i} style={{ height: 78, overflow: "hidden" }}>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                <span style={{ color: COLORS.ok }}>$ </span>
                <span style={{ color: col }}>{l.text.slice(0, n)}</span>
                {last && (typing || blink) ? <span style={{ background: COLORS.text, color: COLORS.text }}>▌</span> : null}
              </div>
              {l.out && !typing ? <div style={{ color: COLORS.line, fontSize: 21, whiteSpace: "nowrap" }}>{l.out}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────── Memoria ─────────────── */
/** Medidor de RAM que COPIA el panel real: cada `key` es una lectura del OCR («18.4 GB
 *  de 48 GB» a los 20.77). `loads` es la espera entre el clic en Cargar y la lectura:
 *  ahí cuenta los segundos de verdad y al terminar dice cuánto tardó. Al bajar (Liberar)
 *  suelta la cifra liberada flotando. */
export type MemoriaData = { start: number; end: number; x?: number; y?: number; w?: number; total: number;
  keys: Array<{ at: number; gb: number; model?: string }>; loads?: Array<{ from: number; to: number; model: string }> };
const fmt = (v: number, dec = 1) => v.toFixed(dec).replace(".", ",");
export const Memoria: React.FC<{ d: MemoriaData }> = ({ d }) => {
  const { frame, fps, t } = useT();
  if (t < d.start || t >= d.end) return null;
  const x = d.x ?? 520, y = d.y ?? 196, w = d.w ?? 380;
  const inP = at(frame, fps, d.start, SPR.snap);
  const out = outAt(t, d.end, 0.3);
  const past = d.keys.filter((k) => t >= k.at);
  const cur = past[past.length - 1] ?? { at: d.start, gb: 0 };
  const prev = past.length > 1 ? past[past.length - 2] : { at: d.start, gb: 0 };
  const kp = past.length ? at(frame, fps, cur.at, SPR.soft) : 1;
  const gb = mix(clamp(kp, 0, 1.08), prev.gb, cur.gb);
  const pct = Math.max(0, gb / d.total);
  const load = (d.loads ?? []).find((l) => t >= l.from && t < l.to);
  const done = (d.loads ?? []).find((l) => t >= l.to && t < l.to + 1.6);
  const freed = cur.gb < prev.gb && t < cur.at + 1.2 ? prev.gb - cur.gb : 0;
  const up = cur.gb > prev.gb && t < cur.at + 0.9;
  const acc = load ? COLORS.accent : done || freed ? GREEN : COLORS.accent;
  const glow = up || freed ? 1 - clamp((t - cur.at) / 0.9) : 0;
  const R = 13, C = 2 * Math.PI * R;
  let sub: React.ReactNode = cur.model ?? "sin modelo cargado";
  if (load) sub = <span style={{ color: COLORS.accent }}>cargando… {fmt(t - load.from)} s</span>;
  else if (done) sub = <span style={{ color: GREEN }}>cargó en {fmt(done.to - done.from)} s</span>;
  else if (freed) sub = <span style={{ color: GREEN }}>memoria liberada</span>;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, boxSizing: "border-box", padding: "14px 20px 16px",
      borderRadius: 20, background: `rgba(${INK_RGB},0.9)`, backdropFilter: "blur(10px)", fontFamily,
      border: `2px solid ${acc}${load ? "" : "88"}`, boxShadow: `0 14px 40px -14px #000, 0 0 ${16 + 40 * glow}px -8px ${acc}`,
      opacity: inP * out, transform: `translateX(${mix(inP, 60, 0)}px) scale(${1 + 0.06 * glow})`, transformOrigin: "right center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {load
          ? <svg width={30} height={30} viewBox="0 0 30 30"><circle cx={15} cy={15} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
              <circle cx={15} cy={15} r={R} fill="none" stroke={COLORS.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${C * 0.3} ${C}`}
                      transform={`rotate(${(t - load.from) * 420} 15 15)`} /></svg>
          : <Ico id="memory-stick" size={30} color={acc} />}
        <div style={{ color: COLORS.soft, fontSize: 20, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>RAM</div>
        <div style={{ flex: 1 }} />
        <div style={{ color: COLORS.text, fontSize: 36, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {fmt(gb)}<span style={{ color: COLORS.line, fontSize: 22 }}> / {d.total} GB</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 14, marginTop: 12, borderRadius: 7, background: "rgba(251,246,234,0.1)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, borderRadius: 7,
                      background: `linear-gradient(90deg, ${GREEN}, ${pct > 0.6 ? COLORS.accent : GREEN})`, boxShadow: `0 0 18px ${GREEN}` }} />
        {load ? <div style={{ position: "absolute", top: 0, bottom: 0, width: 90, left: `${(((t - load.from) * 0.9) % 1.3) * 100 - 20}%`,
                              background: "linear-gradient(90deg, transparent, rgba(233,185,73,0.55), transparent)" }} /> : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 21, fontWeight: 700 }}>
        <div style={{ color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", fontFamily: mono, fontSize: 19, lineHeight: "26px" }}>{sub}</div>
        <div style={{ color: acc, fontVariantNumeric: "tabular-nums" }}>{Math.round(pct * 100)} %</div>
      </div>
      {freed ? <div style={{ position: "absolute", right: 20, top: `calc(100% + ${14 + 26 * (1 - clamp((t - cur.at) / 0.5))}px)`, color: GREEN, fontSize: 40, fontWeight: 800,
                             opacity: 1 - clamp((t - cur.at - 0.6) / 0.6), textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>−{fmt(freed)} GB</div> : null}
    </div>
  );
};

/* ─────────────── Montaje ─────────────── */
export type EscenasData = {
  sellos?: SelloData[]; pins?: PinData[]; marcas?: MarcaData[]; crono?: CronoData | null;
  expedientes?: ExpedienteData[]; censuras?: CensuraData[]; entregas?: EntregaData[];
  firmas?: FirmaData[]; tuberias?: TuberiaData[]; glitches?: GlitchData[];
  consolas?: ConsolaData[]; memoria?: MemoriaData | null;
};

/** Orden de capas: lo que barre (censura, glitch) debajo de lo que informa; el
 *  cronómetro arriba del todo, porque convive con cualquier panel. */
export const Escenas: React.FC<{ e?: EscenasData | null }> = ({ e }) => {
  if (!e) return null;
  return (
    <>
      {(e.tuberias ?? []).map((d, i) => <Tuberia key={`tu${i}`} d={d} />)}
      {(e.pins ?? []).map((d, i) => <Pin key={`pi${i}`} d={d} />)}
      {(e.marcas ?? []).map((d, i) => <Marca key={`ma${i}`} d={d} />)}
      {(e.expedientes ?? []).map((d, i) => <Expediente key={`ex${i}`} d={d} />)}
      {(e.censuras ?? []).map((d, i) => <Censura key={`ce${i}`} d={d} />)}
      {(e.entregas ?? []).map((d, i) => <Entrega key={`en${i}`} d={d} />)}
      {(e.firmas ?? []).map((d, i) => <Firma key={`fi${i}`} d={d} />)}
      {(e.sellos ?? []).map((d, i) => <Sello key={`se${i}`} s={d} />)}
      {(e.glitches ?? []).map((d, i) => <Glitch key={`gl${i}`} d={d} />)}
      {(e.consolas ?? []).map((d, i) => <Consola key={`co${i}`} d={d} />)}
      {e.crono ? <Crono d={e.crono} /> : null}
      {e.memoria ? <Memoria d={e.memoria} /> : null}
    </>
  );
};
