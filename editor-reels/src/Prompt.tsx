import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FPS } from "./theme";
import { MONO, SANS, SERIF } from "./fonts";
import { P, type Escena } from "./data";
import { Camara, Efectos, Firma, Lienzo, Pildora, Subtitulos, clamp, entra, estiloEntrada, tarjetaActiva } from "./comun";

// Reel «4 partes de un buen prompt». Las escenas gráficas tapan el plano con corte seco
// (estilo.md §5) y la voz sigue debajo; cada elemento entra cuando la voz lo nombra.

const sombra = "0 30px 70px -30px rgba(19,17,18,0.35), 0 2px 6px rgba(19,17,18,0.05)";
const tarjeta: React.CSSProperties = { background: C.blanco, borderRadius: 28, boxShadow: sombra };

const Icono: React.FC<{ d: React.ReactNode; size?: number; color?: string; w?: number }> = ({ d, size = 40, color = C.tinta, w = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const LUPA = <><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></>;
const CHECK = <path d="M5 12.5l4.5 4.5L19 7.5" />;
const ENVIAR = <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></>;
const DOC = <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>;
const CHISPA = <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />;

/** Texto que se escribe solo (cursor azul mientras escribe). */
const Escribe: React.FC<{ texto: string; t: number; at: number; cps?: number; style?: React.CSSProperties }> = ({ texto, t, at, cps = 30, style }) => {
  const n = Math.max(0, Math.min(texto.length, Math.floor((t - at) * cps)));
  const escribiendo = t >= at && n < texto.length;
  const parpadeo = Math.floor(t * 2.5) % 2 === 0;
  return (
    <span style={style}>
      {texto.slice(0, n)}
      {escribiendo || (t >= at && parpadeo && n === texto.length && t - at < texto.length / cps + 0.6) ? (
        <span style={{ display: "inline-block", width: 4, height: "1em", background: C.azul, marginLeft: 3, verticalAlign: "-0.12em" }} />
      ) : null}
    </span>
  );
};

// ── 1 · «como le escribes a Google… el 90 %» ──
const Buscador: React.FC<{ e: Escena; t: number }> = ({ e, t }) => {
  const p0 = entra(t, e.start);
  const pd = entra(t, e.dato.at, 10);
  const sube = interpolate(t, [e.dato.at, e.dato.at + 12 / FPS], [0, 1], clamp);
  const valor = Math.round(interpolate(t, [e.dato.at, e.dato.at + 18 / FPS], [0, e.dato.valor], clamp));
  const usado = 100 - e.dato.valor;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, right: 110, top: 640 - 300 * sube, opacity: 1 - 0.45 * sube, ...estiloEntrada(p0, 30) }}>
        <div style={{ ...tarjeta, borderRadius: 999, height: 120, display: "flex", alignItems: "center", gap: 22, padding: "0 40px",
                      transform: `scale(${1 - 0.12 * sube})` }}>
          <Icono d={LUPA} size={44} color={`${C.tinta}88`} />
          <Escribe texto={e.consulta} t={t} at={e.start + 0.15} cps={18} style={{ fontFamily: SANS, fontSize: 44, fontWeight: 600, color: C.tinta }} />
        </div>
      </div>
      {t >= e.dato.at ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, ...estiloEntrada(pd) }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 300, lineHeight: 0.9, letterSpacing: "-0.05em",
                        background: `linear-gradient(180deg, ${C.tinta} 30%, #3B3F55 100%)`, WebkitBackgroundClip: "text", color: "transparent" }}>
            {valor}%
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 120, lineHeight: 1, color: C.azul, marginTop: -6 }}>{e.dato.label}</div>
          <div style={{ width: 760, marginTop: 50 }}>
            <div style={{ height: 22, borderRadius: 11, background: C.gris, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${usado * interpolate(t, [e.dato.at + 0.2, e.dato.at + 0.7], [0, 1], clamp)}%`, background: C.azul, borderRadius: 11 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: MONO, fontSize: 22, color: `${C.tinta}99`, letterSpacing: "0.06em" }}>
              <span>LO QUE USAS · {usado}%</span><span>LO QUE PUEDE HACER</span>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 2 · «Un buen prompt tiene cuatro partes» (como «son simplemente 2 pasos» de la referencia) ──
const Cuatro: React.FC<{ e: Escena; t: number }> = ({ e, t }) => {
  const pn = entra(t, e.num.at, 10);
  const pp = entra(t, e.partes.at, 8);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ height: 330, ...estiloEntrada(pn, 20) }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 360, lineHeight: 0.92, letterSpacing: "-0.05em",
                        background: `linear-gradient(180deg, ${C.tinta} 30%, #3B3F55 100%)`, WebkitBackgroundClip: "text", color: "transparent" }}>4</div>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 130, lineHeight: 1, color: C.azul, marginTop: 6, ...estiloEntrada(pp, 16) }}>partes</div>
      </div>
      <div style={{ position: "absolute", left: 230, right: 230, top: 850, display: "flex", flexDirection: "column", gap: 18 }}>
        {e.items.map((it: string, k: number) => {
          const pk = entra(t, e.partes.at + 0.12 + k * 0.1, 8);
          const fantasma = 0.28 + 0.72 * pk;            // antes de «partes» se intuyen, no se leen
          return (
            <div key={k} style={{ ...tarjeta, borderRadius: 18, height: 84, display: "flex", alignItems: "center", gap: 20, padding: "0 24px",
                                  opacity: Math.min(1, entra(t, e.start + k * 0.06) * fantasma),
                                  filter: pk < 1 ? `blur(${6 * (1 - pk)}px)` : undefined, transform: `translateX(${(1 - pk) * -24}px)` }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: C.azul, color: C.blanco, display: "flex", alignItems: "center",
                            justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 24 }}>{k + 1}</div>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, color: C.tinta }}>{it}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 3 · La tarjeta del prompt: cada parte se escribe cuando la voz la nombra ──
const Prompt: React.FC<{ e: Escena; t: number }> = ({ e, t }) => {
  const p0 = entra(t, e.start);
  const hechas = e.filas.filter((f: any) => t >= f.at).length;
  const completo = e.completoEn ? entra(t, e.completoEn.at, 10) : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 70, right: 70, top: 390, ...tarjeta, padding: "34px 36px 22px", ...estiloEntrada(p0, 30) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 22, borderBottom: `1px solid ${C.gris}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontSize: 24, fontWeight: 600, color: C.tinta, letterSpacing: "0.08em" }}>
            <Icono d={CHISPA} size={30} color={C.azul} w={2.4} /> PROMPT · BORRADOR
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: `${C.tinta}88`, letterSpacing: "0.06em" }}>{hechas}/4</div>
        </div>
        {e.filas.map((f: any, k: number) => {
          const visible = t >= f.at;
          const dur = f.texto.length / 30;
          const hecha = t >= f.at + dur;
          const activa = visible && !hecha;
          const pf = entra(t, f.at, 6);
          return (
            <div key={k} style={{ display: "flex", gap: 22, alignItems: "flex-start", padding: "24px 14px", borderRadius: 18, marginTop: 8,
                                  background: activa ? "#EEF3FF" : "transparent" }}>
              <div style={{ width: 46, height: 46, flex: "0 0 46px", borderRadius: 23, display: "flex", alignItems: "center", justifyContent: "center",
                            background: visible ? C.azul : C.gris, color: C.blanco, fontFamily: SANS, fontWeight: 800, fontSize: 24,
                            transform: `scale(${visible ? 0.85 + 0.15 * pf : 1})` }}>
                {hecha ? <Icono d={CHECK} size={28} color={C.blanco} w={3} /> : k + 1}
              </div>
              <div style={{ flex: 1, minHeight: 92 }}>
                <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, letterSpacing: "0.1em", color: visible ? C.azul : `${C.tinta}55` }}>{f.label}</div>
                {visible ? (
                  <Escribe texto={f.texto} t={t} at={f.at} style={{ display: "block", marginTop: 8, fontFamily: SANS, fontSize: 36, fontWeight: 600, lineHeight: 1.2, color: C.tinta }} />
                ) : (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ height: 16, width: "78%", borderRadius: 8, background: C.gris }} />
                    <div style={{ height: 16, width: "46%", borderRadius: 8, background: C.gris }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {completo > 0 ? <div style={estiloEntrada(completo)}><Pildora text="PROMPT COMPLETO ✓" y={1250} /></div> : null}
    </AbsoluteFill>
  );
};

// ── 4 · «de una respuesta genérica a una que de verdad te sirve» ──
const Respuesta: React.FC<{ buena: boolean; p: number; dim: number }> = ({ buena, p, dim }) => {
  const barras = buena ? [92, 84, 70, 88] : [86, 90, 60, 74];
  return (
    <div style={{ ...tarjeta, padding: "30px 34px", opacity: 1 - 0.45 * dim, filter: buena ? undefined : `saturate(0) blur(${0.8 + 1.2 * dim}px)`,
                  ...(p < 1 ? estiloEntrada(p, 40) : {}) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: buena ? C.azul : C.gris, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {buena ? <Icono d={CHECK} size={26} color={C.blanco} w={3} /> : <div style={{ width: 16, height: 4, borderRadius: 2, background: `${C.tinta}55` }} />}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, letterSpacing: "0.08em", color: buena ? C.azul : `${C.tinta}77` }}>
          {buena ? "RESPUESTA QUE TE SIRVE" : "RESPUESTA GENÉRICA"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {barras.map((w, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {buena ? <div style={{ width: 14, height: 14, borderRadius: 7, background: k === 0 ? C.azul : C.azulSuave, flex: "0 0 14px" }} /> : null}
            <div style={{ height: 18, width: `${w}%`, borderRadius: 9, background: buena ? (k === 0 ? C.azul : `${C.tinta}22`) : C.gris }} />
          </div>
        ))}
      </div>
    </div>
  );
};
const Comparacion: React.FC<{ e: Escena; t: number }> = ({ e, t }) => {
  const pb = entra(t, e.buena.at, 10);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, right: 110, top: 400 }}>
        <Respuesta buena={false} p={entra(t, e.start)} dim={pb} />
      </div>
      {t >= e.buena.at ? (
        <div style={{ position: "absolute", left: 90, right: 90, top: 800 }}>
          <Respuesta buena p={pb} dim={0} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── 5 · CTA: «Comenta la palabra prompt y te envío mi guía» ──
const Comentario: React.FC<{ e: Escena; t: number }> = ({ e, t }) => {
  const p0 = entra(t, e.start);
  const pg = entra(t, e.guia.at, 10);
  const escrito = t - e.start > e.palabra.length / 14;
  const pulso = escrito ? 1 + 0.06 * Math.sin((t - e.start) * 9) : 1;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 90, right: 90, top: 540, ...tarjeta, padding: "26px 30px", ...estiloEntrada(p0, 30) }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.1em", color: `${C.tinta}88`, marginBottom: 20 }}>AÑADE UN COMENTARIO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: C.azulSuave, flex: "0 0 64px" }} />
          <div style={{ flex: 1, height: 84, borderRadius: 42, border: `2px solid ${C.gris}`, display: "flex", alignItems: "center", padding: "0 30px" }}>
            <Escribe texto={e.palabra} t={t} at={e.start + 0.05} cps={14} style={{ fontFamily: SANS, fontSize: 46, fontWeight: 800, color: C.azul, letterSpacing: "-0.02em" }} />
          </div>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: C.azul, display: "flex", alignItems: "center", justifyContent: "center",
                        transform: `scale(${pulso})`, flex: "0 0 84px" }}>
            <Icono d={ENVIAR} size={40} color={C.blanco} w={2.4} />
          </div>
        </div>
      </div>
      {t >= e.guia.at ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", justifyContent: "center", ...estiloEntrada(pg, 40) }}>
          <div style={{ ...tarjeta, borderRadius: 24, display: "flex", alignItems: "center", gap: 22, padding: "24px 34px 24px 26px" }}>
            <div style={{ width: 76, height: 76, borderRadius: 18, background: "#EEF3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icono d={DOC} size={42} color={C.azul} />
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.tinta, letterSpacing: "-0.02em" }}>{e.guia.label}</div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.azul, letterSpacing: "0.08em", marginTop: 4 }}>TE LLEGA POR DM ✓</div>
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const ESCENAS: Record<string, React.FC<{ e: Escena; t: number }>> = {
  buscador: Buscador, cuatro: Cuatro, prompt: Prompt, comparacion: Comparacion, comentario: Comentario,
};

export const PromptReel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const g = P.escenas.find((e) => e.t !== "tarjeta" && t >= e.start && t < e.end);
  const tj = tarjetaActiva(P, t);
  const grafico = !!g || (!!tj && tj.p < 0.5);
  const Esc = g ? ESCENAS[g.t] : null;
  return (
    <AbsoluteFill style={{ background: C.tinta }}>
      <Camara m={P} t={t} />
      {g && Esc ? (<><Lienzo /><Esc e={g} t={t} /></>) : null}
      {grafico ? null : <Firma m={P} grafico={false} />}
      <Subtitulos m={P} t={t} grafico={grafico} />
      <Efectos m={P} />
    </AbsoluteFill>
  );
};
