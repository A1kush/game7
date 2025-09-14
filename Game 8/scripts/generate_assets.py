"""
Procedural Asset Generator for A1K Runner - "Apex Hunter"
Generates:
  build/icons/a1_slash_icon.png
  build/sheets/a1_slash_sheet.png  (8-frame spritesheet horizontal)
  build/gifs/a1_slash.gif
  build/manifest.json

Extend patterns list to add more skill/aura variants.
Requires: Pillow. Optional: numpy, imageio.
pip install pillow numpy imageio
"""
import math, os, json, random
from pathlib import Path
from typing import Tuple
from PIL import Image, ImageDraw, ImageFilter
try:
    import numpy as np
except ImportError:
    np = None
try:
    import imageio.v2 as imageio
except ImportError:
    imageio = None

OUT = Path("build")
ICON_DIR = OUT / "icons"
SHEET_DIR = OUT / "sheets"
GIF_DIR = OUT / "gifs"
for d in (ICON_DIR, SHEET_DIR, GIF_DIR):
    d.mkdir(parents=True, exist_ok=True)

def radial_fade(draw: ImageDraw.ImageDraw, cx, cy, r, inner_color, outer_alpha=0):
    """Simple radial fade using concentric circles (fast; no numpy)."""
    steps = r
    for i in range(r, 0, -1):
        a = int(255 * (i / r))
        col = (*inner_color[:3], a)
        draw.ellipse((cx-i, cy-i, cx+i, cy+i), fill=col)

def glow_layer(size: Tuple[int,int], hue_shift=0, seed=None):
    random.seed(seed)
    w,h = size
    img = Image.new("RGBA", size, (0,0,0,0))
    d = ImageDraw.Draw(img)
    cx, cy = w//2, h//2
    base_color = (130, 160, 255)
    if hue_shift != 0:
        # naive hue tweak
        r,g,b = base_color
        r = min(255, max(0, r + hue_shift))
        b = min(255, max(0, b - hue_shift//2))
        base_color = (r,g,b)
    radial_fade(d, cx, cy, min(cx,cy)-1, base_color+(255,))
    for _ in range(12):
        ang = random.random()*math.tau
        rr = random.randint(6,14)
        ox = int(math.cos(ang)*random.randint(4, cx-6))
        oy = int(math.sin(ang)*random.randint(4, cy-6))
        col = base_color[0], base_color[1], base_color[2], random.randint(60,140)
        d.ellipse((cx+ox-rr, cy+oy-rr, cx+ox+rr, cy+oy+rr), fill=col)
    img = img.filter(ImageFilter.GaussianBlur(4))
    return img

def slash_frame(size:Tuple[int,int], frame_index:int, total:int, rage=False):
    w,h = size
    img = Image.new("RGBA", size, (0,0,0,0))
    d = ImageDraw.Draw(img)
    t = frame_index/(total-1)
    # Core arc geometry
    arc_w = int(w*0.75*(0.7 + 0.3*t))
    arc_h = int(h*0.40*(1.0 - 0.2*t))
    thickness = max(2, int(6 - 4*t))
    cx, cy = int(w*0.45), int(h*0.55)

    base_col = (255,40,40) if rage else (120,180,255)
    edge_col = (255,160,80) if rage else (200,230,255)

    # Outline path approximated by multiple rotated ellipses
    steps = 6
    for i in range(steps):
        f = i/(steps-1)
        angle = -40 + 80*f
        ang_rad = math.radians(angle)
        ex = int(math.cos(ang_rad)*arc_w*0.5)
        ey = int(math.sin(ang_rad)*arc_h*0.5)
        col = (
            int(base_col[0]*(1-f)+edge_col[0]*f),
            int(base_col[1]*(1-f)+edge_col[1]*f),
            int(base_col[2]*(1-f)+edge_col[2]*f),
            int(255*(1-t) * (1-f*0.1))
        )
        r_major = int(arc_w*0.4*(1-f*0.3))
        r_minor = max(2, int(arc_h*0.25*(1-f*0.25)))
        bbox = (cx+ex-r_major, cy+ey-r_minor, cx+ex+r_major, cy+ey+r_minor)
        d.ellipse(bbox, outline=col, width=thickness)

    # Add glow layer composited
    glow = glow_layer(size, hue_shift=40 if rage else 0, seed=frame_index)
    img = Image.alpha_composite(glow, img)

    # Subtle motion smear (linear blend)
    smear = Image.new("RGBA", size, (0,0,0,0))
    smd = ImageDraw.Draw(smear)
    for i in range(8):
        alpha = int(50 * (1 - i/8) * (1 - t))
        offx = int( (1-t)*i*2 )
        smd.ellipse((cx+offx-10, cy-10, cx+offx+10, cy+10),
            fill=(edge_col[0], edge_col[1], edge_col[2], alpha))
    img = Image.alpha_composite(img, smear)
    return img

def make_spritesheet(frames, frame_size):
    w,h = frame_size
    sheet = Image.new("RGBA", (w*len(frames), h))
    for i,f in enumerate(frames):
        sheet.paste(f, (i*w, 0))
    return sheet

def save_gif(frames, path, duration=50):
    if imageio:
        imageio.mimsave(path, [f.copy() for f in frames], duration=duration/1000)
    else:
        # Pillow fallback (no per-frame duration granularity in older versions)
        frames[0].save(path, save_all=True, append_images=frames[1:], loop=0, duration=duration)

def build_slash_asset(name="a1_slash", rage=False):
    frame_size = (128,128)
    total = 8
    frames = [slash_frame(frame_size,i,total,rage=rage) for i in range(total)]
    sheet = make_spritesheet(frames, frame_size)
    icon = frames[total//2].resize((64,64), Image.LANCZOS)

    icon_path = ICON_DIR / f"{name}_icon.png"
    sheet_path = SHEET_DIR / f"{name}_sheet.png"
    gif_path = GIF_DIR / f"{name}.gif"

    icon.save(icon_path)
    sheet.save(sheet_path)
    save_gif(frames, gif_path, duration=55)

    return {
        "name": name,
        "frames": total,
        "frame_size": frame_size,
        "icon": str(icon_path),
        "sheet": str(sheet_path),
        "gif": str(gif_path),
        "rage_variant": rage
    }

def bloom_pass(path:Path, strength=1.4, radius=6):
    if np is None:
        return
    img = Image.open(path).convert("RGBA")
    arr = np.array(img).astype(float)
    alpha = arr[:,:,3]/255.0
    glow = arr[:,:,0:3]*alpha[...,None]
    from scipy.ndimage import gaussian_filter  # optional (pip install scipy)
    try:
        for c in range(3):
            glow[:,:,c] = gaussian_filter(glow[:,:,c], sigma=radius)
        glow = glow * strength
        base_rgb = arr[:,:,0:3]
        merged = np.clip(base_rgb + glow, 0, 255)
        arr[:,:,0:3] = merged
        out = Image.fromarray(arr.astype('uint8'), 'RGBA')
        out.save(path)
    except Exception:
        pass

def main():
    manifest = {"assets":[]}
    manifest["assets"].append(build_slash_asset("a1_slash", rage=False))
    manifest["assets"].append(build_slash_asset("a1_slash_rage", rage=True))
    # Optional bloom to sheets
    for a in manifest["assets"]:
        bloom_pass(Path(a["sheet"]))
    (OUT/"manifest.json").write_text(json.dumps(manifest, indent=2))
    print("Generated procedural assets. See build/ directory.")

if __name__ == "__main__":
    main()