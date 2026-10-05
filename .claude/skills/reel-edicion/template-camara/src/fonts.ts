// GENERADO por scripts/aplica_perfil.py — cambia la fuente en tu perfil, no aquí.
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"], ignoreTooManyRequestsWarning: true,
});
export const { fontFamily: mono } = loadMono("normal", {
  weights: ["500", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});
