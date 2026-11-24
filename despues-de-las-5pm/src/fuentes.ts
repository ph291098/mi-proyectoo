import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import datos from "./data/fuentes.json";

// Playfair Display Italic (frases emocionales) e Inter (datos y captions). Ambas OFL.
// Van incrustadas en base64 (src/data/fuentes.json, generado desde public/fonts/): así no dependen de
// ninguna descarga durante el render.
if (typeof document !== "undefined") {
  const estilo = document.createElement("style");
  estilo.textContent = datos
    .map((f) => `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${f.b64}) format("woff2");}`)
    .join("");
  document.head.appendChild(estilo);
}

/**
 * Espera a que las tipografías estén listas antes de pintar. Va dentro del componente (no a nivel de
 * módulo) porque Remotion también evalúa el módulo en páginas que nunca pintan, y allí la espera no
 * terminaba y tiraba el render. Si algo falla, sigue a los 10 s en vez de bloquear.
 */
export const useFuentes = () => {
  const [espera] = useState(() => delayRender("tipografías"));
  useEffect(() => {
    let hecho = false;
    const listo = () => {
      if (!hecho) {
        hecho = true;
        continueRender(espera);
      }
    };
    Promise.all(datos.map((f) => document.fonts.load(`${f.style} ${f.weight} 40px "${f.family}"`))).then(listo, listo);
    const reloj = setTimeout(listo, 10000);
    return () => clearTimeout(reloj);
  }, [espera]);
};

export const SERIF = '"Playfair Display", Georgia, serif';
export const SANS = '"Inter", system-ui, sans-serif';
export const MANO = '"Caveat", cursive';

export const C = {
  negro: "#070504",
  naranja: "#FF6A1A",
  laton: "#C9A15A",
  latonOscuro: "#7A5A2A",
  crema: "#F5ECDD",
  gris: "#9A8F80",
};
