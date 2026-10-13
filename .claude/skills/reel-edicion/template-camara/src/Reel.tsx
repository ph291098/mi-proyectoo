import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Caption } from "@remotion/captions";
import { Plate, Scrim, type Span } from "./Plate";
import { Title, type TitleData } from "./Title";
import { Card, type CardData } from "./Card";
import { Captions } from "./Captions";
import { Kicker, KeywordChip, Handle, type Keyword } from "./Chrome";
import { TopicChip, type Topic } from "./TopicChip";
import { Sfx, type Cue } from "./Sfx";
import { Teaser, type TeaserData } from "./Teaser";
import { Sections, type Section } from "./Sections";
import { Flow, type FlowData } from "./Flow";
import { Track, type TrackData } from "./Track";
import { LOGO_COLOR } from "./Logos";
import { CAPTION_CY, FLOW_CAPTION_CY, COLORS, TOPIC_ALIGN, CAPTIONS } from "./theme";
import { Escenas, type EscenasData } from "./Escenas";
import { Broll, type BrollData } from "./Broll";
import { Grandes, type PasosData, type PreguntaData } from "./Grandes";

export type ReelData = {
  src: string; voice: string; kicker: string; handle: string;
  spans: Span[]; cards: CardData[];
  title: TitleData | null;
  topics: Topic[];
  keyword: Keyword | null;
  /** golpes de movimiento que hacen de corte donde el plano es continuo (s) */
  punches: number[];
  /** tramos en ms donde los subtítulos ceden el turno a una tarjeta */
  hide: Array<[number, number]>;
  sfx: Cue[];
  captions: Caption[];
  /** tramos (s) donde los subtítulos cambian de sitio/tamaño porque la banda
   *  por defecto tapa lo que se está enseñando (p.ej. el portátil de la escena 1) */
  capZones?: Array<{ start: number; end: number; cy: number; size?: number; maxWords?: number; x0?: number; x1?: number }>;
  /** cuándo entra el kicker (s); por defecto 0 o al salir el título */
  kickerFrom?: number;
  /** lista difuminada del hook (temas que vienen, sin dejar leerlos) */
  teaser?: TeaserData | null;
  /** índice numerado de secciones; sustituye al kicker desde la primera */
  sections?: Section[];
  /** diagramas de proceso animados; mientras están, los subtítulos suben a la barbilla */
  flows?: FlowData[];
  /** tramos donde él invade la banda del raíl o la del chip de marca: el rótulo
   *  se aparta solo en vez de quedarse sobre su cara. Los calcula scripts/aparta.py. */
  muteRail?: Array<[number, number]>;
  muteTopic?: Array<[number, number]>;
  /** etiquetas ancladas a una zona del plano, que la siguen mientras la cámara se mueve.
   *  No callan a los subtítulos: son un señalador, no un bloque de texto que leer. */
  tracks?: TrackData[];
  /** tramos (s) con pantalla dividida, de scripts/layout.py: el scrim cambia con ellos */
  split?: Array<[number, number]>;
  /** grafismo de suspenso y drama (Escenas.tsx) */
  escenas?: EscenasData | null;
  /** cama musical montada por scripts/musica.py en public/; gain en dB */
  music?: { src: string; gain: number } | null;
  /** B-roll: cortes a pantalla completa (`full`) o ventana (Broll.tsx) */
  broll?: BrollData[];
  /** grafismo grande: pasos con iconos que se dibujan y la pregunta final (Grandes.tsx) */
  grandes?: { pasos?: PasosData[]; pregunta?: PreguntaData | null } | null;
};

export const Reel: React.FC<{ data: ReelData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // El resalte del subtítulo toma el color de la marca de la que se habla ahora
  // (CAPTIONS.byBrand): así el color de acento no hace seis trabajos y queda para el CTA.
  const topic = data.topics.find((x) => t >= x.start && t < x.end);
  const accent = CAPTIONS.byBrand && topic ? LOGO_COLOR[topic.logo] : COLORS.highlight;
  // zonas de subtítulo: las declaradas + el resto del reel en la banda por defecto
  const zones = React.useMemo(() => {
    const flowMoved = (FLOW_CAPTION_CY as number) !== CAPTION_CY;   // si no se mueven, conservan cuerpo y ancho
    // Solo se generan zonas para los diagramas si de verdad MUEVEN los subtítulos. Antes
    // se generaban siempre, a 80 px y 4 palabras, y PISABAN las cap_zones declaradas:
    // en un split screen eso subía subtítulos gigantes a la cara.
    const auto = !flowMoved ? [] : (data.flows ?? []).map((f) => ({ start: f.start, end: f.end, cy: FLOW_CAPTION_CY, size: 64, maxWords: 3 }));
    const decl = [...(data.capZones ?? []), ...auto].sort((a, b) => a.start - b.start);
    const out: Array<{ start: number; end: number; cy: number; size?: number; maxWords?: number; x0?: number; x1?: number }> = [];
    let cur = 0;
    for (const z of decl) {
      if (z.start > cur) out.push({ start: cur, end: z.start, cy: CAPTION_CY });
      out.push(z); cur = z.end;
    }
    out.push({ start: cur, end: 1e9, cy: CAPTION_CY });
    return out;
  }, [data.capZones, data.flows]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Plate src={data.src} spans={data.spans} punches={data.punches} />
      <Scrim split={data.split} />
      {data.title ? <Title title={data.title} /> : null}
      {TOPIC_ALIGN === "chip" ? <TopicChip topics={data.topics} mute={data.muteTopic} /> : null}
      {data.cards.map((c, i) => <Card key={i} card={c} />)}
      {(data.flows ?? []).map((f, i) => <Flow key={`f${i}`} flow={f} />)}
      {(data.tracks ?? []).map((k, i) => <Track key={`t${i}`} data={k} />)}
      {data.teaser ? <Teaser data={data.teaser} /> : null}
      {/* encima de tarjetas y diagramas (un sello puede rematar un panel), debajo de los subtítulos */}
      {(data.broll ?? []).map((b, i) => <Broll key={`b${i}`} b={b} />)}
      <Escenas e={data.escenas} />
      {data.grandes ? <Grandes pasos={data.grandes.pasos} pregunta={data.grandes.pregunta} /> : null}
      <Kicker text={data.kicker} from={data.kickerFrom ?? (data.title ? data.title.end - 0.25 : 0)}
              until={data.sections?.[0]?.start ?? data.keyword?.start} mute={data.muteRail}
              logo={TOPIC_ALIGN === "inline" ? data.topics[0]?.logo : undefined} />
      {data.sections ? <Sections sections={data.sections} mute={data.muteRail} /> : null}
      {data.keyword ? <KeywordChip kw={data.keyword} /> : null}
      {/* CAPTIONS.band decide píldora o texto suelto con trazo y sombra. Cada zona recibe SOLO
          sus palabras para que la paginación no cruce de una zona a otra. */}
      {zones.map((z, i) => (
        <Captions key={i}
                  captions={data.captions.filter((c) => c.startMs >= z.start * 1000 && c.startMs < z.end * 1000)}
                  cy={z.cy} x0={z.x0} x1={z.x1} maxWords={z.maxWords ?? CAPTIONS.maxWords} size={z.size ?? CAPTIONS.size}
                  show={[[z.start * 1000, z.end * 1000]]}
                  hide={data.hide} accent={accent} />
      ))}
      <Handle text={data.handle} hide={[...data.hide, ...(data.flows ?? []).map((f) => [f.start * 1000, f.end * 1000] as [number, number])]} />
      {data.music ? <Audio src={staticFile(data.music.src)} volume={Math.pow(10, data.music.gain / 20)} /> : null}
      <Sfx cues={data.sfx} />
    </AbsoluteFill>
  );
};
