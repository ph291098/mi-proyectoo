import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions, SOMBRA } from "../componentes/Captions";
import { aPantalla, Cuarto, Pose, POS } from "../componentes/Cuarto";
import { Grano, Precarga } from "../componentes/Grano";
import { HANDLE } from "../contenido";
import { C, MANO, SANS, SERIF, useFuentes } from "../fuentes";
import { camaraDeTomas, FPS, Toma } from "../tiempos";
import { eio, eo, eo5, golpe, lerp, prog, resorte, ruido, temblor } from "../util";
import { CAPTIONS2, NOTA, PASO, PESTANAS, SIGUIENTE, T2, T_PESTANAS } from "./contenido";

// ---------- cámara ----------
const TOMAS2: Toma[] = [
  { a: 0, b: T2.corte, de: { x: 750, y: 520, z: 2.2 }, hasta: { x: 753, y: 514, z: 2.38 } },                 // el reloj: son las 5:00
  { a: T2.corte, b: T2.laptop, de: { x: 540, y: 955, z: 1.03 }, hasta: { x: 544, y: 962, z: 1.08 } },        // él, antes de empezar
  { a: T2.laptop, b: T2.agobio, de: { x: 541, y: 1020, z: 1.12 }, hasta: { x: 541, y: 1030, z: 1.2 } },      // abre la laptop
  { a: T2.agobio, b: T2.acabo, de: { x: 560, y: 1010, z: 1.42 }, hasta: { x: 560, y: 1005, z: 1.52 } },      // agobiado
  { a: T2.acabo, b: T2.leccion, de: { x: 581, y: 1088, z: 1.62 }, hasta: { x: 581, y: 1084, z: 1.68 } },     // se acabó
  { a: T2.vuelve, b: T2.hecho, de: { x: 541, y: 1020, z: 1.14 }, hasta: { x: 541, y: 1024, z: 1.18 } },      // trabajando en una sola cosa
  { a: T2.hecho, b: 99, de: { x: 545, y: 1012, z: 1.3 }, hasta: { x: 545, y: 1008, z: 1.37 } },              // hecho
];

// ---------- piezas ----------
const PUNTOS = [C.naranja, C.laton, C.crema];

/** Una pestaña de navegador: la unidad de ruido del episodio. */
const Pestana: React.FC<{ i: number; estilo?: React.CSSProperties }> = ({ i, estilo }) => (
  <div style={{ position: "absolute", width: 500 + (i % 3) * 40, height: 100, borderRadius: "22px 22px 8px 8px", background: "rgba(24,18,13,.97)", border: "1.5px solid rgba(201,161,90,.5)", boxShadow: "0 16px 36px rgba(0,0,0,.6)", display: "flex", alignItems: "center", gap: 16, padding: "0 22px", fontFamily: SANS, ...estilo }}>
    <div style={{ width: 20, height: 20, borderRadius: 6, background: PUNTOS[i % 3], flex: "none" }} />
    <div style={{ fontWeight: 600, fontSize: 36, color: C.crema, letterSpacing: "-0.01em", whiteSpace: "nowrap", flex: 1, overflow: "hidden" }}>{PESTANAS[i % PESTANAS.length]}</div>
    <div style={{ fontWeight: 600, fontSize: 34, color: C.gris }}>×</div>
  </div>
);

/** La nota de papel con la única cosa de hoy, escrita a mano. */
const Nota: React.FC<{ w: number; escrito: number; t: number; barra?: number | null; hecho?: number; estilo?: React.CSSProperties }> = ({ w, escrito, t, barra = null, hecho = 0, estilo }) => {
  const k = w / 640;
  const letras = [...NOTA.linea];
  const n = Math.round(Math.min(1, Math.max(0, escrito)) * letras.length);
  return (
    <div style={{ position: "absolute", width: w, padding: `${46 * k}px ${44 * k}px ${40 * k}px`, background: "linear-gradient(170deg, #F6EAD3 0%, #E9D9BA 100%)", borderRadius: 10 * k, boxShadow: "0 26px 60px rgba(0,0,0,.6), inset 0 0 40px rgba(122,90,42,.18)", ...estilo }}>
      {/* cinta */}
      <div style={{ position: "absolute", left: "50%", top: -22 * k, width: 190 * k, height: 48 * k, marginLeft: -95 * k, background: "rgba(255,106,26,.78)", transform: "rotate(-2deg)", boxShadow: "0 3px 8px rgba(0,0,0,.25)" }} />
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 25 * k, letterSpacing: "0.16em", color: C.latonOscuro }}>{NOTA.etiqueta}</div>
      <div style={{ fontFamily: MANO, fontWeight: 700, fontSize: 66 * k, lineHeight: 1.15, color: "#2a1d12", marginTop: 14 * k, whiteSpace: "nowrap", minHeight: 78 * k }}>
        {letras.slice(0, n).join("")}
        {escrito > 0 && escrito < 1 ? <span style={{ display: "inline-block", width: 5 * k, height: 52 * k, background: C.naranja, marginLeft: 4 * k, verticalAlign: "-8%" }} /> : null}
        {escrito <= 0 ? <span style={{ display: "inline-block", width: 5 * k, height: 52 * k, background: C.naranja, verticalAlign: "-8%", opacity: Math.floor(t * 2.5) % 2 ? 0.2 : 0.9 }} /> : null}
      </div>
      <div style={{ height: 3 * k, background: "rgba(42,29,18,.35)", marginTop: 6 * k }} />
      {barra !== null ? (
        <div style={{ marginTop: 26 * k, height: 44 * k, position: "relative" }}>
          {hecho > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 * k, fontFamily: SANS, fontWeight: 900, fontSize: 40 * k, letterSpacing: "-0.02em", color: "#2a1d12", transform: `scale(${0.7 + 0.3 * hecho})`, transformOrigin: "0 50%" }}>
              <svg width={44 * k} height={44 * k} viewBox="0 0 24 24"><circle cx={12} cy={12} r={11} fill={C.naranja} /><path d="M6.500 12.500l3.800 3.800L17.500 8.500" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
              hecho
            </div>
          ) : (
            <div style={{ position: "absolute", left: 0, right: 0, top: 14 * k, height: 16 * k, borderRadius: 99, background: "rgba(42,29,18,.2)", overflow: "hidden" }}>
              <div style={{ width: `${barra * 100}%`, height: "100%", borderRadius: 99, background: C.naranja }} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

// ---------- gancho: reloj en las 5:00 y «tienes 1 hora.» desde el frame 0 ----------
const Gancho: React.FC<{ t: number }> = ({ t }) => (
  <>
    <div style={{ position: "absolute", left: 84, top: 190, fontFamily: SANS, fontWeight: 900, fontSize: 170, letterSpacing: "-0.04em", lineHeight: 1, color: C.crema, textShadow: SOMBRA, whiteSpace: "nowrap" }}>
      hora <span style={{ color: C.naranja }}>2</span>
      <div style={{ width: 150, height: 5, background: C.laton, marginTop: 14, opacity: 0.85 }} />
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "0.02em", color: C.laton, marginTop: 16 }}>5:00 pm</div>
    </div>
    <div style={{ position: "absolute", left: 90, width: 860, top: 1280, transform: "translateY(-50%)", textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 132, lineHeight: 1.0, color: C.crema, textShadow: SOMBRA }}>
      <div style={{ transform: `scale(${1 + golpe(t, 0.25, 0.08, 9)})` }}>tienes</div>
      <div style={{ color: C.naranja, fontWeight: 900, transform: `scale(${1 + golpe(t, 0.7, 0.1, 8)})` }}>1 hora.</div>
    </div>
  </>
);

// ---------- tropiezo: pestañas que se multiplican y el contador que se vacía ----------
const LUGARES: [number, number, number][] = [[70, 226, -2], [112, 346, 1.5], [78, 466, -1]];
const Tropiezo: React.FC<{ t: number; minutosRestantes: number; relojX: number; relojY: number; z: number }> = ({ t, minutosRestantes, relojX, relojY, z }) => {
  const cae = t >= T2.acabo ? t - T2.acabo : 0;
  const calor = prog(minutosRestantes, 40, 0);
  return (
    <>
      {T_PESTANAS.map((t0, i) => {
        if (t < t0) return null;
        const s = resorte(t, t0, 17, 0.55);
        const [x, y, r] = i < 3 ? LUGARES[i] : [24 + ruido(i * 3.7) * 470, 610 + ruido(i * 5.9) * 640, (ruido(i * 2.1) - 0.5) * 12];
        const nervio = t >= T2.agobio ? Math.sin(t * 38 + i * 2) * 3 : 0;
        return <Pestana key={i} i={i} estilo={{ left: x + nervio, top: y + cae * cae * 9000 + (ruido(i) - 0.5) * cae * 900, transform: `scale(${0.5 + 0.5 * s}) rotate(${r + cae * (ruido(i * 7) - 0.5) * 160}deg)`, opacity: Math.min(1, s * 3) * (1 - prog(cae, 0.12, 0.3)) }} />;
      })}
      {/* minutos que quedan, junto al reloj */}
      {t >= 3.3 ? (
        <div style={{ position: "absolute", left: Math.min(relojX - 170, 680), width: 290, top: relojY + 150 * z + 14, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 84, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: `rgb(${lerp(245, 255, calor)}, ${lerp(236, 106, calor)}, ${lerp(221, 26, calor)})`, textShadow: SOMBRA, opacity: prog(t, 3.3, 3.6), transform: `scale(${1 + golpe(t, T2.acabo, 0.3, 6)})` }}>
          {minutosRestantes}
          <span style={{ fontSize: 36, letterSpacing: "0.02em", marginLeft: 8, fontWeight: 800 }}>min</span>
        </div>
      ) : null}
    </>
  );
};

// ---------- lección sobre negro: de doce pestañas a una sola nota ----------
const Leccion: React.FC<{ t: number }> = ({ t }) => {
  const junta = eio(prog(t, 12.72, 13.36));
  const nota = resorte(t, T2.nota, 15, 0.5);
  const paso = resorte(t, T2.paso, 18, 0.45);
  const zoom = 1 + 0.035 * prog(t, T2.leccion, T2.vuelve) + golpe(t, T2.sentado, 0.05, 6) + golpe(t, T2.paso, 0.04, 6) + golpe(t, T2.nota, 0.04, 6);
  return (
    <AbsoluteFill style={{ background: "#060403", transform: `scale(${zoom})`, transformOrigin: "50% 42%" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 40% at 50% 42%, rgba(255,106,26,.26) 0%, rgba(255,106,26,0) 72%)", opacity: 0.25 + 0.75 * Math.min(1, nota) }} />
      {Array.from({ length: 12 }, (_, i) => {
        const x0 = (i % 2 ? 430 : 6) + (ruido(i * 3.7) - 0.5) * 60 + Math.sin(t * 0.7 + i) * 10;
        const y0 = 500 + Math.floor(i / 2) * 106 + (ruido(i * 5.9) - 0.5) * 34 + Math.cos(t * 0.6 + i * 2) * 8;
        const x = lerp(x0, 540 - 270, junta), y = lerp(y0, 770, junta);
        const visible = prog(t, T2.leccion + i * 0.03, T2.leccion + 0.3 + i * 0.03) * (1 - prog(junta, 0.75, 1));
        return <Pestana key={i} i={i} estilo={{ left: x, top: y, transform: `scale(${lerp(0.8, 0.3, junta)}) rotate(${(ruido(i * 2.1) - 0.5) * 9 * (1 - junta)}deg)`, transformOrigin: "50% 50%", opacity: 0.85 * visible }} />;
      })}
      {/* «paso 1» */}
      {t >= T2.paso ? (
        <div style={{ position: "absolute", left: 108, top: 226, fontFamily: SANS, opacity: Math.min(1, paso * 4), transform: `scale(${1.5 - 0.5 * paso})`, transformOrigin: "0 60%" }}>
          <div style={{ fontWeight: 600, fontSize: 34, letterSpacing: "0.2em", color: C.gris }}>el método</div>
          <div style={{ fontWeight: 900, fontSize: 190, letterSpacing: "-0.05em", lineHeight: 1, color: C.naranja, whiteSpace: "nowrap" }}>paso {PASO.numero}</div>
        </div>
      ) : null}
      {t >= T2.nota ? <Nota w={760} t={t} escrito={prog(t, T2.escribe, 16.7)} estilo={{ left: 160, top: 620, transform: `rotate(-3deg) scale(${0.55 + 0.45 * nota})`, opacity: Math.min(1, nota * 4) }} /> : null}
    </AbsoluteFill>
  );
};

// ---------- cierre: una cosa terminada y gancho al siguiente ----------
const Cierre: React.FC<{ t: number }> = ({ t }) => {
  const hecho = resorte(t, T2.hecho, 17, 0.45);
  const fila = resorte(t, 18.45, 17, 0.5);
  const pill = resorte(t, T2.sigueme, 18, 0.45);
  return (
    <>
      <Nota w={560} t={t} escrito={1} barra={eo(prog(t, 17.0, 17.9))} hecho={t >= T2.hecho ? hecho : 0} estilo={{ left: 84, top: 236, transform: `rotate(-2.5deg) scale(${1 + golpe(t, T2.hecho, 0.07, 6)})`, transformOrigin: "30% 50%", opacity: prog(t, T2.vuelve, T2.vuelve + 0.15) }} />
      {t >= 18.45 ? (
        <div style={{ position: "absolute", left: 84, top: 548, width: 540, height: 80, display: "flex", alignItems: "center", gap: 18, padding: "0 20px 0 16px", borderRadius: 16, background: "rgba(9,6,4,.8)", borderLeft: `5px solid ${C.laton}`, boxShadow: "0 10px 30px rgba(0,0,0,.45)", fontFamily: SANS, opacity: Math.min(1, fila * 3), transform: `translateX(${(1 - fila) * -70}px)` }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${C.laton}`, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 26, color: C.laton, flex: "none" }}>{PASO.numero}</div>
          <div style={{ fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em", color: C.crema, whiteSpace: "nowrap", flex: 1 }}>{PASO.texto}</div>
          <svg width={40} height={40} viewBox="0 0 24 24" style={{ flex: "none" }}>
            <path d="M4.500 12.800l5 5L19.500 7" fill="none" stroke={C.naranja} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - prog(t, 18.6, 18.82))} />
          </svg>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 90, width: 860, top: 1388, display: "flex", justifyContent: "center", opacity: Math.min(1, pill * 3), transform: `scale(${0.6 + 0.4 * pill + golpe(t, T2.final, 0.08, 6)})` }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 52, letterSpacing: "-0.03em", color: "#140a03", background: C.naranja, padding: "16px 40px 20px", borderRadius: 999, boxShadow: "0 14px 50px rgba(255,106,26,.45)", whiteSpace: "nowrap" }}>{SIGUIENTE}</div>
      </div>
      <div style={{ position: "absolute", left: 90, width: 860, top: 1492, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: "0.06em", color: C.crema, opacity: 0.85 * prog(t, 19.6, 19.95), textShadow: SOMBRA }}>{HANDLE}</div>
    </>
  );
};

// ---------- episodio ----------
export const Episodio2: React.FC<{ voz: boolean }> = ({ voz }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFuentes();

  const enCuarto = t < T2.leccion || t >= T2.vuelve;
  const base = camaraDeTomas(TOMAS2, t);
  const [ax, ay] = temblor(t, T2.acabo, 16, 6);
  const cam = {
    x: base.x + ax / base.z,
    y: base.y + ay / base.z,
    z: base.z * (1 + golpe(t, T2.pierdes, 0.05, 7) + golpe(t, T2.laptop, 0.04, 7) + golpe(t, T2.agobio, 0.05, 7) + golpe(t, T2.acabo, 0.07, 6) + golpe(t, T2.hecho, 0.05, 6) + golpe(t, T2.final, 0.03, 5)),
  };

  // el personaje cambia de pose solo en cortes de cámara
  const pose: Pose = t < T2.laptop ? "cansado" : t < T2.agobio ? "mirando" : t < T2.acabo ? "agobiado" : t < T2.leccion ? "cansado" : t < T2.hecho ? "mirando" : "aliviado";
  // la laptop: se abre a los 3 s, se cierra de golpe en «se acabó», y vuelve abierta al final
  const tapa = t < T2.laptop - 0.1 ? 0 : t < T2.acabo ? eio(prog(t, T2.laptop - 0.1, T2.laptop + 0.4)) : t < T2.leccion ? 1 - eo5(prog(t, T2.acabo, T2.acabo + 0.12)) : 1;
  // el reloj: 5:00 → 6:00 mientras se abren pestañas, cada vez más deprisa
  const barrido = prog(t, 4.0, 8.1);
  const u = 1 - Math.pow(1 - barrido, 1.8);
  const minutos = t < 4 ? 17 * 60 + t / 60 : t < T2.leccion ? 17 * 60 + 60 * u : 17 * 60 + 52 + (t - T2.vuelve) / 60;
  const reloj = aPantalla(cam, POS.reloj.cx, POS.reloj.cy);

  const dip = t >= T2.vuelve ? 1 - prog(t, T2.vuelve, T2.vuelve + 0.22) : 0;

  return (
    <AbsoluteFill style={{ background: "#050302" }}>
      <Precarga />
      {enCuarto ? (
        <Cuarto cam={cam} t={t} minutos={minutos} aTics={!(t >= 4 && t < 8.1)} tapa={tapa} luz={tapa} aviso={0} pose={pose} brillo={t >= T2.acabo && t < T2.leccion ? 0.45 : 1} />
      ) : null}
      {t < T2.corte ? <Gancho t={t} /> : null}
      {t >= T2.laptop && t < T2.leccion ? <Tropiezo t={t} minutosRestantes={Math.round(60 * (1 - u))} relojX={reloj.x} relojY={reloj.y} z={cam.z} /> : null}
      {t >= T2.leccion && t < T2.vuelve ? <Leccion t={t} /> : null}
      {t >= T2.vuelve ? <Cierre t={t} /> : null}

      <Captions lista={CAPTIONS2} />
      <AbsoluteFill style={{ background: "#050302", opacity: dip, pointerEvents: "none" }} />
      <Grano />
      <Audio src={staticFile(voz ? "audio/ep2_con_voz.wav" : "audio/ep2_sin_voz.wav")} />
    </AbsoluteFill>
  );
};
