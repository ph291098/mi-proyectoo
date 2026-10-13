import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// estilo.md §2: sans grotesca (600 normal / 800 destacada), serif cursiva para conceptos, mono para etiquetas.
loadFont({ family: "Inter Tight", url: staticFile("fonts/InterTight.ttf"), weight: "100 900" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/InstrumentSerif-Italic.ttf"), style: "italic" });
loadFont({ family: "JetBrains Mono", url: staticFile("fonts/JetBrainsMono.ttf"), weight: "100 800" });

export const SANS = `"Inter Tight", sans-serif`;
export const SERIF = `"Instrument Serif", serif`;
export const MONO = `"JetBrains Mono", monospace`;
