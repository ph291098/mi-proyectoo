import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Celular } from "./beats/Celular";
import { Cta } from "./beats/Cta";
import { Gancho } from "./beats/Gancho";
import { Grafica } from "./beats/Grafica";
import { Plan } from "./beats/Plan";
import { Captions } from "./componentes/Captions";
import { Cuarto } from "./componentes/Cuarto";
import { Grano, Precarga } from "./componentes/Grano";
import { useFuentes } from "./fuentes";
import { camaraEn, FPS, horaReloj, T } from "./tiempos";
import { ei, eio, eo, golpe, prog, resorte, temblor } from "./util";

export type PropsReel = { voz: boolean };

export const Reel: React.FC<PropsReel> = ({ voz }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFuentes();

  const enCuarto = t < T.grafica || (t >= T.plan && t < T.cta);
  const enCelular = t >= T.celular && t < T.grafica;

  // ---------- cámara: toma base + golpes de zoom + micro temblor ----------
  const base = camaraEn(t);
  const [ax, ay] = temblor(t, T.agotado, 15, 6);            // «agotado»
  const [bx, by] = temblor(t, T.tarde, 12, 6);              // «tarde»
  const cam = {
    x: base.x + (ax + bx) / base.z,
    y: base.y + (ay + by) / base.z,
    z: base.z * (1 + golpe(t, T.agotado, 0.07, 6) + golpe(t, T.lasCinco, 0.045, 7) + golpe(t, T.plan + 0.15, 0.03, 5)),
  };

  // ---------- whip hacia el celular (5,8 → 6,2 s) ----------
  const sale = t < T.celular ? ei(prog(t, T.celular - 0.2, T.celular)) : 0;
  const llega = 1 - eo(prog(t, T.celular, T.celular + 0.22));
  const desenfoque = enCelular ? 9 + llega * 22 : sale * 26;
  const barrido = enCelular ? llega * 380 : -sale * 520;

  // ---------- estado del cuarto ----------
  const tapa = t < T.plan ? 0 : eio(prog(t, T.plan + 0.12, T.plan + 0.95));
  const luz = t < T.plan ? 0 : eo(prog(t, T.plan + 0.45, T.plan + 1.1)) * (0.94 + 0.06 * Math.sin(t * 23));
  const aviso = t < T.aviso || t >= T.celular ? 0 : Math.min(1, resorte(t, T.aviso, 20, 0.4)) * (0.8 + 0.2 * Math.sin((t - T.aviso) * 9));

  // ---------- dips a negro (6-8 frames) ----------
  const dipPlan = t >= T.plan ? 1 - prog(t, T.plan, T.plan + 0.24) : 0;
  const dipCta = t < T.cta ? prog(t, T.cta - 0.2, T.cta) : 1 - prog(t, T.cta, T.cta + 0.24);
  const negro = Math.max(dipPlan, dipCta);

  return (
    <AbsoluteFill style={{ background: "#050302" }}>
      <Precarga />
      {enCuarto ? (
        <AbsoluteFill style={{ transform: `translateX(${barrido}px) scale(${1 + Math.abs(barrido) / 2600})`, filter: desenfoque > 0.3 ? `blur(${desenfoque}px) brightness(${enCelular ? 0.5 : 1})` : undefined }}>
          <Cuarto cam={cam} t={t} minutos={horaReloj(t)} aTics={t >= T.lasCinco} tapa={tapa} luz={luz} aviso={aviso} />
        </AbsoluteFill>
      ) : null}
      {t < T.celular ? <Gancho t={t} cam={cam} /> : null}
      {enCelular ? (
        <AbsoluteFill style={{ transform: `translate(${bx}px, ${by}px)` }}>
          <Celular t={t} />
        </AbsoluteFill>
      ) : null}
      {t >= T.grafica && t < T.plan ? <Grafica t={t} /> : null}
      {t >= T.plan && t < T.cta ? <Plan t={t} /> : null}
      {t >= T.cta ? <Cta t={t} /> : null}

      <Captions />
      <AbsoluteFill style={{ background: "#050302", opacity: negro, pointerEvents: "none" }} />
      <Grano />
      <Audio src={staticFile(voz ? "audio/con_voz.wav" : "audio/sin_voz.wav")} />
    </AbsoluteFill>
  );
};
