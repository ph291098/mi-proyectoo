import React from "react";
import { SOMBRA } from "../componentes/Captions";
import { aPantalla, POS } from "../componentes/Cuarto";
import { C, SANS, SERIF } from "../fuentes";
import { Camara, T } from "../tiempos";
import { golpe, prog, resorte } from "../util";

/** Contador digital junto al reloj: 4:58 → 4:59 → 5:00. */
const Digital: React.FC<{ texto: string; t0: number; t: number; tam: number; acento?: boolean }> = ({ texto, t0, t, tam, acento }) => {
  const s = resorte(t, t0, 22, 0.55);
  return (
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: tam, letterSpacing: "-0.04em", lineHeight: 1, color: acento ? C.naranja : C.crema, textShadow: SOMBRA, fontVariantNumeric: "tabular-nums", transform: `translateY(${(1 - s) * -tam * 0.35}px) scale(${0.8 + 0.2 * s})`, transformOrigin: "0 60%", opacity: Math.min(1, s * 3), whiteSpace: "nowrap" }}>
      {texto}
      <span style={{ fontSize: tam * 0.3, fontWeight: 800, letterSpacing: "0.04em", marginLeft: tam * 0.08, color: acento ? C.naranja : C.laton }}>pm</span>
    </div>
  );
};

export const Gancho: React.FC<{ t: number; cam: Camara }> = ({ t, cam }) => {
  // ---- 0 → 1,5 s: primer plano del reloj + gancho escrito desde el frame 0 ----
  if (t < T.agotado) {
    const hora = t < 0.75 ? "4:58" : "4:59";
    const palabras: [string, number][] = [["sé", 0.6], ["que", 1.08], ["estás", 1.3]];
    return (
      <>
        <div style={{ position: "absolute", left: 84, top: 196 }}>
          <Digital texto={hora} t0={t < 0.75 ? -1 : 0.75} t={t} tam={170} />
          <div style={{ width: 150, height: 5, background: C.laton, marginTop: 16, opacity: 0.85 }} />
        </div>
        <div style={{ position: "absolute", left: 90, width: 860, top: 1280, transform: "translateY(-50%)", textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 124, lineHeight: 1.02, color: C.crema, textShadow: SOMBRA }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.24em" }}>
            {palabras.map(([w, a]) => {
              return (
                <span key={w} style={{ display: "inline-block", transform: `scale(${1 + golpe(t, a, 0.09, 9)})` }}>
                  {w}
                </span>
              );
            })}
          </div>
          <div>agotado.</div>
        </div>
      </>
    );
  }
  // ---- 1,5 → 2,8 s: corte a él. «agotado.» golpea en naranja ----
  if (t < T.abierto) {
    const s = resorte(t, T.agotado, 17, 0.42);
    return (
      <div style={{ position: "absolute", left: 70, width: 860, top: 1330, transform: `translateY(-50%) scale(${1.32 - 0.32 * s})`, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 900, fontSize: 164, lineHeight: 1, letterSpacing: "-0.02em", color: C.naranja, textShadow: SOMBRA }}>
        agotado.
      </div>
    );
  }
  // ---- 2,8 → 6 s: plano general. El reloj marca las 5:00 ----
  const r = aPantalla(cam, POS.reloj.cx, POS.reloj.cy);
  const enPunto = t >= T.lasCinco;
  const sal = 1 - prog(t, T.aviso, T.aviso + 0.3);
  return (
    <>
      <div style={{ position: "absolute", left: r.x - (POS.reloj.d / 2) * cam.z - 420, width: 380, top: r.y - 62, display: "flex", justifyContent: "flex-end", opacity: sal, transform: `scale(${1 + golpe(t, T.lasCinco, 0.22, 7)})`, transformOrigin: "100% 50%" }}>
        <Digital texto={enPunto ? "5:00" : "4:59"} t0={enPunto ? T.lasCinco : -1} t={t} tam={124} acento={enPunto} />
      </div>
    </>
  );
};
