import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setChromiumOpenGlRenderer("angle");   // backdrop-filter consistente
Config.setColorSpace("bt709");               // sin esto el render sale full-range
Config.setPixelFormat("yuv420p");
