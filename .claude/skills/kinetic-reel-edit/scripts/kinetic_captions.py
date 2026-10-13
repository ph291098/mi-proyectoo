#!/usr/bin/env python3
"""Kinetic typography for vertical reels (9:16), in the "spotlight + word cloud" style.

Subcommands:

  plan    Build a starter plan.json from word timestamps (+ cut times, or the
          edited video so cuts and background brightness are detected).
  retime  Move a hand-edited plan onto a new voice-over (new words.json),
          keeping every manual edit; rebuilds the cut times.
  ass     Write the .ass subtitle files (front / behind layers) for a plan.
  render  Burn the plan onto the edit with ffmpeg: spotlight iris, text behind
          the subject (needs a matte), icon overlays, text in front.

Only needs Python 3.8+ and ffmpeg built with libass. No pip packages.

Examples
  python kinetic_captions.py plan --words words.json --video edit.mp4 --out plan.json
  python kinetic_captions.py render --plan plan.json --video edit.mp4 --out final.mp4
  python kinetic_captions.py render --plan plan.json --video edit.mp4 --matte matte.mp4 --out final.mp4

See ../references/typography-and-motion.md for the plan.json schema.
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys

# ---------------------------------------------------------------- defaults --

DEFAULTS = {
    "width": 1080,
    "height": 1920,
    "font": "Inter Display",
    "bold": True,
    "tracking": -2,            # ASS \fsp, tight letter spacing
    "palette": {
        "text": "#FFFFFF",
        "glow_core": "#4070B0",     # stroke on light backgrounds
        "glow_halo": "#90A0C0",     # soft halo on light backgrounds
        "glow_dark": "#0050D0",     # electric blue glow on dark backgrounds
        "shadow": "#000000",
    },
}

# Size tokens in px at 1080 wide. Scaled with the plan width.
SIZES = {"xs": 70, "s": 95, "m": 120, "l": 160, "xl": 240, "hero": 360}

# Layout slots, normalised (x, y, size). Taken from the reference edit.
CLOUD_SLOTS = [
    (0.20, 0.30, "m"), (0.50, 0.22, "m"), (0.64, 0.29, "l"), (0.74, 0.37, "l"),
    (0.27, 0.48, "m"), (0.72, 0.44, "m"), (0.60, 0.55, "l"), (0.44, 0.61, "l"),
]
CLOUD_HERO = (0.50, 0.69, "xl")
STACK_SLOTS = [  # big words bracket the subject, small ones sit at its sides
    (0.50, 0.15, "hero"), (0.28, 0.30, "m"), (0.74, 0.40, "m"), (0.50, 0.60, "hero"),
]
SLIDE_SLOTS = [  # left-anchored (\an4)
    (0.08, 0.42, "l"), (0.58, 0.46, "m"), (0.08, 0.55, "xl"), (-0.03, 0.66, "l"),
]
SWAP_ANCHOR = (0.50, 0.40)

MODES = ("swap", "cloud", "stack", "slide", "none")
STYLES = ("shadow", "glow", "glow-dark", "flat")
ENTERS = ("pop", "focus", "fade", "slide", "cut")


# ------------------------------------------------------------------ helpers --

def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def ass_color(hex_rgb):
    """#RRGGBB -> &HBBGGRR& (ASS colour override)."""
    h = hex_rgb.lstrip("#").upper()
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{b}{g}{r}&"


def ass_alpha(alpha):
    return f"&H{alpha:02X}&"


def ass_time(t):
    t = max(0.0, t)
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def clean_word(w):
    w = w.strip()
    w = re.sub(r"^[\"'“”‘’(\[¿¡]+|[\"'“”‘’)\],.;:!?…]+$", "", w)
    return w.replace("{", "(").replace("}", ")").replace("\\", "/")


def run(cmd, capture=False):
    print("+ " + " ".join(cmd if len(" ".join(cmd)) < 400 else cmd[:6] + ["..."]), file=sys.stderr)
    return subprocess.run(cmd, check=True, text=True,
                          stdout=subprocess.PIPE if capture else None,
                          stderr=subprocess.PIPE if capture else None)


def need_ffmpeg():
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        die("ffmpeg/ffprobe not found in PATH")


def probe(video):
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
               "stream=width,height,r_frame_rate:format=duration", "-of", "json", video],
              capture=True).stdout
    j = json.loads(out)
    st = j["streams"][0]
    num, den = st["r_frame_rate"].split("/")
    aud = run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
               "-of", "csv=p=0", video], capture=True).stdout.strip()
    return {"width": int(st["width"]), "height": int(st["height"]), "has_audio": bool(aud),
            "fps": float(num) / float(den), "duration": float(j["format"]["duration"])}


# --------------------------------------------------------------- word input --

def load_words(path):
    """Accepts whisper / faster-whisper / ElevenLabs STT / plain-list JSON."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    raw = []
    if isinstance(data, dict) and "segments" in data:
        for seg in data["segments"]:
            raw.extend(seg.get("words", []))
    elif isinstance(data, dict) and "words" in data:
        raw = data["words"]
    elif isinstance(data, list):
        raw = data
    else:
        die("unrecognised words JSON")
    words = []
    for w in raw:
        if w.get("type") and w["type"] != "word":   # ElevenLabs spacing/audio events
            continue
        text = clean_word(w.get("word") or w.get("text") or "")
        if not text:
            continue
        words.append({"text": text, "start": float(w["start"]), "end": float(w["end"])})
    words.sort(key=lambda w: w["start"])
    return words


# ----------------------------------------------------------- scene analysis --

def detect_cuts(video, threshold=10.0):
    proc = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-vf",
                           f"scdet=threshold={threshold}", "-an", "-f", "null", "-"],
                          text=True, capture_output=True)
    times = [float(m) for m in re.findall(r"lavfi\.scd\.time:\s*([0-9.]+)", proc.stderr)]
    # merge cuts closer than 0.3 s (flash frames, whip pans)
    merged = []
    for t in times:
        if not merged or t - merged[-1] > 0.3:
            merged.append(t)
    return merged


def frame_stats(video, t):
    """Mean luma (0-255) and colour coverage (share of bright, saturated pixels) at time t."""
    proc = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", video,
                           "-frames:v", "1", "-vf", "scale=27:48", "-f", "rawvideo",
                           "-pix_fmt", "rgb24", "-"], capture_output=True)
    px = proc.stdout
    if not px:
        return 128.0, 0.0
    n = len(px) // 3
    luma = cov = 0.0
    for i in range(n):
        r, g, b = px[3 * i], px[3 * i + 1], px[3 * i + 2]
        luma += 0.2126 * r + 0.7152 * g + 0.0722 * b
        mx, mn = max(r, g, b), min(r, g, b)
        # dark pixels have meaningless saturation, so only count bright ones
        if mx > 110 and (mx - mn) / mx > 0.5:
            cov += 1
    return luma / n, cov / n


def style_for(luma, cov):
    # calibrated on the reference: red wall = 0.51, warm night desk <= 0.16
    if cov >= 0.35:
        return "flat"       # saturated colour backdrop (red wall)
    if luma >= 150:
        return "glow"       # high-key white cyc / paper / desk top
    return "shadow"         # dark or warm low-key


# ------------------------------------------------------------- plan builder --

def build_plan(words, cuts, duration, video=None, width=1080, height=1920, lead=0.1):
    bounds = [0.0] + [c for c in cuts if 0 < c < duration] + [duration]
    scenes = []
    n = len(bounds) - 1
    for i in range(n):
        start, end = bounds[i], bounds[i + 1]
        sw = [w for w in words if start - 0.05 <= w["start"] < end - 0.05]
        if video:
            luma, cov = frame_stats(video, (start + end) / 2)
        else:
            luma, cov = 40.0, 0.0
        style = style_for(luma, cov)
        dur = end - start
        if not sw:
            mode = "none"                       # breather shot: let the image talk
        elif i == 0:
            mode = "cloud"                      # hook: word cloud around the subject
        elif i == n - 1:
            mode = "slide"                      # outro: words slide in from the left
        elif len(sw) >= 3 and dur >= 1.6:
            mode = "stack" if i % 2 else "cloud"
        else:
            mode = "swap"
        scene = {"start": round(start, 3), "end": round(end, 3), "mode": mode,
                 "style": style, "words": [{"text": w["text"],
                                            "t": round(max(start, w["start"] - lead), 3)}
                                           for w in sw]}
        if i == 0 and mode == "cloud" and style == "shadow":
            scene["fx"] = ["spotlight"]         # hook; add it by hand on the callback shot
        scene["_bg"] = {"luma": round(luma, 1), "color": round(cov, 2)}
        scenes.append(scene)
    return {"width": width, "height": height, "font": DEFAULTS["font"], "scenes": scenes}


# ---------------------------------------------------------------- ASS output --

def px_size(size, W):
    if isinstance(size, (int, float)):
        return float(size)
    return SIZES.get(size, SIZES["m"]) * W / 1080.0


def fit_size(text, W, max_px, width_frac=0.82):
    # Inter Display Bold lowercase averages ~0.58 em per glyph
    est = width_frac * W / max(1, 0.58 * len(text))
    return min(max_px, est)


def enter_tags(enter, x, y, an, size):
    b = max(6, size * 0.08)
    if enter == "cut":
        return f"\\an{an}\\pos({x:.0f},{y:.0f})"
    if enter == "fade":
        return f"\\an{an}\\pos({x:.0f},{y:.0f})\\fad(260,0)"
    if enter == "focus":   # rack focus: heavy blur, transparent -> sharp
        return (f"\\an{an}\\pos({x:.0f},{y:.0f})\\fad(320,0)\\blur{b * 2.5:.0f}"
                f"\\t(0,320,0.6,\\blur0)")
    if enter == "slide":
        dx = size * 1.8
        return (f"\\an{an}\\move({x - dx:.0f},{y:.0f},{x:.0f},{y:.0f},0,200)"
                f"\\blur{b:.0f}\\t(0,200,\\blur0)")
    # pop (default): quick fade, blur -> sharp, 112% -> 100%
    return (f"\\an{an}\\pos({x:.0f},{y:.0f})\\fad(60,0)\\blur{b:.0f}\\fscx112\\fscy112"
            f"\\t(0,160,0.5,\\blur0\\fscx100\\fscy100)")


def word_events(word, style, enter, x, y, size, t0, t1, palette, extra="", an=5, layer_base=0):
    """Return ASS Dialogue lines for one word (halo/shadow layer + fill layer)."""
    s = size
    base = f"\\fs{s:.0f}{extra}"
    lines = []
    anim = enter_tags(enter, x, y, an, s)
    # the halo/shadow layer animates its own blur, so strip blur from its anim
    anim_static_blur = re.sub(r"\\blur[0-9.]+", "", anim)
    anim_static_blur = re.sub(r"\\t\((\d+),(\d+),(?:[0-9.]+,)?\)", "", anim_static_blur)
    white = ass_color(palette["text"])
    if style == "glow":
        halo = ass_color(palette["glow_halo"])
        core = ass_color(palette["glow_core"])
        lines.append((layer_base + 0, f"{{{anim_static_blur}{base}\\1c{halo}\\3c{halo}"
                                      f"\\1a{ass_alpha(0x50)}\\3a{ass_alpha(0x50)}"
                                      f"\\bord{s * 0.09:.1f}\\blur{s * 0.11:.1f}\\shad0}}{word}"))
        lines.append((layer_base + 1, f"{{{anim}{base}\\1c{white}\\3c{core}"
                                      f"\\bord{max(2, s * 0.022):.1f}\\shad0}}{word}"))
    elif style == "glow-dark":
        g = ass_color(palette["glow_dark"])
        lines.append((layer_base + 0, f"{{{anim_static_blur}{base}\\1c{g}\\3c{g}"
                                      f"\\1a{ass_alpha(0x20)}\\3a{ass_alpha(0x20)}"
                                      f"\\bord{s * 0.10:.1f}\\blur{s * 0.14:.1f}\\shad0}}{word}"))
        lines.append((layer_base + 1, f"{{{anim}{base}\\1c{white}\\3c{ass_color(palette['glow_dark'])}"
                                      f"\\bord{max(1.5, s * 0.012):.1f}\\shad0}}{word}"))
    elif style == "shadow":
        sh = ass_color(palette["shadow"])
        off = s * 0.04
        sx, sy = x + off * 0.4, y + off
        sanim = enter_tags(enter, sx, sy, an, s)
        sanim = re.sub(r"\\blur[0-9.]+", "", sanim)
        sanim = re.sub(r"\\t\((\d+),(\d+),(?:[0-9.]+,)?\)", "", sanim)
        lines.append((layer_base + 0, f"{{{sanim}{base}\\1c{sh}\\1a{ass_alpha(0x70)}\\bord0\\shad0"
                                      f"\\blur{s * 0.12:.1f}}}{word}"))
        lines.append((layer_base + 1, f"{{{anim}{base}\\1c{white}\\bord0\\shad0}}{word}"))
    else:  # flat
        lines.append((layer_base + 1, f"{{{anim}{base}\\1c{white}\\bord0\\shad0}}{word}"))
    return [f"Dialogue: {ly},{ass_time(t0)},{ass_time(t1)},K,,0,0,0,,{txt}" for ly, txt in lines]


def layout_scene(scene, W, H, lowercase=True):
    """Yield (word, x, y, size, an, t0, t1, enter, layer, extra) for each word."""
    mode = scene.get("mode", "swap")
    words = scene.get("words", [])
    start, end = scene["start"], scene["end"]
    default_enter = {"swap": "pop", "cloud": "pop", "stack": "pop", "slide": "slide"}.get(mode, "pop")
    hero_last = scene.get("hero_last", mode == "cloud")
    # "clear": true on a word wipes the words before it (a new "page" in the same shot);
    # a page also turns over by itself when the layout runs out of slots
    cap = {"cloud": len(CLOUD_SLOTS) + 1, "stack": len(STACK_SLOTS),
           "slide": len(SLIDE_SLOTS)}.get(mode, 10 ** 6)
    groups = []
    for i, w in enumerate(words):
        if i == 0 or w.get("clear") or len(groups[-1]) >= cap:
            groups.append([])
        groups[-1].append(i)
    group_of = {i: gi for gi, idxs in enumerate(groups) for i in idxs}
    out = []
    for i, w in enumerate(words):
        t0 = max(start, float(w.get("t", start)))
        grp = groups[group_of[i]]
        k = grp.index(i)                       # slot index inside the page
        if mode == "swap":
            nxt = words[i + 1]["t"] if i + 1 < len(words) else end
            t1 = min(end, float(w.get("end", nxt)))
        else:
            page_end = words[grp[-1] + 1]["t"] if grp[-1] + 1 < len(words) else end
            t1 = min(end, float(w.get("end", page_end)))
        if t1 - t0 < 0.04:
            continue
        an = 5
        if mode == "swap":
            ax, ay = scene.get("anchor", SWAP_ANCHOR)
            x, y = ax * W, ay * H
            size = fit_size(w["text"], W, px_size(w.get("size", "hero"), W))
        elif mode == "cloud":
            if hero_last and k == len(grp) - 1 and len(grp) > 2:
                sx, sy, sz = CLOUD_HERO
            else:
                sx, sy, sz = CLOUD_SLOTS[k % len(CLOUD_SLOTS)]
            x, y = sx * W, sy * H
            size = fit_size(w["text"], W, px_size(w.get("size", sz), W))
        elif mode == "stack":
            sx, sy, sz = STACK_SLOTS[k % len(STACK_SLOTS)]
            x, y = sx * W, sy * H
            size = fit_size(w["text"], W, px_size(w.get("size", sz), W))
        elif mode == "slide":
            sx, sy, sz = SLIDE_SLOTS[k % len(SLIDE_SLOTS)]
            x, y = sx * W, sy * H
            if "pos" in w:
                sx = w["pos"][0]
            size = fit_size(w["text"], W, px_size(w.get("size", sz), W), max(0.3, 0.96 - max(0.0, sx)))
            an = 4
        else:
            continue
        if "pos" in w:
            x, y = w["pos"][0] * W, w["pos"][1] * H
        extra = ""
        if "rot" in w or "rot" in scene:
            extra += f"\\frz{w.get('rot', scene.get('rot'))}"
        if "skew" in w or "skew" in scene:
            extra += f"\\fax{w.get('skew', scene.get('skew'))}"
        enter = w.get("enter", scene.get("enter", default_enter))
        layer = w.get("layer", scene.get("layer", "front"))
        text = w["text"]
        if lowercase and not (w.get("keep_case") or scene.get("keep_case")):
            text = text.lower()
        out.append((text, x, y, size, an, t0, t1, enter, layer, extra))
    return out


def write_ass(plan, path_front, path_behind):
    W, H = plan.get("width", 1080), plan.get("height", 1920)
    palette = dict(DEFAULTS["palette"])
    palette.update(plan.get("palette", {}))
    font = plan.get("font", DEFAULTS["font"])
    bold = -1 if plan.get("bold", True) else 0
    track = plan.get("tracking", DEFAULTS["tracking"])
    header = (
        "[Script Info]\nScriptType: v4.00+\nWrapStyle: 2\nScaledBorderAndShadow: yes\n"
        f"PlayResX: {W}\nPlayResY: {H}\nYCbCr Matrix: TV.709\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: K,{font},100,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,{bold},0,0,0,"
        f"100,100,{track},0,1,0,0,5,0,0,0,1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    front, behind = [], []
    for sc in plan["scenes"]:
        if sc.get("mode", "swap") == "none":
            continue
        style = sc.get("style", "shadow")
        for (text, x, y, size, an, t0, t1, enter, layer, extra) in layout_scene(
                sc, W, H, plan.get("lowercase", True)):
            target = behind if layer == "behind" else front
            target.extend(word_events(text, style, enter, x, y, size, t0, t1, palette, extra, an))
    for path, ev in ((path_front, front), (path_behind, behind)):
        with open(path, "w", encoding="utf-8") as f:
            f.write(header + "\n".join(ev) + "\n")
    return len(front), len(behind)


# ------------------------------------------------------------------ render --

def make_iris(path, W, H, cx, cy, r, edge, tint):
    """Spotlight overlay: transparent ellipse, cool rim, near-black outside. 2x size
    so it can be scaled down (iris shrink) and still cover the frame."""
    W2, H2 = W * 2, H * 2
    cx2, cy2 = W2 / 2 + (cx - W / 2), H2 / 2 + (cy - H / 2)
    tr, tg, tb = (int(tint[i:i + 2], 16) for i in (1, 3, 5))
    d = f"hypot(X-{cx2:.0f},(Y-{cy2:.0f})/1.12)"
    out = f"clip(({d}-{r:.0f})/{edge:.0f},0,1)"                 # 0 inside -> 1 outside
    rim = f"clip(({d}-{r - 3 * edge:.0f})/{3 * edge:.0f},0,1)"  # cool light pool near the edge
    expr = (f"r='{tr}*(1-{out})':g='{tg}*(1-{out})':b='{tb}*(1-{out})':"
            f"a='255*min(1,0.95*{out}+0.28*{rim}*(1-{out}))'")
    run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=black:s={W2}x{H2}:d=1",
         "-vf", f"format=rgba,geq={expr}", "-frames:v", "1", path])


def ease_out_expr(t0, dur, a, b):
    """ffmpeg expression for a cubic ease-out from a to b starting at t0."""
    p = f"min(max((t-{t0:.3f})/{dur:.3f},0),1)"
    return f"({a:.1f}+({b:.1f}-({a:.1f}))*(1-pow(1-{p},3)))"


def render(plan, video, out, matte=None, workdir=None, crf=18, preview=False):
    need_ffmpeg()
    info = probe(video)
    W, H = info["width"], info["height"]
    if (W, H) != (plan.get("width", W), plan.get("height", H)):
        print(f"warning: plan is {plan.get('width')}x{plan.get('height')} but video is {W}x{H}; "
              "using the video size", file=sys.stderr)
        plan = dict(plan, width=W, height=H)
    workdir = workdir or os.path.splitext(out)[0] + "_build"
    os.makedirs(workdir, exist_ok=True)
    fa, ba = os.path.join(workdir, "front.ass"), os.path.join(workdir, "behind.ass")
    nf, nb = write_ass(plan, fa, ba)
    if nb and not matte:
        print("warning: words with layer=behind but no --matte; they render in front",
              file=sys.stderr)
        with open(fa, "a", encoding="utf-8") as f, open(ba, encoding="utf-8") as b:
            f.writelines(l for l in b if l.startswith("Dialogue:"))
        nb = 0

    inputs = ["-i", video]
    idx = 1
    chains = []
    cur = "[0:v]"
    dur = info["duration"]

    # 1) spotlight iris per scene
    for si, sc in enumerate(plan["scenes"]):
        if "spotlight" not in sc.get("fx", []):
            continue
        sp = sc.get("spotlight", {})
        cx = sp.get("x", 0.5) * W
        cy = sp.get("y", 0.45) * H
        r = sp.get("r", 0.42) * W
        iris = os.path.join(workdir, f"iris_{si}.png")
        make_iris(iris, W, H, cx, cy, r, sp.get("edge", 0.07) * W, sp.get("tint", "#1E3550"))
        s0, s1 = sc["start"], sc["end"]
        inputs += ["-loop", "1", "-framerate", f"{info['fps']:.3f}", "-t", f"{s1 - s0:.3f}", "-i", iris]
        z0, z1 = sp.get("zoom", [1.0, 1.0])   # e.g. [1.35, 1.0] = iris closes in
        zd = sp.get("zoom_dur", 0.8)
        if z0 != z1:
            z = ease_out_expr(0, zd, z0, z1)
            chains.append(f"[{idx}:v]scale=w='trunc({2 * W}*{z}/2)*2':h='trunc({2 * H}*{z}/2)*2'"
                          f":eval=frame,setpts=PTS+{s0:.3f}/TB[ir{si}]")
        else:
            chains.append(f"[{idx}:v]setpts=PTS+{s0:.3f}/TB[ir{si}]")
        nxt = f"[sp{si}]"
        chains.append(f"{cur}[ir{si}]overlay=x='(W-w)/2':y='(H-h)/2':eof_action=pass:"
                      f"enable='between(t,{s0:.3f},{s1 - 0.001:.3f})'{nxt}")
        cur, idx = nxt, idx + 1

    # 2) split for the subject cut-out (text/icons behind the subject)
    use_matte = bool(matte)
    if use_matte:
        inputs += ["-i", matte]
        midx = idx
        idx += 1
        chains.append(f"{cur}split[bg][fgsrc]")
        chains.append(f"[{midx}:v]scale={W}:{H},format=gray[mt]")
        chains.append("[fgsrc]format=rgba[fgr]")
        chains.append("[fgr][mt]alphamerge[fg]")
        cur = "[bg]"

    # 3) icon overlays (sliding PNGs)
    def overlay_images(cur, idx, layer):
        for si, sc in enumerate(plan["scenes"]):
            for ii, img in enumerate(sc.get("images", [])):
                if img.get("layer", "front") != layer:
                    continue
                src = img["src"]
                if not os.path.isabs(src) and plan.get("_dir"):
                    src = os.path.join(plan["_dir"], src)
                w = int(img.get("w", 0.6) * W)
                x1 = img.get("x", 0.5) * W - w / 2
                y1 = img.get("y", 0.62) * H
                t0 = float(img.get("t", sc["start"]))
                t1 = float(img.get("end", sc["end"]))
                inputs.extend(["-loop", "1", "-framerate", f"{info['fps']:.3f}",
                               "-t", f"{t1 - t0:.3f}", "-i", src])
                frm = img.get("from", "left")
                x0 = {"left": -w * 1.1, "right": W + w * 0.1}.get(frm, x1)
                xe = ease_out_expr(t0, img.get("dur", 0.35), x0, x1)
                lbl = f"[im{si}_{ii}]"
                chains.append(f"[{idx}:v]scale={w}:-1,format=rgba,setpts=PTS+{t0:.3f}/TB{lbl}")
                nxt = f"[io{si}_{ii}]"
                chains.append(f"{cur}{lbl}overlay=x='{xe}':y='{y1:.0f}-h/2':eof_action=pass:"
                              f"enable='between(t,{t0:.3f},{t1 - 0.001:.3f})'{nxt}")
                cur, idx = nxt, idx + 1
        return cur, idx

    def esc(p):
        return p.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")

    if use_matte:
        cur, idx = overlay_images(cur, idx, "behind")
        if nb:
            chains.append(f"{cur}ass='{esc(ba)}'[tb]")
            cur = "[tb]"
        chains.append(f"{cur}[fg]overlay=0:0[comp]")
        cur = "[comp]"
    else:
        if any(img.get("layer") == "behind" for sc in plan["scenes"] for img in sc.get("images", [])):
            print("warning: images with layer=behind but no --matte; they render in front", file=sys.stderr)
        cur, idx = overlay_images(cur, idx, "behind")
    cur, idx = overlay_images(cur, idx, "front")
    if nf:
        chains.append(f"{cur}ass='{esc(fa)}'[tf]")
        cur = "[tf]"
    chains.append(f"{cur}format=yuv420p[vout]")

    graph = ";".join(chains)
    with open(os.path.join(workdir, "filtergraph.txt"), "w") as f:
        f.write(graph.replace(";", ";\n"))
    audio = ["-map", "0:a", "-c:a", "aac", "-b:a", "192k"] if info["has_audio"] else ["-an"]
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "warning", "-stats"] + inputs + [
        "-filter_complex", graph, "-map", "[vout]"] + audio + [
        "-c:v", "libx264", "-preset", "veryfast" if preview else "medium",
        "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-t", f"{dur:.3f}", out]
    run(cmd)
    print(f"wrote {out}  ({nf} front events, {nb} behind events)", file=sys.stderr)


# ------------------------------------------------------------------ retime --

def _norm(s):
    import unicodedata
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9ñ]+", "", s)


def retime(plan, words, lead=0.1, cut_lead=0.12, tail=0.6, window=14):
    """Move a hand-edited plan onto a new voice-over, keeping every edit.

    Each plan word is matched, in order, to the transcript by its first token (or by its
    "say" field when the on-screen text differs from what is spoken, e.g. "24" / "veinticuatro").
    A scene's "say" anchors a scene without words. Scene cuts are rebuilt from the matched
    words (cut_lead before the first word); unmatched scenes are interpolated.
    """
    spoken = [_norm(w["text"]) for w in words]
    ptr, misses = 0, []

    def find(token):
        nonlocal ptr
        tok = _norm(token.split()[0]) if token.split() else ""
        for j in range(ptr, min(len(words), ptr + window)):
            if spoken[j] == tok or (len(tok) > 3 and spoken[j].startswith(tok[:4])):
                ptr = j + 1
                return j
        return None

    anchors = []  # per scene: index of first matched transcript word
    for sc in plan["scenes"]:
        first = None
        if sc.get("say"):
            first = find(sc["say"])
        for w in sc.get("words", []):
            j = find(w.get("say", w["text"]))
            if j is None:
                misses.append(w["text"])
                w["_unmatched"] = True
                continue
            w.pop("_unmatched", None)
            w["t"] = round(words[j]["start"] - lead, 3)
            first = j if first is None else min(first, j)
        anchors.append(first)

    old = [(sc["start"], sc["end"]) for sc in plan["scenes"]]
    old_total = old[-1][1] if old else 1.0
    new_total = words[-1]["end"] + tail if words else old_total
    starts = []
    for i, a in enumerate(anchors):
        if i == 0:
            starts.append(0.0)
        elif a is not None:
            prev_end = words[a - 1]["end"] + 0.02 if a > 0 else 0.0
            starts.append(round(max(prev_end, words[a]["start"] - cut_lead), 3))
        else:
            starts.append(None)
    # interpolate scenes without an anchor between their anchored neighbours
    for i, s in enumerate(starts):
        if s is not None:
            continue
        lo = max(k for k in range(i) if starts[k] is not None)
        hi = next((k for k in range(i + 1, len(starts)) if starts[k] is not None), None)
        o_lo, o_hi = old[lo][0], (old[hi][0] if hi is not None else old_total)
        n_lo, n_hi = starts[lo], (starts[hi] if hi is not None else new_total)
        f = (old[i][0] - o_lo) / max(1e-6, o_hi - o_lo)
        starts[i] = round(n_lo + f * (n_hi - n_lo), 3)
    for i, sc in enumerate(plan["scenes"]):
        o0 = old[i][0]
        sc["start"] = starts[i]
        sc["end"] = starts[i + 1] if i + 1 < len(starts) else round(new_total, 3)
        for w in sc.get("words", []):
            if w.get("_unmatched"):   # keep its offset inside the scene
                w["t"] = round(min(sc["end"] - 0.1, sc["start"] + max(0.0, w["t"] - o0)), 3)
            w["t"] = max(sc["start"], w["t"])
        for img in sc.get("images", []):
            if "t" in img:
                img["t"] = round(min(sc["end"] - 0.1, sc["start"] + max(0.0, img["t"] - o0)), 3)
            img.pop("end", None)
    return plan, misses


# --------------------------------------------------------------------- CLI --

def load_plan(path):
    with open(path, encoding="utf-8") as f:
        plan = json.load(f)
    plan["_dir"] = os.path.dirname(os.path.abspath(path))
    for sc in plan.get("scenes", []):
        if sc.get("mode", "swap") not in MODES:
            die(f"scene at {sc.get('start')}: unknown mode {sc.get('mode')!r} (use {MODES})")
        if sc.get("style", "shadow") not in STYLES:
            die(f"scene at {sc.get('start')}: unknown style {sc.get('style')!r} (use {STYLES})")
        for w in sc.get("words", []):
            if w.get("enter", "pop") not in ENTERS:
                die(f"word {w.get('text')!r}: unknown enter {w['enter']!r} (use {ENTERS})")
            # a word may start a little before its scene (lead): it is clamped to the cut
            if not sc["start"] - 0.3 <= float(w.get("t", sc["start"])) < sc["end"]:
                print(f"warning: word {w.get('text')!r} at t={w.get('t')} is outside its scene "
                      f"({sc['start']}-{sc['end']}); it is clamped or dropped", file=sys.stderr)
        for img in sc.get("images", []):
            src = img.get("src", "")
            if not os.path.isabs(src):
                src = os.path.join(plan["_dir"], src)
            if not os.path.exists(src):
                die(f"scene at {sc.get('start')}: image not found: {src}")
    return plan


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("plan", help="build a starter plan.json")
    p.add_argument("--words", required=True, help="word timestamps JSON")
    p.add_argument("--video", help="edited video: detects cuts and background brightness")
    p.add_argument("--cuts", help="comma-separated cut times in seconds (overrides detection)")
    p.add_argument("--duration", type=float, help="needed when no --video")
    p.add_argument("--threshold", type=float, default=10.0, help="scdet threshold")
    p.add_argument("--lead", type=float, default=0.1,
                   help="show each word this many seconds before it is spoken (default 0.1)")
    p.add_argument("--out", default="plan.json")

    t = sub.add_parser("retime", help="move a hand-edited plan onto a new voice-over (keeps edits)")
    t.add_argument("--plan", required=True)
    t.add_argument("--words", required=True, help="word timestamps JSON of the new voice-over")
    t.add_argument("--lead", type=float, default=0.1)
    t.add_argument("--cut-lead", type=float, default=0.12, help="cut this long before a scene's first word")
    t.add_argument("--out", required=True)

    a = sub.add_parser("ass", help="write front.ass / behind.ass")
    a.add_argument("--plan", required=True)
    a.add_argument("--out-dir", default=".")

    r = sub.add_parser("render", help="burn the plan onto the video")
    r.add_argument("--plan", required=True)
    r.add_argument("--video", required=True)
    r.add_argument("--matte", help="subject matte video (white = subject) for layer=behind")
    r.add_argument("--out", required=True)
    r.add_argument("--crf", type=int, default=18)
    r.add_argument("--preview", action="store_true", help="fast encode")

    args = ap.parse_args()
    if args.cmd == "plan":
        words = load_words(args.words)
        if args.video:
            need_ffmpeg()
            info = probe(args.video)
            duration, W, H = info["duration"], info["width"], info["height"]
        else:
            if not args.duration:
                die("--duration is required without --video")
            duration, W, H = args.duration, 1080, 1920
        if args.cuts:
            cuts = [float(c) for c in args.cuts.split(",") if c.strip()]
        elif args.video:
            cuts = detect_cuts(args.video, args.threshold)
        else:
            cuts = []
        plan = build_plan(words, cuts, duration, args.video, W, H, args.lead)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(plan, f, ensure_ascii=False, indent=2)
        print(f"wrote {args.out}: {len(plan['scenes'])} scenes, {len(words)} words", file=sys.stderr)
    elif args.cmd == "retime":
        plan = load_plan(args.plan)
        plan.pop("_dir", None)
        plan, misses = retime(plan, load_words(args.words), args.lead, args.cut_lead)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(plan, f, ensure_ascii=False, indent=2)
        print(f"wrote {args.out}: {len(plan['scenes'])} scenes", file=sys.stderr)
        if misses:
            print("unmatched (kept their offset in the scene; add \"say\" to anchor them): "
                  + ", ".join(misses), file=sys.stderr)
    elif args.cmd == "ass":
        plan = load_plan(args.plan)
        os.makedirs(args.out_dir, exist_ok=True)
        nf, nb = write_ass(plan, os.path.join(args.out_dir, "front.ass"),
                           os.path.join(args.out_dir, "behind.ass"))
        print(f"wrote front.ass ({nf}) and behind.ass ({nb})", file=sys.stderr)
    else:
        render(load_plan(args.plan), args.video, args.out, args.matte, crf=args.crf,
               preview=args.preview)


if __name__ == "__main__":
    main()
