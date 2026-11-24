// Saca fotogramas sueltos (o una hoja de contacto) sin renderizar el vídeo entero.
//   node scripts/fotos.mjs <carpeta> <t1> <t2> ...        (tiempos en segundos)
//   node scripts/fotos.mjs <carpeta> --cada 0.5           (un fotograma cada 0,5 s)
//   COMP=Ep2ConVoz node scripts/fotos.mjs ...            (otra composición; por defecto, ConVoz)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const NAVEGADOR = process.env.NAVEGADOR ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const [, , carpeta, ...resto] = process.argv;
fs.mkdirSync(carpeta, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? "ConVoz", browserExecutable: NAVEGADOR });
let tiempos = resto.map(Number);
if (resto[0] === "--cada") {
  const paso = Number(resto[1]);
  tiempos = [];
  for (let t = 0; t < composition.durationInFrames / composition.fps - 1e-6; t += paso) tiempos.push(Math.round(t * 100) / 100);
}
for (const t of tiempos) {
  const salida = path.join(carpeta, `t${t.toFixed(2).padStart(5, "0")}.jpg`);
  await renderStill({ composition, serveUrl, output: salida, frame: Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)), imageFormat: "jpeg", jpegQuality: 88, browserExecutable: NAVEGADOR });
}
console.log("ok", tiempos.length, "fotogramas en", carpeta);
