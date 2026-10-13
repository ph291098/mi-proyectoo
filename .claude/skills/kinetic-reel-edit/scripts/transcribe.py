#!/usr/bin/env python3
"""Word-level transcript of a voice-over -> words.json (input for kinetic_captions.py).

  python transcribe.py voiceover.wav --out words.json [--model small] [--lang es]

Uses faster-whisper if installed, otherwise openai-whisper. Install one of:
  pip install faster-whisper        (lighter, no torch)
  pip install openai-whisper        (pulls torch)
Video files work too (ffmpeg extracts the audio).
"""
import argparse
import json
import sys


def with_faster_whisper(path, model, lang):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, info = m.transcribe(path, word_timestamps=True, language=lang, beam_size=5)
    words = [{"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
             for s in segs for w in (s.words or [])]
    return info.language, words


def with_openai_whisper(path, model, lang):
    import whisper
    m = whisper.load_model(model)
    r = m.transcribe(path, word_timestamps=True, language=lang, fp16=False)
    words = [{"word": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
             for s in r["segments"] for w in s.get("words", [])]
    return r.get("language"), words


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audio")
    ap.add_argument("--out", default="words.json")
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang", default=None, help="force language, e.g. es / en")
    a = ap.parse_args()
    for fn in (with_faster_whisper, with_openai_whisper):
        try:
            lang, words = fn(a.audio, a.model, a.lang)
            break
        except ImportError:
            continue
        except Exception as e:  # e.g. model download blocked: try the other backend
            print(f"{fn.__name__} failed: {e.__class__.__name__}: {str(e)[:200]}", file=sys.stderr)
            continue
    else:
        sys.exit("install faster-whisper or openai-whisper first (see --help)")
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=1)
    print(f"{len(words)} words, language={lang} -> {a.out}")
    print(" ".join(w["word"] for w in words))


if __name__ == "__main__":
    main()
