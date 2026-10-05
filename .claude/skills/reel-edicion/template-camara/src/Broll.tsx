import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SAFE } from "./theme";
import { at, outAt, mix, SPR } from "./anim";
import { Logo, type LogoId } from "./Logos";
import { fontFamily } from "./fonts";


/** B-roll (vídeo o imagen). Dos modos:
 *  - `full`: CORTE a pantalla completa — sustituye al plano mientras la voz sigue. Entra y
 *    sale en seco (es un corte, no una tarjeta); el movimiento lo pone un empujón de escala.
 *    Con imagen: la foto de producto va entera (contain) sobre ella misma desenfocada.
 *  - ventana (por defecto): recuadro centrado en `cy`.
 *  `from`: segundo del vídeo fuente que suena en `start` (siempre mudo).
 *  `tag`/`sub`: rótulo abajo a la izquierda; `credit`: de quién es el material. */
export type BrollData = {
  kind: "video" | "image"; src: string; start: number; end: number;
  from?: number; full?: boolean; cy?: number; w?: number; h?: number; fit?: "cover" | "contain";
  credit?: string; logo?: LogoId; bg?: string; tag?: string; sub?: string; tagCy?: number;
  zoom?: [number, number]; origin?: string;
  /** `full` + imagen: sin la copia desenfocada detrás, fondo liso `bg` (fotos de estudio sobre negro) */
  plain?: boolean;
};

const Media: React.FC<{ b: BrollData; fit: "cover" | "contain"; scale: number; blur?: number }> = ({ b, fit, scale, blur }) => {
  const { fps } = useVideoConfig();
  const style: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit,
    transform: `scale(${scale})`, transformOrigin: b.origin ?? "50% 50%",
    filter: blur ? `blur(${blur}px) brightness(0.55) saturate(1.2)` : undefined,
  };
  return b.kind === "video" ? (
    <Sequence from={Math.round(b.start * fps)} layout="none">
      <OffthreadVideo src={staticFile(b.src)} muted startFrom={Math.round((b.from ?? 0) * fps)} style={style} />
    </Sequence>
  ) : <Img src={staticFile(b.src)} style={style} />;
};

const Tag: React.FC<{ b: BrollData; t: number }> = ({ b, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!b.tag) return null;
  const p = at(frame, fps, b.start + 0.05, SPR.snap);
  return (
    <div style={{
      position: "absolute", left: SAFE.x0, top: (b.tagCy ?? 1160) - 50,
      transform: `translateX(${mix(p, -60, 0)}px)`, opacity: Math.min(1, p * 1.4),
      display: "flex", alignItems: "center", gap: 14, padding: "12px 22px 12px 16px",
      borderRadius: 16, background: "rgba(12,10,8,0.84)", border: "1px solid rgba(140,130,114,0.45)",
      fontFamily, color: COLORS.text,
    }}>
      {b.logo ? <Logo id={b.logo} size={50} /> : null}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
        <span style={{ fontWeight: 800, fontSize: 46, letterSpacing: "-0.01em" }}>{b.tag}</span>
        {b.sub ? <span style={{ fontWeight: 700, fontSize: 29, color: COLORS.soft, opacity: 0.8, marginTop: 4 }}>{b.sub}</span> : null}
      </div>
    </div>
  );
};

const Credit: React.FC<{ b: BrollData; top?: number; bottom?: number; right: number }> = ({ b, top, bottom, right }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!b.credit) return null;
  return (
    <div style={{
      position: "absolute", right, top, bottom, display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px", borderRadius: 999, background: "rgba(10,8,6,0.78)",
      color: COLORS.soft, fontFamily, fontWeight: 700, fontSize: 21, letterSpacing: "0.02em",
      opacity: at(frame, fps, b.start + 0.2, SPR.soft),
    }}>
      {b.credit}
    </div>
  );
};

export const Broll: React.FC<{ b: BrollData }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < b.start || t >= b.end) return null;
  const k = Math.min(1, (t - b.start) / Math.max(0.3, b.end - b.start));
  const [z0, z1] = b.zoom ?? [1.08, 1.0];

  if (b.full) {
    const fit = b.fit ?? (b.kind === "video" ? "cover" : "contain");
    // empujón de entrada: el corte se lee como cámara que llega, no como diapositiva
    const kick = 1 + 0.05 * (1 - at(frame, fps, b.start, SPR.snap));
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: b.bg ?? COLORS.ink }}>
        {fit === "contain" && !b.plain ? <Media b={b} fit="cover" scale={1.25} blur={38} /> : null}
        <div style={{ position: "absolute", inset: fit === "contain" ? "300px 70px 560px 70px" : 0 }}>
          <Media b={b} fit={fit} scale={mix(k, z0, z1) * kick} />
        </div>
        <Tag b={b} t={t} />
        <Credit b={b} top={fit === "contain" ? 316 : 200} right={fit === "contain" ? 86 : 180} />
      </div>
    );
  }

  const w = b.w ?? 600, h = b.h ?? 340, cy = b.cy ?? 360;
  const inP = at(frame, fps, b.start, SPR.snap);
  const outP = outAt(t, b.end, 0.3);
  const cx = (SAFE.x0 + SAFE.x1) / 2;
  return (
    <>
      <div style={{
        position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h,
        borderRadius: 22, overflow: "hidden", background: b.bg ?? "#0b0a09",
        border: "1px solid rgba(140,130,114,0.45)",
        boxShadow: "0 26px 70px -22px rgba(0,0,0,0.9)",
        clipPath: `inset(${(1 - inP) * 50}% 0 ${(1 - inP) * 50}% 0 round 22px)`,
        transform: `translateY(${mix(outP, -26, 0)}px) scale(${mix(inP, 0.94, 1)})`,
        filter: outP < 1 ? `blur(${mix(outP, 8, 0)}px)` : "none",
        opacity: outP,
      }}>
        <Media b={b} fit={b.fit ?? "contain"} scale={mix(k, 1.0, 1.04)} />
        <Credit b={b} bottom={12} right={12} />
      </div>
      <Tag b={b} t={t} />
    </>
  );
};
