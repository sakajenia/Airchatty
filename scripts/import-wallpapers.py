#!/usr/bin/env python3
"""Import lock-screen wallpapers into public/wallpapers/.

Takes a folder (or zip) of images (already 9:16). It only RESIZES DOWN when an
image is bigger than the video canvas width and re-encodes as an optimized JPEG
— it never crops. Files are named uniformly (roma-01.jpg, roma-02.jpg, ...) so
the batch renderer picks one per chat automatically (deterministic per chat).

  python3 scripts/import-wallpapers.py <folder-or-zip> [prefix]
"""
import io
import sys
import zipfile
from pathlib import Path

from PIL import Image

MAX_W = 1080  # video canvas width; downscale only if wider, preserving aspect

def iter_images(src: Path):
    if src.suffix.lower() == '.zip':
        with zipfile.ZipFile(src) as z:
            for name in sorted(z.namelist()):
                if name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not name.startswith('__MACOSX'):
                    yield name, Image.open(io.BytesIO(z.read(name)))
    else:
        for p in sorted(src.rglob('*')):
            if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                yield p.name, Image.open(p)

def resize_only(im: Image.Image) -> Image.Image:
    """Downscale to MAX_W wide (keep aspect); never upscale, never crop."""
    im = im.convert('RGB')
    if im.width > MAX_W:
        h = round(im.height * MAX_W / im.width)
        im = im.resize((MAX_W, h), Image.LANCZOS)
    return im

def process_one(im: Image.Image, dest: Path):
    resize_only(im).save(dest, 'JPEG', quality=86, optimize=True)

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = Path(sys.argv[1])
    prefix = sys.argv[2] if len(sys.argv) > 2 else 'roma'
    out = Path(__file__).resolve().parent.parent / 'public' / 'wallpapers'
    out.mkdir(parents=True, exist_ok=True)
    n = 0
    for name, im in iter_images(src):
        n += 1
        dest = out / f'{prefix}-{n:02d}.jpg'
        process_one(im, dest)
        print(f'  {name} -> {dest.name}')
    print(f'\n✓ {n} wallpaper importati in public/wallpapers/')

if __name__ == '__main__':
    main()
