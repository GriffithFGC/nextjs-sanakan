# Trace the sitting cat's body (tail removed) from the back-view reference into a normalised polygon.
import sys, json
from PIL import Image, ImageDraw, ImageFilter
sys.setrecursionlimit(100000)
src = sys.argv[1]
im = Image.open(src).convert('L'); W, H = im.size; p = im.load()
GROUND, OX, UNIT = 815, 440, 815 - 45   # ground line, body axis, ears-to-ground height
m = Image.new('L', (W, H), 0); q = m.load()
for y in range(H):
    for x in range(W):
        if p[x, y] < 110 and y <= GROUND and not (x < 250 and y > 600) and not (x < 292 and y > 770): q[x, y] = 255
m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))  # close the watermark's speckles
# fill holes: flood the outside, everything not outside is cat
ImageDraw.floodfill(m, (0, 0), 128)
m = m.point(lambda v: 0 if v == 128 else 255)
# keep the largest component
px = m.load()
def trace(mask):
    px = mask.load()
    def on(x, y): return 0 <= x < W and 0 <= y < H and px[x, y] > 0
    nxt = {}
    for y in range(H):
        for x in range(W):
            if not on(x, y): continue
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
loop = trace(m)
# smooth (moving average) then Ramer-Douglas-Peucker
n = len(loop); k = 6
sm = [(sum(loop[(i + j) % n][0] for j in range(-k, k + 1)) / (2 * k + 1), sum(loop[(i + j) % n][1] for j in range(-k, k + 1)) / (2 * k + 1)) for i in range(n)]
def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]; dx, dy = x2 - x1, y2 - y1; L = (dx * dx + dy * dy) ** 0.5 or 1
    d = [abs(dy * (x - x1) - dx * (y - y1)) / L for x, y in pts]
    i = max(range(len(pts)), key=d.__getitem__)
    if d[i] > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]
far = max(range(n), key=lambda i: (sm[i][0] - sm[0][0]) ** 2 + (sm[i][1] - sm[0][1]) ** 2)
pts = rdp(sm[:far + 1], 2.2)[:-1] + rdp(sm[far:] + [sm[0]], 2.2)[:-1]
norm = [[round((x - OX) / UNIT, 3), round((y - GROUND) / UNIT, 3)] for x, y in pts]
print(len(loop), len(pts), file=sys.stderr)
print(json.dumps(norm, separators=(',', ':')))
