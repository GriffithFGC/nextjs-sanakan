import sys, json
sys.setrecursionlimit(20000)
from PIL import Image, ImageSequence, ImageFilter, ImageDraw
src, outdir = sys.argv[1], sys.argv[2]
frames = [f.convert('L') for f in ImageSequence.Iterator(Image.open(src))][:10]
W, H = frames[0].size

def silhouette(f, grow):
    line = f.point(lambda v: 255 if v < 128 else 0).filter(ImageFilter.MaxFilter(grow))
    m = line.copy()
    for seed in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
        if m.getpixel(seed) == 0: ImageDraw.floodfill(m, seed, 128)
    cat = m.point(lambda v: 0 if v == 128 else 255)
    return cat.filter(ImageFilter.MinFilter(grow - 2)) if grow > 3 else cat

def trace(mask):
    px = mask.load()
    def on(x, y): return 0 <= x < W and 0 <= y < H and px[x, y] > 0
    nxt = {}
    for y in range(H):
        for x in range(W):
            if not on(x, y): continue
            # clockwise boundary edges between pixel corners
            if not on(x, y - 1): nxt.setdefault((x, y), []).append((x + 1, y))
            if not on(x + 1, y): nxt.setdefault((x + 1, y), []).append((x + 1, y + 1))
            if not on(x, y + 1): nxt.setdefault((x + 1, y + 1), []).append((x, y + 1))
            if not on(x - 1, y): nxt.setdefault((x, y + 1), []).append((x, y))
    loops = []
    while nxt:
        start = next(iter(nxt)); cur = start; loop = [start]
        while True:
            outs = nxt.get(cur)
            if not outs: break
            n = outs.pop()
            if not outs: del nxt[cur]
            cur = n
            if cur == start: break
            loop.append(cur)
        loops.append(loop)
    return max(loops, key=len)

def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; n = (dx * dx + dy * dy) ** 0.5 or 1
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if d > dmax: dmax, idx = d, i
    if dmax > eps: return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]

out = []
for i, f in enumerate(frames):
    for grow in (3, 5, 7):
        m = silhouette(f, grow)
        area = sum(1 for v in m.get_flattened_data() if v) if hasattr(m, 'get_flattened_data') else sum(1 for v in m.getdata() if v)
        if area > 12000: break
    pts = trace(m)
    half = len(pts) // 2
    simp = rdp(pts[:half + 1], 1.2)[:-1] + rdp(pts[half:] + [pts[0]], 1.2)[:-1]
    m.save('%s/m%d.png' % (outdir, i))
    print(i, 'grow', grow, 'area', area, 'contour', len(pts), 'simplified', len(simp))
    out.append(simp)
json.dump(out, open(outdir + '/contours.json', 'w'))
