import React from "react";
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile } from "remotion";
import { C, FPS, SUB, TARJETA } from "./theme";
import { MONO, SANS, SERIF } from "./fonts";
import type { Block, Escena, Montaje, Word } from "./data";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Entrada de un elemento gráfico (estilo.md §5): escala 0,9→1, desenfoque 10→0, opacidad 0→1 en ~8 fotogramas. */
export const entra = (t: number, at: number, n = 8) => interpolate(t, [at, at + n / FPS], [0, 1], clamp);
export const estiloEntrada = (p: number, dy = 0): React.CSSProperties => ({
  opacity: p, transform: `translateY(${dy * (1 - p)}px) scale(${0.9 + 0.1 * p})`, filter: p < 1 ? `blur(${10 * (1 - p)}px)` : undefined,
});

// ── Lienzo de los gráficos (estilo.md §7): #F5F3F7 con luces azules en esquinas opuestas ──
export const Lienzo: React.FC = () => (
  <AbsoluteFill style={{
    background: `radial-gradient(circle at 100% 0%, ${C.luz} 0%, ${C.luz}00 45%),
                 radial-gradient(circle at 0% 100%, ${C.luz} 0%, ${C.luz}00 45%), ${C.lienzo}`,
  }} />
);

// ── Plano: un <Sequence> por tramo conservado (silencios fuera), zoom alterno por salto ──
export const Tramos: React.FC<{ m: Montaje }> = ({ m }) => (
  <>
    {m.segments.map((s, i) => {
      const dur = s.toF - s.fromF;
      const escala = m.zooms.escalas[i % m.zooms.escalas.length];
      return (
        <Sequence key={i} from={s.outF} durationInFrames={dur}>
          <OffthreadVideo
            src={staticFile(m.video)}
            trimBefore={s.fromF}
            // rampa de 2 fotogramas en cada costura: sin clics al cortar la voz
            volume={(f) => Math.min(1, (f + 1) / 2, (dur - f) / 2)}
            style={{ width: "100%", height: "100%", objectFit: "cover",
                     transform: `scale(${escala})`, transformOrigin: m.zooms.origen }}
          />
        </Sequence>
      );
    })}
  </>
);

/** Tarjeta del gancho: 0 = vídeo dentro de una tarjeta sobre el lienzo, 1 = pantalla completa. */
export const tarjetaActiva = (m: Montaje, t: number): { e: Escena; p: number } | null => {
  for (const e of m.escenas) {
    const ini = e.start < 0.1 ? 0 : e.start;   // la primera palabra no cae justo en 0: sin esto, 1-2 fotogramas sin tarjeta
    if (e.t !== "tarjeta" || t < ini || t >= e.end) continue;
    const p = interpolate(t, [e.expandAt, e.expandAt + TARJETA.expande / FPS], [0, 1],
                          { ...clamp, easing: Easing.out(Easing.cubic) });
    return { e, p };
  }
  return null;
};

/** El plano, metido en la tarjeta cuando toca (estilo.md §5: tarjeta → pantalla completa). */
export const Camara: React.FC<{ m: Montaje; t: number }> = ({ m, t }) => {
  const tj = tarjetaActiva(m, t);
  const p = tj ? tj.p : 1;
  const escala = TARJETA.escala + (1 - TARJETA.escala) * p;
  const dy = (TARJETA.cy - 960) * (1 - p);
  const radio = (TARJETA.radio / escala) * (1 - p);
  const ein = tj && tj.e.start > 0.1 ? entra(t, tj.e.start) : 1;
  return (
    <>
      {tj && p < 1 ? <Lienzo /> : null}
      <AbsoluteFill style={{
        transform: `translateY(${dy}px) scale(${escala * (0.9 + 0.1 * ein)})`,
        borderRadius: radio, overflow: "hidden",
        boxShadow: p < 1 ? `0 40px 90px -30px rgba(19,17,18,${0.45 * (1 - p)})` : undefined,
      }}>
        <Tramos m={m} />
      </AbsoluteFill>
      {tj && p < 1 ? <Pildora text={tj.e.label} y={TARJETA.cy - 960 * TARJETA.escala - 76} o={(1 - p) * ein} /> : null}
    </>
  );
};

// ── Etiqueta píldora mono (estilo.md §3) ──
export const Pildora: React.FC<{ text: string; y: number; o?: number; claro?: boolean }> = ({ text, y, o = 1, claro }) => (
  <div style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px", borderRadius: 999,
                  background: claro ? C.blanco : C.tinta, color: claro ? C.tinta : C.blanco,
                  border: claro ? `1px solid ${C.gris}` : undefined, fontFamily: MONO, fontSize: 22, fontWeight: 600,
                  letterSpacing: "0.08em", boxShadow: claro ? "0 10px 30px -14px rgba(19,17,18,0.25)" : undefined }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: C.azul }} />
      {text}
    </div>
  </div>
);

// ── Subtítulos (estilo.md §2) ──
const bloqueEn = (m: Montaje, t: number): { b: Block; i: number } | null => {
  let cur: { b: Block; i: number } | null = null;
  m.blocks.forEach((b, i) => { if (m.words[b.from].start <= t + 0.001) cur = { b, i }; });
  if (!cur) return null;
  const { b } = cur as { b: Block; i: number };
  return t <= m.words[b.to].end + 0.6 ? cur : null;   // el último bloque no se queda colgado
};

const Palabra: React.FC<{ w: Word; t: number; size: number; color: string; serif?: boolean; key800?: boolean; sombra: boolean }> =
  ({ w, t, size, color, serif, key800, sombra }) => {
  const n = key800 ? SUB.entraDestacada : SUB.entra;
  const p = interpolate(t, [w.start, w.start + n / FPS], [0, 1], clamp);
  if (t < w.start) return <span style={{ display: "inline-block", fontSize: size, visibility: "hidden" }}>{w.text}&nbsp;</span>;
  return (
    <span style={{
      display: "inline-block", fontSize: size, color, opacity: p,
      filter: `blur(${8 * (1 - p)}px)`, transform: `scale(${0.95 + 0.05 * p})`,
      fontFamily: serif ? SERIF : SANS, fontStyle: serif ? "italic" : "normal",
      fontWeight: serif ? 400 : key800 ? 800 : 600, letterSpacing: key800 && !serif ? "-0.03em" : "-0.01em",
      textShadow: sombra ? "0 0 3px rgba(0,0,0,0.45), 0 3px 20px rgba(0,0,0,0.6)" : undefined, whiteSpace: "pre",
    }}>{w.text}{" "}</span>
  );
};

export const Subtitulos: React.FC<{ m: Montaje; t: number; grafico: boolean }> = ({ m, t, grafico }) => {
  const cur = bloqueEn(m, t);
  if (!cur) return null;
  const { b, i } = cur;
  const next = m.blocks[i + 1];
  // salida: desenfoque 0→10 y fundido en los últimos SUB.sale fotogramas antes del bloque siguiente
  const finB = next ? m.words[next.from].start : m.words[b.to].end + 0.6;
  const s = interpolate(t, [finB - SUB.sale / FPS, finB], [1, 0], clamp);
  const ws = m.words.slice(b.from, b.to + 1).filter((w) => w.text !== "");   // tokens fundidos o quitados
  const k0 = Math.min(...b.key);
  const antes = ws.filter((w) => w.i < k0);
  const clave = ws.filter((w) => b.key.includes(w.i));
  const despues = ws.filter((w) => w.i > Math.max(...b.key));
  const normal = grafico ? C.tinta : C.blanco;
  const destacada = grafico ? C.azul : C.blanco;
  const linea = (arr: Word[], size: number, color: string, key800 = false, serif = false) => (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", lineHeight: 1.08 }}>
      {arr.map((w) => <Palabra key={w.i} w={w} t={t} size={size} color={color} key800={key800} serif={serif} sombra={!grafico} />)}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: grafico ? SUB.topGrafico : SUB.topCamara,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  opacity: s, filter: `blur(${10 * (1 - s)}px)` }}>
      {antes.length ? linea(antes, SUB.normal, normal) : null}
      {clave.length ? linea(clave, b.serif ? SUB.destacada * 1.15 : SUB.destacada, destacada, true, !!b.serif) : null}
      {despues.length ? linea(despues, SUB.normal, normal) : null}
    </div>
  );
};

// ── Marca de agua: icono de Instagram + @, a la derecha (estilo.md §7) ──
export const Firma: React.FC<{ m: Montaje; grafico: boolean }> = ({ m, grafico }) => {
  const col = grafico ? `${C.tinta}55` : "rgba(255,255,255,0.92)";
  return (
    <div style={{ position: "absolute", right: 120, top: 430, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6, color: col, fontFamily: SANS, fontWeight: 700, fontSize: 18,
                  letterSpacing: "0.04em", textTransform: "uppercase" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" />
      </svg>
      {m.handle}
    </div>
  );
};

// ── Efectos de sonido (public/sfx, sintetizados por scripts/musica.py) ──
export const Efectos: React.FC<{ m: Montaje }> = ({ m }) => (
  <>
    {(m.sfx ?? []).map((s, i) => (
      <Sequence key={i} from={Math.round(s.at * FPS)} durationInFrames={FPS}>
        <Audio src={staticFile(`sfx/${s.s}.wav`)} volume={Math.pow(10, s.gain / 20)} />
      </Sequence>
    ))}
  </>
);
