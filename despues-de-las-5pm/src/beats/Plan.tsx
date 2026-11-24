import React from "react";
import { PASOS } from "../contenido";
import { C, SANS } from "../fuentes";
import { prog, resorte } from "../util";

export const T_PASOS = [22.9, 23.4, 23.9, 24.4, 24.9];

/** Beat 4: el checklist de 5 pasos aparece uno por uno sobre la pared, a la izquierda del reloj. */
export const Plan: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "absolute", left: 76, top: 168, width: 580, fontFamily: SANS }}>
    <div style={{ fontWeight: 600, fontSize: 28, letterSpacing: "0.2em", color: C.laton, marginBottom: 20, opacity: prog(t, 22.6, 22.9), textShadow: "0 2px 12px rgba(0,0,0,.9)" }}>el plan para tu hora</div>
    {PASOS.map((paso, i) => {
      const s = resorte(t, T_PASOS[i], 17, 0.5);
      const marca = prog(t, T_PASOS[i] + 0.12, T_PASOS[i] + 0.34);
      return (
        <div key={i} style={{ height: 80, marginBottom: 12, display: "flex", alignItems: "center", gap: 18, padding: "0 20px 0 16px", borderRadius: 16, background: "rgba(9,6,4,.78)", borderLeft: `5px solid ${C.laton}`, boxShadow: "0 10px 30px rgba(0,0,0,.45)", opacity: Math.min(1, s * 3), transform: `translateX(${(1 - s) * -70}px) scale(${0.9 + 0.1 * s})`, transformOrigin: "0 50%" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${C.laton}`, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 26, color: C.laton, flex: "none" }}>{i + 1}</div>
          <div style={{ fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em", color: C.crema, whiteSpace: "nowrap", flex: 1 }}>{paso}</div>
          <svg width={40} height={40} viewBox="0 0 24 24" style={{ flex: "none" }}>
            <path d="M4.500 12.800l5 5L19.500 7" fill="none" stroke={C.naranja} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - marca)} />
          </svg>
        </div>
      );
    })}
  </div>
);
