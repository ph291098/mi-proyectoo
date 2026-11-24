import { Config } from "@remotion/cli/config";
import fs from "node:fs";

// En la nube de Claude Code no se puede descargar el navegador de Remotion: se usa el headless shell
// de Playwright si existe (o el que indique la variable NAVEGADOR). En tu equipo, Remotion usa el suyo.
const navegador = process.env.NAVEGADOR ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(navegador)) Config.setBrowserExecutable(navegador);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setDelayRenderTimeoutInMilliseconds(120000);
Config.setConcurrency(2);
Config.setCodec("h264");
Config.setCrf(17);
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setAudioCodec("aac");
Config.setAudioBitrate("256k");
