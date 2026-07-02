#!/usr/bin/env python3
"""Import lock-screen wallpapers into public/wallpapers/.

Takes a folder (or zip) of images in any format/size, cover-crops each to the
video canvas (1080x1920), re-encodes as an optimized JPEG and names them
uniformly (roma-01.jpg, roma-02.jpg, ...). The batch renderer then picks one
per chat automatically (deterministic per chat name).

  python3 scripts/import-wallpapers.py <folder-or-zip> [prefix]
"""
import io
import sys
import zipfile
from pathlib import Path

from PIL import Image

W, H = 1080, 1920

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

def cover(im: Image.Image) -> Image.Image:
    im = im.convert('RGB')
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x = (im.width - W) // 2
    y = (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))

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
        cover(im).save(dest, 'JPEG', quality=82, optimize=True)
        print(f'  {name} -> {dest.name}')
    print(f'\n✓ {n} wallpaper importati in public/wallpapers/')

if __name__ == '__main__':
    main()
