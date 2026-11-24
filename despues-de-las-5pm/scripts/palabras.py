"""Saca los tiempos palabra por palabra de una locución con Whisper (faster-whisper).

Uso: uv run --with faster-whisper python scripts/palabras.py <audio> <salida.json>
"""
import sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', audio, '-ar', '16000', '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
model = WhisperModel('medium', device='cpu', compute_type='int8')
segs, _ = model.transcribe(np.frombuffer(raw, '<f4'), language='es', word_timestamps=True, beam_size=5, condition_on_previous_text=False)
words = [{'w': w.word.strip(), 'a': round(w.start, 3), 'b': round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(out, 'w'), ensure_ascii=False, indent=0)
print(' '.join(f"{w['w']}[{w['a']}]" for w in words))
