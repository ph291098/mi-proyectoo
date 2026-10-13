import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";

/** Un golpe del kit colocado en el tiempo. `gain` en dB relativo al fichero, que
 *  ya viene normalizado a pico -3 dBFS: por eso las ganancias son negativas y
 *  comparables entre sí. */
export type Cue = { s: string; at: number; gain?: number };

const db = (x: number) => Math.pow(10, x / 20);

/** Los efectos van SIEMPRE por debajo de la voz. Con la voz de este reel a
 *  -14 LUFS, -14 dB es un golpe que se siente y -22 dB es un tic que casi no se
 *  oye pero se nota si lo quitas. Remotion mezcla en el render y export.sh
 *  normaliza el conjunto después, así que estos números son relativos y
 *  sobreviven a la normalización final. */
export const Sfx: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={`${c.s}-${i}`} from={Math.round(c.at * fps)} layout="none">
          <Audio src={staticFile(`sfx/${c.s}.wav`)} volume={db(c.gain ?? -18)} />
        </Sequence>
      ))}
    </>
  );
};
