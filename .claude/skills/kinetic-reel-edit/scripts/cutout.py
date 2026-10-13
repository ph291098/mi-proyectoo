#!/usr/bin/env python3
"""Cut the subject out of photos (transparent PNGs) for photo_plates.py.

  python cutout.py photos_dir/ cutouts_dir/ [--model u2net_human_seg]

Uses rembg (pip install "rembg[cpu]"); the model (~170 MB) downloads on first run.
Alpha matting is on, which keeps hair edges soft. Check the result on a coloured background.
Best input: 3-5 photos of the user, same clothes, front / both profiles / smiling / talking.
"""
import argparse
import os

from PIL import Image, ImageOps


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--model", default="u2net_human_seg")
    a = ap.parse_args()
    from rembg import new_session, remove
    sess = new_session(a.model)
    os.makedirs(a.dst, exist_ok=True)
    for f in sorted(os.listdir(a.src)):
        if not f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".heic")):
            continue
        im = ImageOps.exif_transpose(Image.open(os.path.join(a.src, f))).convert("RGB")
        out = remove(im, session=sess, alpha_matting=True, alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=15, alpha_matting_erode_size=12)
        name = os.path.splitext(f)[0] + ".png"
        out.save(os.path.join(a.dst, name))
        print("ok", name, out.size)


if __name__ == "__main__":
    main()
