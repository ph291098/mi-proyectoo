import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Playfair Display Italic (frases emocionales) e Inter (datos y captions). Ambas OFL, servidas en local.
const fuentes: [string, string, string, "normal" | "italic"][] = [
  ["Playfair Display", "playfair-display-latin-700-italic.woff2", "700", "italic"],
  ["Playfair Display", "playfair-display-latin-900-italic.woff2", "900", "italic"],
  ["Inter", "inter-latin-600-normal.woff2", "600", "normal"],
  ["Inter", "inter-latin-800-normal.woff2", "800", "normal"],
  ["Inter", "inter-latin-900-normal.woff2", "900", "normal"],
];
for (const [family, archivo, weight, style] of fuentes) {
  loadFont({ family, url: staticFile(`fonts/${archivo}`), weight, style });
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
