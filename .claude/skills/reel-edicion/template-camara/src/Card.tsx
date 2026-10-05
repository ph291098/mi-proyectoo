import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS, CARD_BAND, SAFE } from "./theme";
import { Logo, LOGO_COLOR, type LogoId } from "./Logos";
import { at, outAt, mix, SPR, cuenta } from "./anim";
import { ICONS } from "./Icons";
import { fontFamily } from "./fonts";


/** Una tarjeta NUNCA repite lo que dice la voz: contrasta, deduce o remata. */
/** `cy` opcional: centro vertical de la tarjeta cuando el sujeto ocupa la banda por defecto. */
export type CardData = { cy?: number; h?: number } & (
  | { t: "contrast"; start: number; end: number; kicker?: string;
      left: { title: string; items: string[]; logo?: LogoId };
      right: { title: string; items: string[]; logo?: LogoId } }
  | { t: "logos"; start: number; end: number; kicker?: string; line?: string; logos: LogoId[] }
  | { t: "stat"; start: number; end: number; kicker?: string; value: string; label: string }
  /** `swap`: lo que cada servicio self-hosted sustituye, y lo que ese sustituto cuesta al mes.
   *  Es una DEDUCCIÓN — él nunca habla de precios —, así que no repite la voz.
   *  `at` ata cada fila al segundo en que él NOMBRA ese servicio: la tabla se escribe
   *  a su ritmo en vez de desfilar sola. `total.num` hace que la cifra suba. */
  | { t: "swap"; start: number; end: number; kicker?: string;
      rows: { from?: LogoId; fromIcon?: string; fromLabel: string;
              to?: LogoId; toIcon?: string; toLabel: string; price: string; at?: number }[];
      total?: { label: string; prefix?: string; num: number; suffix?: string; decimals?: number } }
  /** `specs`: ficha técnica. Icono + concepto + valor. Para el NAS, que es el
   *  protagonista del vídeo y del que él casi no da datos. */
  | { t: "specs"; start: number; end: number; kicker?: string;
      rows: { icon: string; label: string; value?: string; at?: number }[] }
  /** `bill`: el resumen. Concepto -> precio, sin la columna de "a cambio de qué",
   *  y un total grande que sube. Es el remate, no el desglose. */
  | { t: "bill"; start: number; end: number; kicker?: string;
      rows: { logo?: LogoId; icon?: string; label: string; price: string; at?: number }[];
      total: { label: string; prefix?: string; num: number; suffix?: string; nota?: string } }
  | { t: "point"; start: number; end: number; kicker?: string; lines: string[] });

/** El panel vive en la banda del torso/teclado (ver theme.ts), nunca sobre la
 *  cara. Mientras está en pantalla los subtítulos callan: una sola cosa que leer.
 *
 *  ENTRADA: se abre con un barrido de izquierda a derecha (clip-path) + muelle.
 *  SALIDA:  se desvanece hacia abajo con desenfoque. No es la entrada al revés. */
export const Shell: React.FC<{ p: number; inP: number; outP: number; cy?: number; h?: number; children: React.ReactNode }> =
  ({ p, inP, outP, cy = CARD_BAND.cy, h = CARD_BAND.h, children }) => (
  <>
    {/* Sin velo a pantalla completa: con muchos paneles, un negro sobre TODO el plano deja al
        que habla a oscuras media pieza. El panel lleva su propio fondo y se lee solo. */}
    <div style={{
      position: "absolute", left: SAFE.x0, width: SAFE.x1 - SAFE.x0,
      top: cy - h / 2, minHeight: h,
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "34px 40px", boxSizing: "border-box", fontFamily,
      background: `rgba(10,8,6,${0.88 * p})`,
      backdropFilter: `blur(${12 * p}px)`,
      border: `1px solid rgba(140,130,114,${0.42 * p})`,
      borderRadius: 22,
      boxShadow: `0 26px 70px -22px rgba(0,0,0,${0.85 * p})`,
      clipPath: `inset(0 ${(1 - inP) * 100}% 0 0 round 22px)`,
      transform: `translateY(${mix(outP, 30, 0)}px)`,
      filter: outP < 1 ? `blur(${mix(outP, 9, 0)}px)` : "none",
      opacity: outP,
    }}>{children}</div>
  </>
);

/** Icono Lucide inline (src/Icons.ts). Los conceptos van con icono; las marcas,
 *  con su logo real. Mezclarlos en la misma columna es lo que deja leer una tabla
 *  donde no todo lo que corre en casa tiene marca. */
const Ico: React.FC<{ id: string; size: number; color: string }> = ({ id, size, color }) => {
  const inner = ICONS[id];
  if (!inner) return <div style={{ width: size, height: size }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: "block" }} dangerouslySetInnerHTML={{ __html: inner }} />
  );
};

/** El kicker no aparece: se dibuja de izquierda a derecha con su propia regla. */
export const CardKicker: React.FC<{ text?: string; start: number }> = ({ text, start }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  if (!text) return null;
  const p = at(frame, fps, start + 0.14, SPR.soft);
  return (
    <div style={{ marginBottom: 22, overflow: "hidden" }}>
      <div style={{
        color: COLORS.line, fontSize: 25, fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase",
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
      }}>{text}</div>
      <div style={{ height: 2, marginTop: 12, width: `${p * 100}%`,
                    background: "rgba(140,130,114,0.4)" }} />
    </div>
  );
};

export const Card: React.FC<{ card: CardData }> = ({ card }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < card.start || t >= card.end) return null;
  const inP  = at(frame, fps, card.start, SPR.snap);
  const outP = outAt(t, card.end, 0.34);
  const p = Math.min(inP, outP);
  const S = { p, inP, outP, cy: card.cy, h: card.h };

  if (card.t === "contrast") {
    const Col: React.FC<{ c: { title: string; items: string[]; logo?: LogoId }; accent: string; delay: number }> =
      ({ c, accent, delay }) => {
      const cp = at(frame, fps, card.start + delay, SPR.snap);
      const lp = at(frame, fps, card.start + delay + 0.08, SPR.pop);
      return (
        <div style={{ flex: 1, transform: `translateY(${mix(cp, 24, 0)}px)`, opacity: cp }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            {c.logo ? (
              <div style={{ transform: `scale(${mix(lp, 0.3, 1)}) rotate(${mix(lp, -22, 0)}deg)` }}>
                <Logo id={c.logo} size={44} />
              </div>
            ) : null}
            <div style={{ color: accent, fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {c.title}
            </div>
          </div>
          {c.items.map((it, i) => {
            const ip = at(frame, fps, card.start + delay + 0.16 + i * 0.09, SPR.soft);
            return (
              <div key={i} style={{
                color: COLORS.soft, fontSize: 32, fontWeight: 600, lineHeight: 1.34,
                opacity: ip * 0.95, transform: `translateY(${mix(ip, 12, 0)}px)`,
              }}>{it}</div>
            );
          })}
        </div>
      );
    };
    const divider = at(frame, fps, card.start + 0.1, SPR.soft);
    return (
      <Shell {...S}>
        <CardKicker text={card.kicker} start={card.start} />
        <div style={{ display: "flex", gap: 34, alignItems: "stretch" }}>
          <Col c={card.left} accent={LOGO_COLOR[card.left.logo ?? "claude"]} delay={0.08} />
          <div style={{ width: 2, background: "rgba(140,130,114,0.45)",
                        transform: `scaleY(${divider})`, transformOrigin: "top" }} />
          <Col c={card.right} accent={(card.right.logo ? LOGO_COLOR[card.right.logo] : COLORS.accent)} delay={0.2} />
        </div>
      </Shell>
    );
  }

  /** Fila de marcas: cada logo entra con rebote y un retardo propio. */
  if (card.t === "logos") {
    return (
      <Shell {...S}>
        <CardKicker text={card.kicker} start={card.start} />
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: card.line ? 26 : 0 }}>
          {card.logos.map((id, i) => {
            const lp = at(frame, fps, card.start + 0.14 + i * 0.11, SPR.pop);
            return (
              <div key={id} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                transform: `scale(${mix(lp, 0.2, 1)}) translateY(${mix(lp, 26, 0)}px)`, opacity: lp,
              }}>
                <div style={{ filter: `drop-shadow(0 0 22px ${LOGO_COLOR[id]}66)` }}>
                  <Logo id={id} size={78} />
                </div>
              </div>
            );
          })}
        </div>
        {card.line ? (() => {
          const sp = at(frame, fps, card.start + 0.42, SPR.soft);
          return (
            <div style={{
              color: COLORS.text, fontSize: 44, fontWeight: 800, lineHeight: 1.22,
              letterSpacing: "-0.02em", textAlign: "center",
              transform: `translateY(${mix(sp, 16, 0)}px)`, opacity: sp,
            }}>{card.line}</div>
          );
        })() : null}
      </Shell>
    );
  }

  if (card.t === "stat") {
    const vp = at(frame, fps, card.start + 0.1, SPR.pop);
    return (
      <Shell {...S}>
        <CardKicker text={card.kicker} start={card.start} />
        <div style={{
          color: COLORS.accent, fontSize: 150, fontWeight: 800, lineHeight: 0.92,
          letterSpacing: "-0.045em",
          transform: `scale(${mix(vp, 0.55, 1)})`, transformOrigin: "left center", opacity: vp,
        }}>{card.value}</div>
        <div style={{ color: COLORS.soft, fontSize: 36, fontWeight: 700, marginTop: 18,
                      lineHeight: 1.28, whiteSpace: "pre-line" }}>{card.label}</div>
      </Shell>
    );
  }

  /** Cada fila cruza el cuadro de izquierda a derecha: lo que corre en casa, la flecha,
   *  y lo que habría que pagar. El precio entra el último y en color de acento — es el remate de la fila. */
  if (card.t === "swap") {
    return (
      <Shell {...S}>
        <CardKicker text={card.kicker} start={card.start} />
        {card.rows.map((r, i) => {
          // cada fila entra cuando él NOMBRA ese servicio; sin `at`, escalonada
          const d  = r.at ?? (card.start + 0.16 + i * 0.13);
          const rp = at(frame, fps, d, SPR.snap);              // la fila entra desde la izquierda
          const ap = at(frame, fps, d + 0.09, SPR.soft);       // la flecha se dibuja después
          const pp = at(frame, fps, d + 0.16, SPR.pop);        // el precio remata
          const Side: React.FC<{ logo?: LogoId; icon?: string; label: string; dim?: boolean }> =
            ({ logo, icon, label, dim }) => (
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              {logo ? <Logo id={logo} size={34} />
                    : icon ? <Ico id={icon} size={34} color={dim ? COLORS.line : COLORS.soft} />
                    : (
                <div style={{ width: 34, height: 34, borderRadius: 9,
                              border: `2px solid rgba(140,130,114,0.55)`, boxSizing: "border-box" }} />
              )}
              <div style={{
                color: dim ? COLORS.line : COLORS.text, fontSize: 28, fontWeight: 700,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{label}</div>
            </div>
          );
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 14,
              transform: `translateX(${mix(rp, -26, 0)}px)`, opacity: rp,
            }}>
              {/* la columna de la izquierda va más ancha: los nombres self-hosted son
                  descriptivos («gestor de claves», «72 TB en casa») y con las dos
                  columnas iguales se cortaban con puntos suspensivos. */}
              <div style={{ flex: "1.22 1 0", minWidth: 0 }}>
                <Side logo={r.from} icon={r.fromIcon} label={r.fromLabel} />
              </div>
              {/* la flecha se dibuja, no aparece: el cambio es el gesto de la fila */}
              <div style={{ width: 40, opacity: ap, transform: `translateX(${mix(ap, -10, 0)}px)` }}>
                <svg width={40} height={16} viewBox="0 0 40 16">
                  <path d="M0 8 H30 M24 2 L31 8 L24 14" stroke={COLORS.line} strokeWidth={2.4}
                        fill="none" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={44} strokeDashoffset={mix(ap, 44, 0)} />
                </svg>
              </div>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Side logo={r.to} icon={r.toIcon} label={r.toLabel} dim />
              </div>
              <div style={{
                color: COLORS.accent, fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em",
                textAlign: "right", minWidth: 118, whiteSpace: "nowrap",
                transform: `scale(${mix(pp, 0.6, 1)})`, transformOrigin: "right center", opacity: pp,
              }}>{r.price}</div>
            </div>
          );
        })}
        {card.total ? (() => {
          // el total sube desde que cae la primera fila hasta poco después de la última:
          // se ve acumularse, que es de lo que va la tarjeta
          const ini = card.rows[0]?.at ?? card.start + 0.16;
          const fin = (card.rows[card.rows.length - 1]?.at ?? card.start + card.rows.length * 0.13) + 0.55;
          const sube = Math.max(0, Math.min(1, (t - ini) / Math.max(0.35, fin - ini)));
          const tp = at(frame, fps, ini, SPR.snap);
          return (
            <>
              <div style={{ height: 2, marginTop: 10, marginBottom: 16, width: `${tp * 100}%`,
                            background: "rgba(140,130,114,0.45)" }} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
                            opacity: tp, transform: `translateY(${mix(tp, 14, 0)}px)` }}>
                <div style={{ color: COLORS.soft, fontSize: 30, fontWeight: 700,
                              letterSpacing: "0.06em", textTransform: "uppercase" }}>{card.total.label}</div>
                <div style={{ color: COLORS.accent, fontSize: 62, fontWeight: 800,
                              letterSpacing: "-0.035em" }}>
                  {(card.total.prefix ?? "") + cuenta(sube, card.total.num, card.total.decimals ?? 0)
                   + (card.total.suffix ?? "")}
                </div>
              </div>
            </>
          );
        })() : null}
      </Shell>
    );
  }

  /** Ficha técnica: icono · concepto · valor. Las filas entran de una en una y la
   *  regla de la izquierda se dibuja de arriba abajo, como una lista que se escribe. */
  if (card.t === "specs") {
    return (
      <Shell {...S}>
        <CardKicker text={card.kicker} start={card.start} />
        {card.rows.map((r, i) => {
          const d  = r.at ?? (card.start + 0.18 + i * 0.12);
          const rp = at(frame, fps, d, SPR.snap);
          const ip = at(frame, fps, d + 0.05, SPR.pop);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 18, marginBottom: 14,
              transform: `translateX(${mix(rp, -22, 0)}px)`, opacity: rp,
            }}>
              <div style={{ transform: `scale(${mix(ip, 0.4, 1)})`, flexShrink: 0 }}>
                <Ico id={r.icon} size={38} color={COLORS.accent} />
              </div>
              <div style={{ color: COLORS.text, fontSize: 33, fontWeight: 800,
                            letterSpacing: "-0.02em", flex: "1 1 0", minWidth: 0 }}>{r.label}</div>
              {r.value ? (
                <div style={{ color: COLORS.soft, fontSize: 29, fontWeight: 700,
                              textAlign: "right", whiteSpace: "nowrap" }}>{r.value}</div>
              ) : null}
            </div>
          );
        })}
      </Shell>
    );
  }

  /** La factura: concepto -> precio y un total que sube. Es el remate del argumento,
   *  no el desglose — ese ya se vio bloque a bloque. */
  if (card.t === "bill") {
    const ini = card.rows[0]?.at ?? card.start + 0.18;
    const fin = (card.rows[card.rows.length - 1]?.at ?? card.start + card.rows.length * 0.16) + 0.6;
    const sube = Math.max(0, Math.min(1, (t - ini) / Math.max(0.35, fin - ini)));
    const tp = at(frame, fps, fin - 0.35, SPR.snap);
    return (
      <Shell {...S}>
        <CardKicker text={card.kicker} start={card.start} />
        {card.rows.map((r, i) => {
          const d  = r.at ?? (card.start + 0.18 + i * 0.16);
          const rp = at(frame, fps, d, SPR.snap);
          const pp = at(frame, fps, d + 0.12, SPR.pop);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 12,
              transform: `translateX(${mix(rp, -22, 0)}px)`, opacity: rp,
            }}>
              {r.logo ? <Logo id={r.logo} size={34} />
                      : <Ico id={r.icon ?? "server"} size={34} color={COLORS.line} />}
              <div style={{ color: COLORS.text, fontSize: 31, fontWeight: 700,
                            flex: "1 1 0", minWidth: 0, whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
              {/* la línea de puntos ata concepto y precio: se lee como una factura */}
              <div style={{ flex: "0 1 90px", height: 2, opacity: 0.35 * rp,
                            backgroundImage: "radial-gradient(circle, rgba(140,130,114,0.9) 1px, transparent 1px)",
                            backgroundSize: "8px 2px" }} />
              <div style={{ color: COLORS.accent, fontSize: 33, fontWeight: 800,
                            textAlign: "right", minWidth: 128, whiteSpace: "nowrap",
                            transform: `scale(${mix(pp, 0.6, 1)})`, transformOrigin: "right center",
                            opacity: pp }}>{r.price}</div>
            </div>
          );
        })}
        <div style={{ height: 2, marginTop: 12, marginBottom: 16, width: `${tp * 100}%`,
                      background: "rgba(140,130,114,0.5)" }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ color: COLORS.soft, fontSize: 30, fontWeight: 700,
                        letterSpacing: "0.06em", textTransform: "uppercase" }}>{card.total.label}</div>
          <div style={{ color: COLORS.accent, fontSize: 76, fontWeight: 800, letterSpacing: "-0.04em",
                        textShadow: `0 0 34px ${COLORS.accent}44` }}>
            {(card.total.prefix ?? "") + cuenta(sube, card.total.num) + (card.total.suffix ?? "")}
          </div>
        </div>
        {card.total.nota ? (
          <div style={{ color: COLORS.line, fontSize: 27, fontWeight: 700, marginTop: 8,
                        textAlign: "right", opacity: tp }}>{card.total.nota}</div>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell {...S}>
      <CardKicker text={card.kicker} start={card.start} />
      {card.lines.map((l, i) => {
        const lp = at(frame, fps, card.start + 0.14 + i * 0.14, SPR.snap);
        return (
          <div key={i} style={{
            color: i === 0 ? COLORS.text : COLORS.accent,
            fontSize: 50, fontWeight: 800,
            lineHeight: 1.24, marginBottom: 10, letterSpacing: "-0.02em",
            // cada línea entra desde su lado: la segunda contradice a la primera
            transform: `translateX(${mix(lp, i % 2 === 0 ? -30 : 30, 0)}px)`,
            opacity: lp,
            clipPath: i % 2 === 0
              ? `inset(0 ${(1 - lp) * 100}% 0 0)`   // la primera se descubre hacia la derecha
              : `inset(0 0 0 ${(1 - lp) * 100}%)`,  // la segunda, hacia la izquierda
          }}>{l}</div>
        );
      })}
    </Shell>
  );
};
