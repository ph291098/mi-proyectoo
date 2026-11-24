import React from "react";
import { Img, staticFile } from "remotion";
import { AVISOS, TARJETAS } from "../contenido";
import { C, SANS } from "../fuentes";
import { T } from "../tiempos";
import { eo, eo5, golpe, lerp, prog, resorte, ruido } from "../util";

// La mano con el celular (capa pintada) a escala, y dónde queda su pantalla.
const S = 0.752;
const SP = { w: 1520 * S, h: 2688 * S };
const PANT = { x: 298 * S, y: 103 * S, w: (1096 - 298) * S, h: (1594 - 103) * S };
const ORIGEN = { x: 240 - PANT.x, y: 372 - PANT.y };

// ---------- feed ----------
const H_REL = 330, H_TARJ = 500, HUECO = 22, ARRIBA = 150;
type Item = { tipo: "relleno" | "tarjeta"; k: number; top: number; h: number };
const ORDEN: ("r" | "t")[] = ["r", "r", "r", "r", "t", "r", "r", "t", "r", "r", "t", "r"];
const ITEMS: Item[] = [];
{
  let y = ARRIBA, kr = 0, kt = 0;
  for (const o of ORDEN) {
    const h = o === "r" ? H_REL : H_TARJ;
    ITEMS.push({ tipo: o === "r" ? "relleno" : "tarjeta", k: o === "r" ? kr++ : kt++, top: y, h });
    y += h + HUECO;
  }
}
const topTarjeta = (k: number) => ITEMS.find((i) => i.tipo === "tarjeta" && i.k === k)!.top - 330;
// Cada «flick» del pulgar: [inicio, fin, posición final]
const FLICKS: [number, number, number][] = [
  [6.45, 6.8, 380], [7.15, 7.5, 800],
  [8.3, T.tarjeta1, topTarjeta(0)], [9.95, T.tarjeta2, topTarjeta(1)], [11.1, T.tarjeta3, topTarjeta(2)],
];
const scrollEn = (t: number) => {
  let y = 0;
  for (const [a, b, hasta] of FLICKS) {
    if (t <= a) break;
    y = lerp(y, hasta, eo5(prog(t, a, b)));
  }
  return y;
};

const miniatura = (i: number): React.CSSProperties => ({
  backgroundImage: `url(${staticFile("arte/maestra.jpg")})`,
  backgroundSize: `${260 + (i % 3) * 90}%`,
  backgroundPosition: `${[18, 72, 46, 88, 30, 60, 8, 52, 80][i % 9]}% ${[62, 34, 78, 52, 44, 70, 58, 40, 66][i % 9]}%`,
});

const Relleno: React.FC<{ i: number }> = ({ i }) => (
  <div style={{ height: H_REL, borderRadius: 26, overflow: "hidden", background: "#17110c", border: "1.5px solid rgba(201,161,90,.16)" }}>
    <div style={{ height: 206, ...miniatura(i), filter: "saturate(.75) brightness(.72)" }} />
    <div style={{ padding: "20px 22px", display: "flex", gap: 16, alignItems: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", ...miniatura(i + 4), border: `2px solid ${C.latonOscuro}`, flex: "none" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 18, width: `${62 + (i % 3) * 12}%`, borderRadius: 9, background: "rgba(245,236,221,.3)" }} />
        <div style={{ height: 14, width: `${38 + (i % 4) * 9}%`, borderRadius: 7, background: "rgba(245,236,221,.14)", marginTop: 12 }} />
      </div>
    </div>
  </div>
);

const Tarjeta: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const llega = [T.tarjeta1, T.tarjeta2, T.tarjeta3][k];
  const s = resorte(t, llega - 0.05, 18, 0.45);
  const d = TARJETAS[k];
  return (
    <div style={{ height: H_TARJ, borderRadius: 30, overflow: "hidden", background: "#1c140d", border: `3px solid rgba(255,106,26,${0.25 + 0.75 * Math.min(1, s)})`, transform: `scale(${0.94 + 0.06 * s})`, boxShadow: `0 0 ${60 * Math.min(1, s)}px rgba(255,106,26,.28)` }}>
      <div style={{ height: 278, ...miniatura(k * 2 + 1), filter: "saturate(.9) brightness(.8)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,14,9,.92) 100%)" }} />
        {d.tipo === "video" ? (
          <div style={{ position: "absolute", left: "50%", top: "46%", width: 0, height: 0, marginLeft: -22, marginTop: -34, borderLeft: `58px solid ${C.crema}`, borderTop: "34px solid transparent", borderBottom: "34px solid transparent", opacity: 0.92 }} />
        ) : null}
        <div style={{ position: "absolute", left: 22, top: 20, fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: "0.12em", color: C.negro, background: C.laton, padding: "7px 14px", borderRadius: 9 }}>
          {["nuevo", "tendencia", "día 30"][k]}
        </div>
      </div>
      <div style={{ padding: "22px 28px", fontFamily: SANS, fontWeight: 900, fontSize: k === 2 ? 50 : 56, lineHeight: 1.04, letterSpacing: "-0.03em", color: C.crema, opacity: Math.min(1, s * 4) }}>
        {d.antes}
        {k === 2 ? <br /> : null}
        <span style={{ color: C.naranja }}>{d.acento}</span>
      </div>
    </div>
  );
};

// ---------- lluvia de notificaciones ----------
const T_AVISOS = [9.0, 9.75, 10.5, 11.25, 12.0, 12.375, 12.75, 13.125, 13.5, 13.6875, 13.875, 14.0625];
const Aviso: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const t0 = T_AVISOS[i];
  if (t < t0) return null;
  const s = resorte(t, t0, 15, 0.86);          // casi sin rebote: al caer no debe invadir la zona inferior
  const x = 96 + ruido(i * 3.1) * 190;
  // hasta que llega «y sientes que vas tarde.» dejan libre la franja del texto de las tarjetas
  const y = i < 5 ? 400 + i * 106 : i < 9 ? 1196 + (i - 5) * 62 : 420 + ruido(i * 7.7) * 760;
  const rot = (ruido(i * 5.3) - 0.5) * 7;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 600, height: 98, borderRadius: 28, background: "rgba(22,16,11,.96)", border: "1.5px solid rgba(201,161,90,.5)", boxShadow: "0 18px 40px rgba(0,0,0,.6)", display: "flex", alignItems: "center", gap: 18, padding: "0 26px", transform: `translateY(${(1 - s) * -(y + 160)}px) rotate(${rot * Math.min(1, s)}deg)`, fontFamily: SANS }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.naranja, flex: "none", boxShadow: "0 0 14px rgba(255,106,26,.9)" }} />
      <div style={{ fontWeight: 600, fontSize: 32, color: C.crema, letterSpacing: "-0.01em", whiteSpace: "nowrap", flex: 1 }}>{AVISOS[i]}</div>
      <div style={{ fontWeight: 600, fontSize: 22, color: C.gris }}>ahora</div>
    </div>
  );
};

export const Celular: React.FC<{ t: number }> = ({ t }) => {
  const entra = eo5(prog(t, T.celular, T.celular + 0.5));
  const scroll = scrollEn(t);
  const vel = Math.abs(scroll - scrollEn(t - 1 / 30));
  const velo = eo(prog(t, 13.05, 13.4));                    // todo se apaga cuando llega «y sientes que vas tarde.»
  const zoom = 1 + 0.035 * prog(t, T.celular, T.grafica) + golpe(t, T.tarde, 0.07, 6) + golpe(t, T.tarjeta1, 0.02) + golpe(t, T.tarjeta2, 0.02) + golpe(t, T.tarjeta3, 0.02);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 48%" }}>
      <div style={{ position: "absolute", left: ORIGEN.x, top: ORIGEN.y, width: SP.w, height: SP.h, transform: `translateY(${(1 - entra) * 1500 + Math.sin(t * 1.7) * 7}px) rotate(${Math.sin(t * 1.25) * 0.6}deg)`, transformOrigin: "50% 80%", filter: "drop-shadow(0 30px 50px rgba(0,0,0,.7))" }}>
        <Img src={staticFile("arte/mano.webp")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        {/* la interfaz solo se ve donde la pantalla es negra (los dedos quedan por delante) */}
        <div style={{ position: "absolute", inset: 0, maskImage: `url(${staticFile("arte/mano_pantalla.png")})`, WebkitMaskImage: `url(${staticFile("arte/mano_pantalla.png")})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}>
          <div style={{ position: "absolute", left: PANT.x, top: PANT.y, width: PANT.w, height: PANT.h, overflow: "hidden", background: "#0d0a08", fontFamily: SANS }}>
            <div style={{ position: "absolute", left: 20, right: 20, top: 0, transform: `translateY(${-scroll}px)`, filter: vel > 6 ? `blur(${Math.min(7, vel / 14)}px)` : undefined }}>
              {ITEMS.map((it, i) => (
                <div key={i} style={{ position: "absolute", left: 0, right: 0, top: it.top }}>
                  {it.tipo === "relleno" ? <Relleno i={it.k} /> : <Tarjeta k={it.k} t={t} />}
                </div>
              ))}
            </div>
            {/* cabecera fija */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 132, background: "linear-gradient(180deg, #0d0a08 70%, rgba(13,10,8,0) 100%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "22px 34px 0", fontWeight: 800, fontSize: 24, color: C.crema }}>
                <span>5:00</span>
                <span style={{ color: C.gris, letterSpacing: "0.1em" }}>● ● ●</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 46, marginTop: 14, fontWeight: 800, fontSize: 28 }}>
                <span style={{ color: C.gris }}>siguiendo</span>
                <span style={{ color: C.crema, borderBottom: `4px solid ${C.naranja}`, paddingBottom: 6 }}>para ti</span>
              </div>
            </div>
            {/* brillo de la pantalla */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 38%)" }} />
          </div>
        </div>
      </div>
      {AVISOS.map((_, i) => (
        <Aviso key={i} i={i} t={t} />
      ))}
      <div style={{ position: "absolute", inset: -80, background: "radial-gradient(ellipse 70% 50% at 50% 47%, rgba(4,3,2,.86) 0%, rgba(4,3,2,.6) 100%)", opacity: velo }} />
    </div>
  );
};
