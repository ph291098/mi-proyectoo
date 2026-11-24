import { continueRender, delayRender } from "remotion";
import datos from "./data/fuentes.json";

// Playfair Display Italic (frases emocionales) e Inter (datos y captions). Ambas OFL.
// Van incrustadas en base64 (src/data/fuentes.json, generado desde public/fonts/): así no dependen de
// ninguna descarga durante el render, que en algunos navegadores headless se quedaba colgada.
if (typeof document !== "undefined") {
  const estilo = document.createElement("style");
  estilo.textContent = datos
    .map((f) => `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${f.b64}) format("woff2");}`)
    .join("");
  document.head.appendChild(estilo);
  const espera = delayRender("tipografías");
  Promise.all(datos.map((f) => document.fonts.load(`${f.style} ${f.weight} 40px "${f.family}"`)))
    .catch(() => undefined)
    .then(() => continueRender(espera));
}

export const SERIF = '"Playfair Display", Georgia, serif';
export const SANS = '"Inter", system-ui, sans-serif';

export const C = {
  negro: "#070504",
  naranja: "#FF6A1A",
  laton: "#C9A15A",
  latonOscuro: "#7A5A2A",
  crema: "#F5ECDD",
  gris: "#9A8F80",
};
