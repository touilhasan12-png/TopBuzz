"""Create deterministic illustrative roofscape albedos for historic Istanbul layers.

These are cartographic reconstructions, not photographs or archival evidence. They
replace repetitive low-rise cube rows with fine roof-and-street texture while the
major monuments, walls and a few foreground houses remain 3D geometry.
"""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "textures"
W, H = 1600, 1382
XMIN, XMAX = -22.0, 22.0
YMIN, YMAX = -22.0, 16.0


def xy_to_px(x, y):
    return ((x-XMIN)/(XMAX-XMIN)*W, (YMAX-y)/(YMAX-YMIN)*H)


def district_mask(cx, cy, rx, ry, rng):
    # A gently irregular radial silhouette; geometry itself clips the image to land.
    points = []
    for i in range(72):
        a = 2*math.pi*i/72
        r = .84 + rng.random()*.27 + .035*math.sin(5*a+cx) + .025*math.sin(9*a+cy)
        points.append(xy_to_px(cx+rx*r*math.cos(a), cy+ry*r*math.sin(a)))
    mask = Image.new("L", (W,H), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


def build_era(filename, seed, districts, ground, roofs, road):
    rng = random.Random(seed)
    # Soft natural ground albedo underneath the roof districts.
    terrain = Image.open(OUT / "terrain.png").convert("RGB").resize((W,H), Image.Resampling.LANCZOS)
    # Slightly warm the base without introducing a visible grid or tile repeat.
    tint = Image.new("RGB", (W,H), ground)
    base = Image.blend(terrain, tint, .18)
    canvas = base.copy()
    draw = ImageDraw.Draw(canvas)

    for cx,cy,rx,ry,spacing,angle in districts:
        mask = district_mask(cx,cy,rx,ry,rng)
        district = Image.new("RGB",(W,H),ground)
        dd = ImageDraw.Draw(district)
        # Fine, lightly irregular street lanes make the urban grain read as a place,
        # not a field of detached toy houses.
        xstep = spacing*2.15
        ystep = spacing*2.0
        maxr = max(rx,ry)*1.15
        for offset in [(-maxr+i*xstep+rng.uniform(-.12,.12)) for i in range(int(2*maxr/xstep)+1)]:
            pts=[]
            for k in range(33):
                t=-maxr+2*maxr*k/32
                # Rotate the street grid and gently bend each lane.
                lx=offset + .035*math.sin(t*1.5+offset*2.1)
                ly=t
                x=cx+lx*math.cos(angle)-ly*math.sin(angle)
                y=cy+lx*math.sin(angle)+ly*math.cos(angle)
                pts.append(xy_to_px(x,y))
            dd.line(pts, fill=road, width=max(2,round(spacing*.12*W/(XMAX-XMIN))), joint="curve")
        for offset in [(-maxr+i*ystep+rng.uniform(-.12,.12)) for i in range(int(2*maxr/ystep)+1)]:
            pts=[]
            for k in range(33):
                t=-maxr+2*maxr*k/32
                lx=t
                ly=offset + .032*math.sin(t*1.35+offset*1.7)
                x=cx+lx*math.cos(angle)-ly*math.sin(angle)
                y=cy+lx*math.sin(angle)+ly*math.cos(angle)
                pts.append(xy_to_px(x,y))
            dd.line(pts, fill=road, width=max(2,round(spacing*.10*W/(XMAX-XMIN))), joint="curve")

        # Offset, jittered roof footprints with a restrained palette and fine ridge
        # strokes; a small number remain modeled in 3D around the landmarks.
        step=spacing
        nx=int(2*rx/step)+2; ny=int(2*ry/step)+2
        for iy in range(ny):
            for ix in range(nx):
                lx=-rx+(ix+.5)*step+rng.uniform(-.24,.24)
                ly=-ry+(iy+.5)*step+rng.uniform(-.24,.24)
                if (lx/rx)**2+(ly/ry)**2 > .90 or rng.random()<.19:
                    continue
                x=cx+lx*math.cos(angle)-ly*math.sin(angle)
                y=cy+lx*math.sin(angle)+ly*math.cos(angle)
                bw=rng.uniform(.20,.34); bd=rng.uniform(.16,.30)
                rot=angle+rng.uniform(-.62,.62)
                ca,sa=math.cos(rot),math.sin(rot)
                corners=[]
                for ax,ay in [(-bw/2,-bd/2),(bw/2,-bd/2),(bw/2,bd/2),(-bw/2,bd/2)]:
                    corners.append(xy_to_px(x+ax*ca-ay*sa,y+ax*sa+ay*ca))
                palette=roofs
                color=palette[rng.randrange(len(palette))]
                shadow=[(px+1.3,py+1.6) for px,py in corners]
                d=ImageDraw.Draw(district)
                d.polygon(shadow,fill=(73,68,56))
                d.polygon(corners,fill=color,outline=(85,73,59),width=1)
                # A short ridge/cap highlight, not a fake window-grid texture.
                if rng.random()<.78:
                    a,b=corners[0],corners[1]
                    mid=((a[0]+b[0])/2,(a[1]+b[1])/2)
                    c,d0=corners[3],corners[2]
                    mid2=((c[0]+d0[0])/2,(c[1]+d0[1])/2)
                    ImageDraw.Draw(district).line([mid,mid2],fill=(211,179,130),width=1)
        # Keep the district edges organic; outside the mask the same hill texture shows through.
        canvas.paste(district, (0,0), mask)

    canvas.save(OUT/filename,format="PNG",optimize=True)
    print(f"Wrote illustrative historic roofscape {OUT/filename} ({W}x{H})")


if __name__ == "__main__":
    build_era(
        "byzantine-roofscape.png", 657,
        [(-5.8,1.0,7.0,7.0,.62,-.12),(-7.7,-6.0,4.5,4.5,.58,.18)],
        (111,111,86),
        [(139,76,55),(157,89,61),(177,106,70),(170,133,91),(130,104,76),(194,158,111)],
        (179,158,118),
    )
    build_era(
        "ottoman-roofscape.png", 1453,
        [(-5.8,1.0,8.5,8.0,.64,-.18),(-7.4,-6.1,6.0,5.0,.60,.16),(7.4,1.3,7.0,7.5,.68,.30)],
        (115,112,83),
        [(137,78,53),(158,91,59),(175,110,68),(185,128,79),(128,105,75),(199,160,108),(110,116,97)],
        (184,164,123),
    )
