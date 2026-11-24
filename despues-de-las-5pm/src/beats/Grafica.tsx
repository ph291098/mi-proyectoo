import React from "react";
import { AbsoluteFill } from "remotion";
import { C, SANS } from "../fuentes";
import { T } from "../tiempos";
import { eio, golpe, lerp, prog, resorte, ruido, temblor } from "../util";

// Energía a lo largo del día (9:00 → 17:00), en %. Baja con un pequeño repunte después de comer.
const PUNTOS: [number, number][] = [[0, 100], [0.12, 96], [0.25, 85], [0.38, 71], [0.5, 63], [0.57, 67], [0.68, 50], [0.8, 34], [0.9, 21], [1, 12]];
const energia = (x: number) => {
  // interpolación suave (Catmull-Rom) entre los puntos
  let i = 0;
  while (i < PUNTOS.length - 2 && x > PUNTOS[i + 1][0]) i++;
  const p0 = PUNTOS[Math.max(0, i - 1)], p1 = PUNTOS[i], p2 = PUNTOS[i + 1], p3 = PUNTOS[Math.min(PUNTOS.length - 1, i + 2)];
  const u = (x - p1[0]) / (p2[0] - p1[0]);
  return 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u * u + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u * u * u);
};

const G = { x: 120, y: 610, w: 800, h: 500 };            // caja de la gráfica en pantalla
const N = 160;
const px = (x: number) => G.x + x * G.w;
const py = (e: number) => G.y + (1 - e / 100) * G.h;

/** Beat 3: fondo negro, la curva de energía se dibuja de 9:00 a 17:00 y el contador baja de 100 % a 12 %. */
export const Grafica: React.FC<{ t: number }> = ({ t }) => {
  const avance = eio(prog(t, T.grafica + 0.25, T.sello - 0.45));
  const n = Math.max(1, Math.round(avance * N));
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / N);
    pts.push([px(x), py(energia(x)) + (ruido(i * 1.7) - 0.5) * 3]);      // leve temblor de trazo a mano
  }
  const cabeza = pts[pts.length - 1];
  const linea = pts.map((p) => p.join(",")).join(" ");
  const area = `${px(0)},${py(0)} ${linea} ${cabeza[0]},${py(0)}`;
  const valor = Math.round(energia(n / N));
  const calor = prog(valor, 70, 12);                                     // el número pasa de crema a naranja
  const sello = resorte(t, T.sello, 19, 0.42);
  const [sx, sy] = temblor(t, T.sello, 16, 6);
  const zoom = 1 + 0.04 * prog(t, T.grafica, T.sello) + golpe(t, T.sello, 0.08, 5);
  const horas = ["9:00", "11:00", "13:00", "15:00", "17:00"];
  return (
    <AbsoluteFill style={{ background: "#060403", transform: `translate(${sx}px, ${sy}px) scale(${zoom})`, transformOrigin: "50% 45%" }}>
      {/* destello al caer el sello */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 40% at 38% 52%, rgba(255,106,26,.35) 0%, rgba(255,106,26,0) 70%)", opacity: golpe(t, T.sello, 1, 3) + 0.25 * avance }} />

      <div style={{ position: "absolute", left: 122, top: 236, fontFamily: SANS, fontWeight: 600, fontSize: 34, letterSpacing: "0.2em", color: C.gris, opacity: prog(t, T.grafica + 0.05, T.grafica + 0.3) }}>tu energía</div>
      <div style={{ position: "absolute", left: 112, top: 280, fontFamily: SANS, fontWeight: 900, fontSize: 230, lineHeight: 1, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums", color: `rgb(${lerp(245, 255, calor)}, ${lerp(236, 106, calor)}, ${lerp(221, 26, calor)})`, transform: `scale(${1 + golpe(t, T.grafica + 0.05, 0.08, 8)})`, transformOrigin: "0 50%" }}>
        {valor}
        <span style={{ fontSize: 110, letterSpacing: 0, marginLeft: 6 }}>%</span>
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="rel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF6A1A" stopOpacity="0.26" />
            <stop offset="1" stopColor="#FF6A1A" stopOpacity="0" />
          </linearGradient>
          <filter id="brillo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        {[100, 75, 50, 25].map((e) => (
          <line key={e} x1={G.x} x2={G.x + G.w} y1={py(e)} y2={py(e)} stroke="rgba(245,236,221,.11)" strokeWidth={2} strokeDasharray="4 12" />
        ))}
        <line x1={G.x} x2={G.x + G.w} y1={py(0)} y2={py(0)} stroke="rgba(245,236,221,.42)" strokeWidth={3} />
        <polygon points={area} fill="url(#rel)" />
        <polyline points={linea} fill="none" stroke="#FF6A1A" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" filter="url(#brillo)" opacity={0.7} />
        <polyline points={linea} fill="none" stroke="#FF6A1A" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cabeza[0]} cy={cabeza[1]} r={15 + 3 * Math.sin(t * 14)} fill="#FFD9BD" />
        <circle cx={cabeza[0]} cy={cabeza[1]} r={30} fill="none" stroke="#FF6A1A" strokeWidth={3} opacity={0.55} />
        {avance > 0.985 ? <line x1={px(1)} x2={px(1)} y1={py(100)} y2={py(0)} stroke="#FF6A1A" strokeWidth={3} strokeDasharray="6 10" opacity={0.8} /> : null}
      </svg>
      {horas.map((h, i) => {
        const llegado = avance >= i / 4 - 0.001;
        const fin = i === 4 && avance > 0.985;
        return (
          <div key={h} style={{ position: "absolute", left: px(i / 4) - 70, width: 140, top: py(0) + 22, textAlign: "center", fontFamily: SANS, fontWeight: fin ? 900 : 600, fontSize: fin ? 38 : 30, color: fin ? C.naranja : llegado ? C.crema : "rgba(154,143,128,.6)", fontVariantNumeric: "tabular-nums" }}>
            {h}
          </div>
        );
      })}

      {/* sello «1 HORA»: cae como un golpe en el hueco limpio bajo la curva */}
      {t >= T.sello ? (
        <div style={{ position: "absolute", left: 140, top: 872, width: 520, height: 190, display: "grid", placeItems: "center", transform: `rotate(-7deg) scale(${2.1 - 1.1 * sello})`, opacity: Math.min(1, sello * 4), border: `11px solid ${C.naranja}`, borderRadius: 22, boxShadow: `inset 0 0 0 5px #060403, inset 0 0 0 8px ${C.naranja}, 0 0 70px rgba(255,106,26,.45)`, background: "rgba(6,4,3,.82)" }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 128, letterSpacing: "-0.02em", color: C.naranja, lineHeight: 1, whiteSpace: "nowrap", wordSpacing: "0.12em" }}>1 HORA</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
