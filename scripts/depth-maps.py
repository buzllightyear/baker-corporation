#!/usr/bin/env python3
"""Generate greyscale depth maps for the room paintings (near = white).

The depth PNGs feed the UV-warp parallax shader in `src/ui/StageArt3D.tsx`
(`uv + uMouse * uStrength * depth`) and the CPU hotspot offset in `src/ui/depth.ts`.
They are committed to the repo; the model and the venv are not.

Usage
-----
    # one-off env (not committed, ~2.5 GB of wheels)
    uv venv --python 3.12 /tmp/depth-venv
    uv pip install --python /tmp/depth-venv/bin/python torch torchvision transformers pillow

    # all rooms, Depth-Anything-V2-Small on CPU
    /tmp/depth-venv/bin/python scripts/depth-maps.py

    # a subset / different size / overwrite
    /tmp/depth-venv/bin/python scripts/depth-maps.py --only bridge engine --width 768 --force

    # no torch available: luminance + vertical-gradient pseudo-depth (clearly worse)
    python3 scripts/depth-maps.py --pseudo

Output
------
    public/art/rooms/<name>.depth.png   greyscale, --width x (width * src_h / src_w),
                                        255 = nearest to camera, 0 = furthest.

Notes
-----
* Depth-Anything-V2 predicts *inverse* depth, so large raw values are already
  "near". `--invert` flips that if a future model disagrees.
* A small blur is applied by default: hard depth edges make the UV warp tear
  along silhouettes, and the shader clamps UVs with a 2% margin anyway.
"""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageFilter

ROOMS = Path(__file__).resolve().parent.parent / "public" / "art" / "rooms"
MODEL = "depth-anything/Depth-Anything-V2-Small-hf"


@dataclass(frozen=True)
class Options:
    width: int
    blur: float
    invert: bool
    force: bool
    pseudo: bool
    only: tuple[str, ...]


def targets(opts: Options) -> list[Path]:
    jpgs = sorted(p for p in ROOMS.glob("*.jpg") if not p.name.endswith(".depth.png"))
    if opts.only:
        jpgs = [p for p in jpgs if p.stem in opts.only]
    if not opts.force:
        jpgs = [p for p in jpgs if not out_path(p).exists()]
    return jpgs


def out_path(src: Path) -> Path:
    return src.with_suffix(".depth.png")


def normalize(img: Image.Image, opts: Options) -> Image.Image:
    """Stretch to full 0..255, optionally invert, soften, and resize."""
    grey = img.convert("F")
    lo, hi = grey.getextrema()
    span = max(hi - lo, 1e-6)
    grey = grey.point(lambda v: (v - lo) / span * 255.0)
    out = grey.convert("L")
    if opts.invert:
        out = out.point(lambda v: 255 - v)
    if opts.blur > 0:
        out = out.filter(ImageFilter.GaussianBlur(opts.blur))
    return out


def resized(src_size: tuple[int, int], width: int) -> tuple[int, int]:
    w, h = src_size
    return (width, max(1, round(width * h / w)))


def run_model(paths: list[Path], opts: Options) -> None:
    from transformers import pipeline  # imported late so --pseudo needs no torch

    print(f"loading {MODEL} (cpu) ...", flush=True)
    t0 = time.time()
    pipe = pipeline(task="depth-estimation", model=MODEL, device="cpu")
    print(f"  model ready in {time.time() - t0:.1f}s", flush=True)

    for path in paths:
        t0 = time.time()
        src = Image.open(path).convert("RGB")
        depth = pipe(src)["depth"]  # PIL 'L', large = near for Depth-Anything
        out = normalize(depth, opts).resize(resized(src.size, opts.width), Image.LANCZOS)
        out.save(out_path(path), optimize=True)
        print(f"  {path.name:>16} -> {out_path(path).name}  {out.size[0]}x{out.size[1]}  "
              f"{time.time() - t0:.1f}s  {out_path(path).stat().st_size // 1024} KB", flush=True)


def run_pseudo(paths: list[Path], opts: Options) -> None:
    """Last-resort stand-in: bright + low-in-frame reads as near.

    This is NOT a depth estimate. It gives the shader something non-flat to warp
    (floors drift more than ceilings, lit surfaces more than shadow) but it will
    smear on anything that breaks the assumption. Regenerate with the model.
    """
    print("PSEUDO-DEPTH: luminance + vertical gradient, not a real depth estimate", flush=True)
    for path in paths:
        t0 = time.time()
        src = Image.open(path).convert("L")
        w, h = resized(src.size, opts.width)
        lum = src.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))
        ramp = Image.linear_gradient("L").resize((w, h), Image.BILINEAR)  # 0 top -> 255 bottom
        mixed = Image.blend(lum, ramp, 0.55)
        out = normalize(mixed, opts)
        out.save(out_path(path), optimize=True)
        print(f"  {path.name:>16} -> {out_path(path).name}  {w}x{h}  {time.time() - t0:.1f}s", flush=True)


def parse_args(argv: list[str]) -> Options:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--width", type=int, default=768, help="output width in px (default 768)")
    ap.add_argument("--blur", type=float, default=1.5, help="gaussian blur radius on the depth map (default 1.5)")
    ap.add_argument("--invert", action="store_true", help="flip so small raw values are near")
    ap.add_argument("--force", action="store_true", help="regenerate maps that already exist")
    ap.add_argument("--pseudo", action="store_true", help="skip the model, emit luminance+gradient pseudo-depth")
    ap.add_argument("--only", nargs="*", default=[], metavar="STEM", help="limit to these image stems")
    ns = ap.parse_args(argv)
    return Options(width=ns.width, blur=ns.blur, invert=ns.invert, force=ns.force,
                   pseudo=ns.pseudo, only=tuple(ns.only))


def main(argv: list[str]) -> int:
    opts = parse_args(argv)
    if not ROOMS.is_dir():
        print(f"no room art at {ROOMS}", file=sys.stderr)
        return 1
    paths = targets(opts)
    if not paths:
        print("nothing to do (use --force to regenerate)")
        return 0
    print(f"{len(paths)} image(s) -> {ROOMS}")
    started = time.time()
    (run_pseudo if opts.pseudo else run_model)(paths, opts)
    print(f"done in {time.time() - started:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
