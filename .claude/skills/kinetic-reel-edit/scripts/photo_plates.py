#!/usr/bin/env python3
"""Photo-avatar mode: render clean plates (no captions) + subject matte from cut-out photos.

  python photo_plates.py shots.json plates.mp4 matte.mp4

For when there is no video generator: the subject comes from the user's photos (cut out with
cutout.py) and gets a camera-like settle + push-in on each cut. Then mux the voice-over and run
kinetic_captions.py render --matte matte.mp4. Schema: ../references/photo-avatar.md

Shot types: spot (black + spotlight look), cyc (white studio), red (colour wall), ui (prompt/chat
card that types itself), sticky (yellow note sliding onto a desk). 1080x1920 @ 24 fps.
Needs Pillow and ffmpeg.
"""
import os
import json
import math
import subprocess
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

W, H, FPS = 1080, 1920, 24
FONT_DIR = "/usr/share/fonts/opentype/inter/"


def font(name, size):
    return ImageFont.truetype(FONT_DIR + name, size)


def ease_out(p):
    p = max(0.0, min(1.0, p))
    return 1 - (1 - p) ** 3


def vgrad(c0, c1, w=W, h=H):
    g = Image.new("RGB", (1, 256))
    for y in range(256):
        f = y / 255
        g.putpixel((0, y), tuple(int(c0[i] + (c1[i] - c0[i]) * f) for i in range(3)))
    return g.resize((w, h), Image.BILINEAR)


def radial(w, h, cx, cy, r, inner, outer):
    """Radial gradient image (RGB) from inner colour at the centre to outer at radius r."""
    small = Image.new("RGB", (w // 8, h // 8))
    px = small.load()
    for y in range(small.height):
        for x in range(small.width):
            d = math.hypot(x * 8 - cx, (y * 8 - cy)) / r
            f = min(1.0, d) ** 1.6
            px[x, y] = tuple(int(inner[i] + (outer[i] - inner[i]) * f) for i in range(3))
    return small.resize((w, h), Image.BICUBIC)


# ------------------------------------------------------------------ avatar --

class Avatar:
    def __init__(self, path, grade):
        im = ImageOps.exif_transpose(Image.open(path)).convert("RGBA")
        im = im.resize((int(im.width * 0.75), int(im.height * 0.75)), Image.LANCZOS)  # working size
        rgb, a = im.convert("RGB"), im.getchannel("A")
        if grade == "cool":       # spotlight: cooler, punchier, a bit darker
            rgb = ImageEnhance.Color(rgb).enhance(0.85)
            rgb = ImageEnhance.Contrast(rgb).enhance(1.12)
            r, g, b = rgb.split()
            rgb = Image.merge("RGB", (r.point(lambda v: v * 0.94), g, b.point(lambda v: min(255, v * 1.05))))
        elif grade == "bright":   # white cyc: lifted, clean
            rgb = ImageEnhance.Brightness(rgb).enhance(1.06)
            rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
        elif grade == "warm":     # red wall
            rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
            r, g, b = rgb.split()
            rgb = Image.merge("RGB", (r.point(lambda v: min(255, v * 1.03)), g, b.point(lambda v: v * 0.96)))
        self.img = Image.merge("RGBA", (*rgb.split(), a))

    def place(self, width_frac, scale, cx_frac=0.5, bottom=H, lift=0):
        w = int(W * width_frac * scale)
        h = int(self.img.height * w / self.img.width)
        im = self.img.resize((w, h), Image.BILINEAR)
        x = int(W * cx_frac - w / 2)
        y = int(bottom - h * (1 - (scale - 1) * 0.15) - lift)
        return im, x, y


def avatar_frame(bg, av, t, dur, width_frac, cx_frac=0.5, lift=0, shadow=None):
    # quick settle on the cut (104% -> 100% in 0.3 s) + slow push-in (+4 % over the shot)
    settle = 1.04 - 0.04 * ease_out(t / 0.3)
    push = 1 + 0.04 * (t / max(dur, 0.01))
    im, x, y = av.place(width_frac, settle * push, cx_frac, H + int(60 * (push - 1) * 10), lift)
    frame = bg.copy()
    if shadow:
        a = im.getchannel("A").resize((im.width // 4, im.height // 4)).filter(ImageFilter.GaussianBlur(12))
        a = a.resize(im.size).point(lambda v: int(v * shadow[2]))
        frame.paste(Image.new("RGB", im.size, (0, 0, 0)), (x + shadow[0], y + shadow[1]), a)
    frame.paste(im, (x, y), im)
    matte = Image.new("L", (W, H), 0)
    matte.paste(im.getchannel("A"), (x, y))
    return frame, matte


# --------------------------------------------------------------- backgrounds --

def bg_spot():
    return radial(W, H, W / 2, H * 0.58, H * 0.6, (22, 26, 34), (3, 3, 4))


def bg_cyc():
    base = vgrad((238, 234, 237), (214, 209, 213))
    floor = radial(W, H, W / 2, H * 1.05, W * 0.9, (205, 200, 204), (226, 222, 225))
    m = Image.linear_gradient("L").resize((W, H)).point(lambda v: 0 if v < 170 else int((v - 170) * 3))
    return Image.composite(floor, base, m)


def bg_red():
    return radial(W, H, W * 0.45, H * 0.42, H * 0.75, (190, 40, 46), (110, 14, 20))


# ----------------------------------------------------------------------- UI --

PILL = {"ROL": (91, 140, 255), "CONTEXTO": (61, 214, 140), "TAREA": (255, 197, 61), "FORMATO": (255, 107, 154)}


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(" "), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if draw.textlength(test, font=fnt) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def ui_frame(t, dur, shot, bgcache={}):
    if "ui" not in bgcache:
        bgcache["ui"] = radial(W, H, W / 2, H * 0.45, H * 0.7, (24, 28, 44), (8, 9, 12))
    canvas = Image.new("RGB", (W, H))
    canvas.paste(bgcache["ui"])
    S = 2  # supersample for crisp text after the push-in
    card_w = shot.get("card_w", 960)
    fs = shot.get("fs", 50)
    lab, body, pillf = font("Inter-SemiBold.otf", 34 * S), font("Inter-Medium.otf", fs * S), font("Inter-Bold.otf", 26 * S)
    tmp = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    blocks = []  # (pill or None, lines, visible_chars or None, appear_t)
    for it in shot["items"]:
        lines = wrap(tmp, it["text"], body, (card_w - 120) * S)
        blocks.append((it.get("pill"), lines, it))
    # layout height
    lh = int(fs * S * 1.32)
    y = 130 * S
    heights = []
    for pill, lines, it in blocks:
        h = (54 * S if pill else 0) + len(lines) * lh + 34 * S
        heights.append(h)
    card_h = max(420 * S, y + sum(heights) + 140 * S)
    card = Image.new("RGBA", (card_w * S, card_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, card_w * S - 1, card_h - 1), radius=44 * S, fill=(21, 23, 28, 255),
                        outline=(46, 50, 62, 255), width=3 * S)
    d.text((60 * S, 52 * S), shot.get("label", "Tu prompt"), font=lab, fill=(138, 143, 156))
    cursor_xy = None
    for (pill, lines, it), h in zip(blocks, heights):
        a0 = it.get("t", 0.0)
        if t < a0:
            break
        p = ease_out((t - a0) / 0.18)
        dy = int((1 - p) * 24 * S)
        alpha = int(255 * p)
        layer = Image.new("RGBA", card.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        yy = y + dy
        if pill:
            col = PILL[pill]
            tw = ld.textlength(pill, font=pillf)
            ld.rounded_rectangle((60 * S, yy, 60 * S + tw + 44 * S, yy + 42 * S), radius=21 * S,
                                 fill=col + (60,), outline=col + (255,), width=2 * S)
            ld.text((82 * S, yy + 6 * S), pill, font=pillf, fill=col + (255,))
            yy += 54 * S
        # typing
        full = " ".join(lines)
        if it.get("type_cps"):
            n = int(max(0, t - a0) * it["type_cps"])
        else:
            n = len(full)
        shown, count = [], 0
        for ln in lines:
            take = max(0, min(len(ln), n - count))
            shown.append(ln[:take])
            count += len(ln) + 1
        for i, ln in enumerate(shown):
            ld.text((60 * S, yy + i * lh), ln, font=body, fill=(242, 243, 245, 255))
            if ln:
                last_i, last_ln = i, ln
        if it.get("type_cps") and n <= len(full) + 1:
            li = max([i for i, ln in enumerate(shown) if ln] or [0])
            cursor_xy = (60 * S + int(ld.textlength(shown[li], font=body)) + 6 * S, yy + li * lh)
        if it.get("squiggle_t") is not None and t >= a0 + it["squiggle_t"]:
            q = ease_out((t - a0 - it["squiggle_t"]) / 0.25)
            for i, ln in enumerate(shown):
                if not ln:
                    continue
                x1 = 60 * S + ld.textlength(ln, font=body) * q
                pts, x, k = [], 60 * S, 0
                base = yy + i * lh + int(fs * 1.2) * S
                while x < x1:
                    pts.append((x, base + (5 * S if k % 2 else -5 * S)))
                    x += 9 * S
                    k += 1
                if len(pts) > 1:
                    ld.line(pts, fill=(255, 77, 77, 255), width=4 * S)
        if alpha < 255:
            layer.putalpha(layer.getchannel("A").point(lambda v: v * alpha // 255))
        card.alpha_composite(layer)
        y += h
    if cursor_xy and int(t * 2.2) % 2 == 0:
        d.rectangle((cursor_xy[0], cursor_xy[1] + 6 * S, cursor_xy[0] + 5 * S, cursor_xy[1] + int(fs * 1.16) * S),
                    fill=(242, 243, 245, 255))
    # send button
    bx, by = card_w * S - 120 * S, card_h - 120 * S
    d.ellipse((bx, by, bx + 76 * S, by + 76 * S), fill=(242, 243, 245, 255))
    d.line((bx + 38 * S, by + 56 * S, bx + 38 * S, by + 22 * S), fill=(21, 23, 28, 255), width=7 * S)
    d.line((bx + 24 * S, by + 36 * S, bx + 38 * S, by + 21 * S, bx + 52 * S, by + 36 * S), fill=(21, 23, 28, 255),
           width=7 * S)
    # push-in "camera": card scales 1.00 -> 1.07 over the shot, quick settle on the cut
    sc = (1.05 - 0.05 * ease_out(t / 0.3)) * (1 + 0.07 * t / max(dur, 0.01)) * shot.get("zoom", 1.0) / S
    cw, ch = int(card.width * sc), int(card.height * sc)
    cimg = card.resize((cw, ch), Image.LANCZOS)
    cx, cy = W // 2 - cw // 2, int(H * shot.get("y", 0.47)) - ch // 2
    # soft blue glow behind the card, like a screen lighting the room
    if "glow" not in bgcache or bgcache["glow"][0] != (cw, ch):
        g = Image.new("L", (cw // 4 + 80, ch // 4 + 80), 0)
        ImageDraw.Draw(g).rounded_rectangle((40, 40, 40 + cw // 4, 40 + ch // 4), radius=14, fill=110)
        g = g.filter(ImageFilter.GaussianBlur(22)).resize((cw + 320, ch + 320), Image.BILINEAR)
        bgcache["glow"] = ((cw, ch), g)
    g = bgcache["glow"][1]
    canvas.paste(Image.new("RGB", g.size, (58, 91, 255)), (cx - 160, cy - 160), g)
    canvas.paste(cimg, (cx, cy), cimg)
    return canvas, Image.new("L", (W, H), 0)


# ------------------------------------------------------------------- sticky --

def make_sticky(size=600):
    S = 2
    im = Image.new("RGBA", (size * S, size * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    top, bot = (247, 226, 80), (236, 207, 52)
    for y in range(size * S):
        f = y / (size * S)
        d.line((0, y, size * S, y), fill=tuple(int(top[i] + (bot[i] - top[i]) * f) for i in range(3)) + (255,))
    # glue strip slightly darker
    d.rectangle((0, 0, size * S, 70 * S), fill=(240, 216, 64, 255))
    return im.resize((size, size), Image.LANCZOS)


def sticky_frame(t, dur, shot, cache={}):
    if "bg" not in cache:
        cache["bg"] = vgrad((233, 229, 225), (204, 199, 194))
        cache["note"] = make_sticky(640)
    frame = cache["bg"].copy()
    note = cache["note"].rotate(shot.get("rot", -9), resample=Image.BICUBIC, expand=True)
    p = ease_out(t / 0.4)
    tx, ty = W * 0.56, H * 0.60
    x = tx + (W * 0.9) * (1 - p) - t * 12
    y = ty - t * 6
    # shadow
    sh = note.getchannel("A").resize((note.width // 4, note.height // 4)).filter(ImageFilter.GaussianBlur(8))
    sh = sh.resize(note.size).point(lambda v: int(v * 0.35))
    frame.paste(Image.new("RGB", note.size, (40, 32, 20)), (int(x - note.width / 2 + 26), int(y - note.height / 2 + 40)), sh)
    frame.paste(note, (int(x - note.width / 2), int(y - note.height / 2)), note)
    return frame, Image.new("L", (W, H), 0)


# --------------------------------------------------------------------- main --

def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    cfg = json.load(open(sys.argv[1]))
    out_v, out_m = sys.argv[2], sys.argv[3]
    base = os.path.dirname(os.path.abspath(sys.argv[1]))
    cut = {k: (v if os.path.isabs(v) else os.path.join(base, v)) for k, v in cfg["cutouts"].items()}
    avatars = {}
    bgs = {"spot": bg_spot(), "cyc": bg_cyc(), "red": bg_red()}
    enc = lambda path, fmt: subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", fmt, "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-c:v", "libx264", "-crf", "14" if fmt == "rgb24" else "8", "-preset", "medium",
         "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    pv, pm = enc(out_v, "rgb24"), enc(out_m, "gray")
    total = round(cfg["duration"] * FPS)
    shots = cfg["shots"]
    for n in range(total):
        tg = n / FPS
        shot = next((s for s in shots if s["start"] <= tg < s["end"]), shots[-1])
        t, dur = tg - shot["start"], shot["end"] - shot["start"]
        kind = shot["type"]
        if kind in ("spot", "cyc", "red"):
            grade = {"spot": "cool", "cyc": "bright", "red": "warm"}[kind]
            key = (shot["photo"], grade)
            if key not in avatars:
                avatars[key] = Avatar(cut[shot["photo"]], grade)
            shadow = {"cyc": (18, 26, 0.22), "red": (34, 20, 0.45)}.get(kind)
            frame, matte = avatar_frame(bgs[kind], avatars[key], t, dur, shot.get("width", 1.0),
                                        shot.get("cx", 0.5), shot.get("lift", 0), shadow)
        elif kind == "ui":
            frame, matte = ui_frame(t, dur, shot)
        elif kind == "sticky":
            frame, matte = sticky_frame(t, dur, shot)
        else:
            raise SystemExit(f"unknown shot type {kind}")
        pv.stdin.write(frame.convert("RGB").tobytes())
        pm.stdin.write(matte.tobytes())
        if n % 48 == 0:
            print(f"{tg:5.1f}s {kind}", flush=True)
    for p in (pv, pm):
        p.stdin.close()
        p.wait()


if __name__ == "__main__":
    main()
