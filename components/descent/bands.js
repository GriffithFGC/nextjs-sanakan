/*
 * The descent: full-bleed scenes between sections, deeper as the page goes down.
 * Each scene is a few pre-drawn layers that slide at different speeds while the band
 * scrolls through the viewport; motes, drifting cloud and the rare manta or lightning are
 * drawn live, only while the band is on screen. Ported from content/prototype-descente.html.
 *
 * mountBand(canvas, "clouds" | "forest") returns { destroy, setPaused }: a paused band keeps its
 * current frame and resumes where it stopped.
 */
import { makeLyingCat, makeSittingCat } from "./cats";

var SCENES;
export function mountBand(cv, name) {
  if (!SCENES) SCENES = makeScenes();
  return SCENES.band(cv, name === "forest" ? SCENES.forest : SCENES.clouds);
}

function makeScenes() {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var MOSS_D = ["#24371f", "#2f4a2a", "#3d5a2a", "#24403a"], MOSS_L = ["#56783a", "#6f9147", "#8fae5a", "#a9c46a"];
  function pick(r, a) { return a[(r() * a.length) | 0]; }

  var grain = (function () {
    var g = document.createElement("canvas"); g.width = g.height = 160;
    var c = g.getContext("2d"), img = c.createImageData(160, 160), r = rng(5);
    for (var i = 0; i < img.data.length; i += 4) { var v = r() < 0.5 ? 0 : 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = r() * 26; }
    c.putImageData(img, 0, 0); return g;
  })();

  /* ---- shared nature: only on upward faces, from colonies, hanging where it can ---- */
  function cushion(c, r, x, y, s, a) {
    c.globalAlpha = 0.85 * a; c.fillStyle = pick(r, MOSS_D);
    c.beginPath(); c.ellipse(x, y - s * 0.25, s * (1.1 + r() * 0.6), s * (0.45 + r() * 0.25), 0, 0, 6.29); c.fill();
    c.globalAlpha = a;
    var n = Math.min(26, 4 + s * s * 0.5) | 0;
    for (var i = 0; i < n; i++) {
      var u = r() * 2 - 1, v = r(), z = 0.6 + r() * Math.min(1.8, s * 0.22);
      c.fillStyle = v > 0.45 ? pick(r, MOSS_L) : pick(r, MOSS_D);
      c.fillRect(x + u * s * 1.3 - z / 2, y - s * 0.25 - v * s * 0.7 * (1 - u * u * 0.6) - z / 2, z, z);
    }
    c.globalAlpha = 1;
  }
  function drape(c, r, x, y, len, w, a) {
    c.globalAlpha = a; c.strokeStyle = r() < 0.65 ? pick(r, MOSS_D) : pick(r, MOSS_L); c.lineWidth = w; c.lineCap = "round";
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len * 0.08, y + len * 0.5, x + len * 0.03, y + len); c.stroke();
    c.globalAlpha = 1;
  }
  function density(cols, v) { var d = 0; cols.forEach(function (k) { d = Math.max(d, k[2] * Math.exp(-Math.abs(v - k[0]) / k[1])); }); return d; }
  function colonies(r, n, sp) { var a = []; for (var i = 0; i < n; i++) a.push([r(), sp * (0.6 + r() * 0.8), 0.7 + r() * 0.3]); return a; }
  // moss along a horizontal edge from x0 to x1; level = how far the forest has taken this depth
  function mossEdge(c, r, x0, x1, y, s, level, a, hang) {
    var cols = colonies(r, 2 + (r() * 2 | 0), 0.12);
    for (var x = x0; x < x1; x += Math.max(2, s * 0.9)) {
      var d = density(cols, (x - x0) / Math.max(1, x1 - x0)) * (0.82 + 0.18 * Math.sin(x * 0.7));
      if (d < 1 - level) continue;
      cushion(c, r, x, y, s * (0.5 + d * 0.9), a);
      if (hang && d > 0.45 && r() < 0.4 * d) drape(c, r, x, y + 1, (6 + r() * hang) * d, Math.max(0.6, s * 0.25), a);
    }
  }
  function layer(W, H, k) { var cv = document.createElement("canvas"), h = Math.ceil(H * (1 + 2 * k)); return { cv: cv, h: h, k: k, setup: function (dpr) { cv.width = W * dpr; cv.height = h * dpr; var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); return c; } }; }

  /* ---------------- shared drawing ---------------- */
  function specks(c, r, x, y, w, h, n, alpha) { for (var i = 0; i < n; i++) { c.fillStyle = "rgba(232,230,220," + (alpha * (0.3 + r() * 0.7)) + ")"; c.fillRect(x + r() * w, y + r() * h, r() < 0.15 ? 2 : 1, 1); } }
  function vstrokes(c, r, x, y, w, h, n, col) { c.strokeStyle = col; c.lineWidth = 1; for (var i = 0; i < n; i++) { var px = x + r() * w, py = y + r() * h, l = 6 + r() * 30; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (r() - 0.5) * 2, py + l); c.stroke(); } }

  /* ---------------- scene: the sea of clouds (-340 m) ----------------
     A colossal ring hangs overhead, lightning falls from it into a dark void; a black cliff
     on the left, a drowned fortress beyond; below, a sea of white cloud;
     on the right, an outcrop of debris where the two cats sit and watch. */
  function puffCount(x0, x1, yTop, yBot, size) { return Math.ceil((x1 - x0) / size * (yBot - yTop) / size * 1.8); }
  function billows(c, r, x0, x1, yTop, yBot, size, light, mid, shade, wrap) {
    // a heaped bank of cloud: puffs piled back to front, lit from above, a soft base to fill the gaps;
    // with `wrap`, every puff is repeated one period left and right so the bank tiles seamlessly
    c.fillStyle = mid; c.fillRect(x0, yTop + size * 0.6, x1 - x0, yBot - yTop);
    var puffs = [], n = puffCount(x0, x1, yTop, yBot, size);
    for (var i = 0; i < n; i++) {
      var d = [x0 + r() * (x1 - x0), yTop + Math.pow(r(), 1.4) * (yBot - yTop), size * (0.7 + r() * 0.9)];
      puffs.push(d);
      if (wrap) puffs.push([d[0] - wrap, d[1], d[2]], [d[0] + wrap, d[1], d[2]]);
    }
    puffs.sort(function (a, b) { return a[1] - b[1]; });
    puffs.forEach(function (d) {
      var ry = d[2] * 0.58, depth = (d[1] - yTop) / (yBot - yTop);
      var gr = c.createLinearGradient(0, d[1] - ry, 0, d[1] + ry);
      gr.addColorStop(0, light); gr.addColorStop(0.55, light); gr.addColorStop(1, mid);
      c.globalAlpha = 0.92; c.fillStyle = gr; c.beginPath(); c.ellipse(d[0], d[1], d[2], ry, 0, 0, 6.29); c.fill();
      c.globalAlpha = 1 - depth * 0.6; c.strokeStyle = shade; c.lineWidth = 1;
      c.beginPath(); c.ellipse(d[0], d[1], d[2], ry, 0, Math.PI * 1.15, Math.PI * 1.75); c.stroke();
      c.globalAlpha = 1;
    });
  }
  function clouds(W, H, dpr) {
    var r = rng(53), L = [];
    // A bank of cloud on its own layer, one screen wide and tileable, sliding right at `speed` px/s.
    // The layer starts at the bank's top (y0) and runs to the foot of the scene. It draws from its own seed but still
    // consumes `r` as the fixed bank did, so the rest of the scene keeps its shapes.
    function bank(k, seed, x0, x1, yTop, yBot, size, light, mid, shade, speed) {
      for (var i = puffCount(x0, x1, yTop, yBot, size) * 3; i > 0; i--) r();
      var top = Math.max(0, yTop - size), bot = Math.ceil(H * (1 + 2 * k));
      var cv = document.createElement("canvas"); cv.width = W * dpr; cv.height = Math.ceil((bot - top) * dpr);
      var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, -top * dpr);
      c.fillStyle = mid; c.fillRect(0, yBot, W, bot - yBot); // solid down to the layer's foot: no void between banks
      billows(c, rng(seed), 0, W, yTop, yBot, size, light, mid, shade, W);
      return { cv: cv, k: k, y0: top, drift: speed };
    }

    // back: grey sky behind the ring, the dark void beneath it, a drowned fortress on the left
    var l0 = layer(W, H, 0.03), c = l0.setup(dpr), h = l0.h;
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9aa19b"); g.addColorStop(0.3, "#6b736e"); g.addColorStop(0.62, "#1b201e"); g.addColorStop(1, "#2a302d");
    c.fillStyle = g; c.fillRect(0, 0, W, h);
    var vg = c.createRadialGradient(W * 0.56, h * 0.5, 0, W * 0.56, h * 0.5, W * 0.3); vg.addColorStop(0, "rgba(8,10,9,0.9)"); vg.addColorStop(1, "rgba(8,10,9,0)");
    c.fillStyle = vg; c.fillRect(0, 0, W, h);
    for (var i = 0; i < 9; i++) {
      var fx = W * (0.08 + i * 0.035 + r() * 0.02), fw = W * (0.03 + r() * 0.05), ft = h * (0.42 + r() * 0.12);
      var gv = 46 + r() * 22 | 0; c.fillStyle = "rgb(" + gv + "," + (gv + 6) + "," + (gv + 3) + ")";
      c.fillRect(fx, ft, fw, h * 0.7 - ft);
      c.fillStyle = "rgba(10,12,11,0.75)";
      for (var wnd = 0; wnd < 4; wnd++) c.fillRect(fx + fw * (0.15 + wnd * 0.2), ft + h * 0.02, 2, 5);
      mossEdge(c, r, fx, fx + fw, ft, 1.6, 0.5, 0.7, 10);
    }
    vstrokes(c, r, 0, h * 0.4, W, h * 0.3, 400, "rgba(0,0,0,0.15)");
    L.push(l0);

    // middle: the ring overhead, its struts and hanging spikes; the far bank of the cloud sea
    var l1 = layer(W, H, 0.1); c = l1.setup(dpr); h = l1.h;
    var cx = W * 0.58, cy = h * 0.2, R = W * 0.52, ry = h * 0.17;
    var ug = c.createRadialGradient(cx, cy + ry * 0.4, 0, cx, cy, R); ug.addColorStop(0, "#505854"); ug.addColorStop(0.7, "#7f8681"); ug.addColorStop(1, "rgba(127,134,129,0)");
    c.fillStyle = ug; c.beginPath(); c.ellipse(cx, cy, R, ry, 0, 0, 6.29); c.fill();
    c.strokeStyle = "rgba(10,12,11,0.65)";
    [1, 0.82, 0.62, 0.46].forEach(function (k, i) { c.lineWidth = i === 2 ? 3 : 1.2; c.beginPath(); c.ellipse(cx, cy, R * k, ry * k, 0, 0, 6.29); c.stroke(); });
    c.fillStyle = "#121614"; c.beginPath(); c.ellipse(cx, cy, R * 0.34, ry * 0.3, 0, 0, 6.29); c.fill();
    c.strokeStyle = "rgba(200,205,198,0.5)"; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + 2, R * 0.34, ry * 0.3, 0, 0.1, Math.PI - 0.1); c.stroke();
    c.lineWidth = 1;
    for (var s = 0; s < 34; s++) { var a = r() * Math.PI * 2, k1 = 0.35 + r() * 0.2; c.strokeStyle = "rgba(10,12,11," + (0.3 + r() * 0.5) + ")"; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * k1, cy + Math.sin(a) * ry * k1); c.lineTo(cx + Math.cos(a) * R * 1.4, cy + Math.sin(a) * ry * 1.6 + h * 0.05); c.stroke(); }
    for (var sp = 0; sp < 14; sp++) {
      var a2 = Math.PI * (0.1 + r() * 0.8), px = cx + Math.cos(a2) * R * (0.4 + r() * 0.5), py = cy + Math.sin(a2) * ry * (0.4 + r() * 0.5), len = h * (0.05 + r() * 0.16), sw = 2 + r() * 5;
      c.fillStyle = "#0c0f0e"; c.beginPath(); c.moveTo(px - sw, py); c.lineTo(px + sw, py); c.lineTo(px + sw * 0.3, py + len); c.lineTo(px - sw * 0.3, py + len * 0.9); c.closePath(); c.fill();
    }
    vstrokes(c, r, cx - R * 0.9, cy - ry, R * 1.8, ry * 1.6, 500, "rgba(0,0,0,0.12)");
    L.push(l1);
    L.push(bank(0.1, 61, -20, W + 20, h * 0.62, h * 0.74, Math.max(22, W * 0.025), "#c6cac1", "#9aa199", "rgba(70,78,74,0.22)", W * 0.0025));

    // near: the black cliff, the near sea of cloud, the outcrop with the cats
    var l2 = layer(W, H, 0.2); c = l2.setup(dpr); h = l2.h;
    c.fillStyle = "#070908"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.26, 0);
    c.bezierCurveTo(W * 0.24, h * 0.12, W * 0.16, h * 0.14, W * 0.17, h * 0.26);
    c.bezierCurveTo(W * 0.18, h * 0.36, W * 0.1, h * 0.4, W * 0.11, h * 0.5);
    c.lineTo(W * 0.06, h * 0.62); c.lineTo(0, h * 0.64); c.closePath(); c.fill();
    c.save(); c.clip(); vstrokes(c, r, 0, 0, W * 0.26, h * 0.64, 260, "rgba(120,128,122,0.25)"); c.restore();
    c.strokeStyle = "rgba(150,158,152,0.4)"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(W * 0.26, 0); c.bezierCurveTo(W * 0.24, h * 0.12, W * 0.16, h * 0.14, W * 0.17, h * 0.26); c.stroke();
    L.push(l2);
    // the near bank drifts twice as fast as the far one
    L.push(bank(0.2, 67, -40, W * 0.8, h * 0.72, h * 1.05, Math.max(34, W * 0.045), "#dfe2d9", "#b4bab2", "rgba(70,78,74,0.22)", W * 0.005));
    l2 = layer(W, H, 0.2); c = l2.setup(dpr);
    // the outcrop: stacked blocks and pipes climbing toward the right edge
    var top = [];
    c.fillStyle = "#0a0d0c"; c.beginPath(); c.moveTo(W * 0.58, h * 1.05);
    for (var ox = 0; ox <= 1; ox += 0.1) { var tx = lerp(W * 0.6, W * 1.02, ox), ty = lerp(h * 0.86, h * 0.52, ox) + (r() - 0.5) * h * 0.03; top.push([tx, ty]); c.lineTo(tx, ty); }
    c.lineTo(W * 1.02, h * 1.05); c.closePath(); c.fill();
    c.save(); c.clip(); vstrokes(c, r, W * 0.6, h * 0.6, W * 0.42, h * 0.45, 260, "rgba(110,118,113,0.25)"); c.restore();
    // the third pipe gave way to the cats' girder
    for (var pi = 0; pi < 4; pi++) { if (pi === 2) continue; var p0 = top[2 + pi * 2]; c.fillStyle = "#1a201d"; c.save(); c.translate(p0[0], p0[1] + 10); c.rotate(-0.6); c.fillRect(-6, -60, 13, 70); c.fillStyle = "rgba(170,178,172,0.3)"; c.fillRect(-6, -60, 3, 70); c.restore(); }
    for (var ti = 0; ti < top.length - 1; ti++) {
      var a3 = top[ti], b3 = top[ti + 1];
      if (r() < 0.6) for (var mx = 0; mx < 1; mx += 0.2) cushion(c, r, lerp(a3[0], b3[0], mx), lerp(a3[1], b3[1], mx), 2.4 + r() * 2.4, 0.95);
    }
    // the cats' perch: a girder jutting out of the rock, flat and clear of the slope so both read
    // against the clouds, the sitter at its tip, the other lying behind; a brace holds it up
    function groundAt(x) {
      for (var gi = 0; gi < top.length - 1; gi++) if (x <= top[gi + 1][0]) return lerp(top[gi][1], top[gi + 1][1], clamp((x - top[gi][0]) / (top[gi + 1][0] - top[gi][0]), 0, 1));
      return top[top.length - 1][1];
    }
    var catS = Math.max(18, W * 0.018), gx = top[7][0], gy = groundAt(gx), g0 = gx - 3.5 * catS, gt = 0.24 * catS;
    var bx = gx - 0.5 * catS;
    c.strokeStyle = "#1a201d"; c.lineWidth = 0.13 * catS; c.lineCap = "butt";
    c.beginPath(); c.moveTo(g0 + 0.9 * catS, gy + gt / 2); c.lineTo(bx, groundAt(bx) + 4); c.stroke();
    c.fillStyle = "#1a201d"; c.fillRect(g0, gy, gx + 0.3 * catS - g0, gt);
    c.fillStyle = "rgba(170,178,172,0.3)"; c.fillRect(g0, gy, gx + 0.3 * catS - g0, 1);
    var perch = { lie: [gx - 1.4 * catS, gy], sit: [g0 + 0.75 * catS, gy], s: catS };
    L.push(l2);

    var streams = [];
    for (var st = 0; st < 3; st++) streams.push({ y: 0.32 + st * 0.08 + r() * 0.04, len: 0.4 + r() * 0.3, th: 8 + r() * 14, sp: 6 + r() * 8, ph: r() });
    var nextBolt = 4, sitter = makeSittingCat(5), lounger = makeLyingCat(11);
    return {
      layers: L, motes: 14, manta: false,
      live: function (ctx, t, p) {
        // white streamers drifting through the scene
        streams.forEach(function (s) {
          var x0 = ((t * s.sp / W + s.ph) % 1.6 - 0.5) * W, y0 = H * s.y - 2 * 0.1 * H * p;
          var gr = ctx.createLinearGradient(x0, 0, x0 + W * s.len, 0); gr.addColorStop(0, "rgba(220,224,216,0)"); gr.addColorStop(0.3, "rgba(220,224,216,0.75)"); gr.addColorStop(1, "rgba(220,224,216,0)");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x0, y0);
          ctx.bezierCurveTo(x0 + W * s.len * 0.3, y0 - s.th, x0 + W * s.len * 0.7, y0 + s.th * 0.6, x0 + W * s.len, y0 - s.th * 0.4);
          ctx.bezierCurveTo(x0 + W * s.len * 0.7, y0 + s.th * 1.2, x0 + W * s.len * 0.3, y0 + s.th * 0.3, x0, y0 + s.th * 0.5);
          ctx.closePath(); ctx.fill();
        });
        // now and then, lightning falls from the ring into the void
        if (t > nextBolt && t < nextBolt + 0.22) {
          var br = rng((nextBolt * 100) | 0);
          ctx.strokeStyle = "rgba(235,238,230,0.9)"; ctx.lineWidth = 1.2;
          for (var b = 0; b < 3; b++) {
            var bx = W * (0.42 + br() * 0.28), by = H * 0.3 - 2 * 0.1 * H * p;
            ctx.beginPath(); ctx.moveTo(bx, by);
            for (var sg = 0; sg < 8; sg++) { bx += (br() - 0.5) * 14; by += H * 0.035; ctx.lineTo(bx, by); }
            ctx.stroke();
          }
        } else if (t > nextBolt + 0.22) nextBolt = t + 6 + Math.random() * 9;
        // the cats ride with the near layer
        var dy = -2 * 0.2 * H * p;
        sitter(ctx, perch.sit[0], perch.sit[1] + dy, perch.s, t);
        lounger(ctx, perch.lie[0], perch.lie[1] + dy, perch.s, t);
      },
    };
  }

  /* ---------------- scene: the hanging forest (-1200 m) ----------------
     A dense ceiling of trusses seen from below; a forest of modular columns hangs from it
     into a pale void; on the right a pale pillar, scaffolding and a lit facade, a box leaking
     a thin stream. */
  function forest(W, H, dpr) {
    var r = rng(77), L = [];
    function column(c, x, w, y1, tone, panel, detail, level, a) {
      var y = -10, segs = [];
      while (y < y1) { var sl = (0.03 + r() * 0.1) * H, ww = w * (0.6 + r() * 0.6); segs.push([y, Math.min(y1, y + sl), ww]); y += sl; }
      segs.forEach(function (s, i) {
        var x0 = x - s[2] / 2, sh = s[1] - s[0];
        c.fillStyle = tone; c.fillRect(x0, s[0], s[2], sh);
        if (detail) {
          if (r() < 0.55) { c.fillStyle = panel; c.fillRect(x0 + s[2] * 0.12, s[0] + sh * 0.12, s[2] * (0.35 + r() * 0.45), sh * (0.3 + r() * 0.55)); }
          c.fillStyle = "rgba(190,196,190,0.18)"; c.fillRect(x0, s[0], Math.max(1, s[2] * 0.08), sh);
          c.strokeStyle = "rgba(0,0,0,0.55)"; c.lineWidth = 1; c.strokeRect(x0, s[0], s[2], sh);
          vstrokes(c, r, x0, s[0], s[2], sh, sh * s[2] / 260, "rgba(0,0,0,0.35)");
          if (r() < 0.45) { c.strokeStyle = "rgba(20,24,22,0.95)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + s[2] + 3, s[0]); c.quadraticCurveTo(x0 + s[2] + 8, s[0] + sh / 2, x0 + s[2] + 2, s[1]); c.stroke(); }
          var prev = segs[i - 1];
          if (prev && s[2] > prev[2] * 1.08 && r() < level + 0.25) {
            var sz = Math.max(1.4, (s[2] - prev[2]) * 0.3);
            cushion(c, r, x - (s[2] + prev[2]) / 4, s[0], sz, a); cushion(c, r, x + (s[2] + prev[2]) / 4, s[0], sz, a);
          }
        }
      });
      var last = segs[segs.length - 1];
      c.fillStyle = tone;
      for (var k = 0; k < last[2] / 1.5; k++) c.fillRect(x - last[2] / 2 + r() * last[2], y1, Math.max(1, r() * 2.5), r() * r() * H * 0.1);
      if (detail && r() < level + 0.2) for (var m = 0; m < 2 + r() * 6; m++) drape(c, r, x - last[2] / 2 + r() * last[2], y1 + 2, (10 + r() * 70) * level, 0.7 + r() * 1.3, a);
    }

    // back: the pale void and the crowd of distant columns, their ends forming a ragged horizon
    var l0 = layer(W, H, 0.03), c = l0.setup(dpr), h = l0.h;
    var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#3a423e"); g.addColorStop(0.45, "#8a918b"); g.addColorStop(1, "#7a817c");
    c.fillStyle = g; c.fillRect(0, 0, W, h);
    for (var i = 0; i < 220; i++) {
      var x = r() * W, w = 2 + r() * 9, end = h * (0.36 + r() * 0.2 + r() * r() * 0.15), k2 = r();
      column(c, x, w, end, "rgba(" + (lerp(70, 40, k2) | 0) + "," + (lerp(77, 46, k2) | 0) + "," + (lerp(73, 43, k2) | 0) + ",0.95)", null, false, 0, 1);
    }
    L.push(l0);

    // middle: the ceiling trusses seen from below, and the middle rank of columns
    var l1 = layer(W, H, 0.1); c = l1.setup(dpr); h = l1.h;
    var ch = h * 0.3, vx = W * 0.45, vy = -h * 0.9;
    c.fillStyle = "#151a18"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, ch * 0.9);
    for (var bx = W; bx >= 0; bx -= 10) c.lineTo(bx, ch * (0.82 + r() * 0.2));
    c.closePath(); c.fill();
    c.save(); c.beginPath(); c.rect(0, 0, W, ch * 1.02); c.clip();
    c.lineWidth = 1;
    for (var rx = -W; rx < W * 2; rx += 22) { c.strokeStyle = "rgba(175,182,176," + (0.12 + r() * 0.25) + ")"; c.beginPath(); c.moveTo(vx, vy); c.lineTo(rx, ch); c.stroke(); }
    for (var hy = 6; hy < ch; hy += 6 + hy * 0.12) { c.strokeStyle = "rgba(175,182,176," + (0.15 + r() * 0.2) + ")"; c.lineWidth = r() < 0.3 ? 2 : 1; c.beginPath(); c.moveTo(0, hy); c.lineTo(W, hy + (r() - 0.5) * 6); c.stroke(); }
    for (var tb = 0; tb < 420; tb++) { var tx = r() * W, ty = r() * ch, tl = 10 + r() * 50, ta = r() * Math.PI; c.strokeStyle = "rgba(175,182,176," + (0.08 + r() * 0.22) + ")"; c.lineWidth = r() < 0.2 ? 2 : 1; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + Math.cos(ta) * tl, ty + Math.sin(ta) * tl * 0.4); c.stroke(); }
    for (var d = 0; d < 260; d++) { var dx0 = r() * W, dy0 = r() * ch; c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(dx0, dy0); c.lineTo(dx0 + (r() - 0.5) * 40, dy0 + r() * 16); c.stroke(); }
    specks(c, r, 0, 0, W, ch, 260, 0.5);
    c.restore();
    for (var j = 0; j < 34; j++) { var x1 = r() * W * 0.78, w1 = 7 + r() * 16; column(c, x1, w1, h * (0.46 + r() * 0.3), "#262d2a", "rgba(170,178,172,0.3)", true, 0.65, 0.75); }
    L.push(l1);

    // near: great columns, the pale pillar, scaffolding, the lit facade and its leaking box
    var l2 = layer(W, H, 0.2); c = l2.setup(dpr); h = l2.h;
    [[0.06, 0.035, 0.86], [0.2, 0.06, 0.98], [0.4, 0.03, 0.8], [0.57, 0.055, 1.02], [0.69, 0.03, 0.88]].forEach(function (cc) { column(c, W * cc[0], Math.max(24, W * cc[1]), h * cc[2], "#141917", "#7c837d", true, 0.75, 1); });
    var pg = c.createLinearGradient(W * 0.79, 0, W * 0.84, 0); pg.addColorStop(0, "#8d948e"); pg.addColorStop(1, "#5f6762");
    c.fillStyle = pg; c.fillRect(W * 0.79, 0, W * 0.05, h);
    vstrokes(c, r, W * 0.79, 0, W * 0.05, h, 120, "rgba(0,0,0,0.25)");
    var fx = W * 0.84;
    c.fillStyle = "#0e1211"; c.fillRect(fx, 0, W - fx, h);
    var wx0 = fx + (W - fx) * 0.18, cw = 12, cwh = 11;
    for (var wy = 4; wy < h; wy += cwh + 3) {
      for (var wx = wx0; wx < W - 3; wx += cw + 3) {
        var lit = r(); c.fillStyle = lit < 0.025 ? "rgba(201,162,83,0.8)" : lit < 0.2 ? "rgba(205,209,200,0.45)" : lit < 0.6 ? "rgba(28,34,31,0.95)" : "rgba(20,25,23,0.95)";
        c.fillRect(wx, wy, cw, cwh);
      }
      if (r() < 0.4) mossEdge(c, r, wx0, W, wy + cwh + 1, 2, 0.6, 0.9, 14);
    }
    c.strokeStyle = "rgba(180,188,182,0.55)"; c.lineWidth = 1.5;
    for (var sy = 0; sy < h; sy += 40) {
      c.beginPath(); c.moveTo(fx, sy); c.lineTo(wx0 - 2, sy + 40); c.stroke();
      c.beginPath(); c.moveTo(fx, sy); c.lineTo(wx0 - 2, sy); c.stroke();
    }
    c.beginPath(); c.moveTo(fx + 2, 0); c.lineTo(fx + 2, h); c.moveTo(wx0 - 3, 0); c.lineTo(wx0 - 3, h); c.stroke();
    var bxx = fx - W * 0.06, byy = h * 0.5, bw = W * 0.065, bh = h * 0.075;
    c.save(); c.translate(bxx + bw / 2, byy + bh / 2); c.rotate(-0.35);
    c.fillStyle = "#3c4440"; c.fillRect(-bw / 2, -bh / 2, bw, bh);
    c.fillStyle = "#6f7671"; c.fillRect(-bw / 2, -bh / 2, bw, bh * 0.25);
    c.strokeStyle = "rgba(0,0,0,0.6)"; c.lineWidth = 1; for (var bl = 1; bl < 5; bl++) { c.beginPath(); c.moveTo(-bw / 2 + bw * bl / 5, -bh / 2); c.lineTo(-bw / 2 + bw * bl / 5, bh / 2); c.stroke(); }
    c.restore();
    mossEdge(c, r, bxx + bw * 0.1, bxx + bw * 0.9, byy + bh * 0.05, 2.4, 0.7, 1, 20);
    c.strokeStyle = "rgba(225,230,226,0.6)"; c.lineWidth = 1.2; c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(bxx + 4, byy + bh * 0.85); c.quadraticCurveTo(bxx - W * 0.06, byy + bh * 1.5, bxx - W * 0.1, h * 0.9); c.stroke(); c.setLineDash([]);
    L.push(l2);
    return { layers: L, motes: 30, manta: true };
  }

  /* ---------------- band: compose layers by scroll, animate only on screen ---------------- */
  function drawManta(c, x, y, span, ang, flap, alpha) {
    c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(span, span);
    var fw = Math.sin(flap) * 0.07, tip = 0.5 * (1 - Math.abs(Math.sin(flap)) * 0.06);
    c.fillStyle = "rgba(120,130,126," + alpha + ")";
    c.beginPath(); c.moveTo(0, -0.2); c.lineTo(0.05, -0.27); c.lineTo(0.08, -0.18);
    c.quadraticCurveTo(0.3, -0.17 + fw * 0.3, tip, -0.02 + fw); c.quadraticCurveTo(0.25, 0.04, 0.09, 0.16); c.lineTo(0, 0.2); c.lineTo(-0.09, 0.16);
    c.quadraticCurveTo(-0.25, 0.04, -tip, -0.02 + fw); c.quadraticCurveTo(-0.3, -0.17 + fw * 0.3, -0.08, -0.18); c.lineTo(-0.05, -0.27); c.closePath(); c.fill();
    c.restore();
  }
  function band(cv, make) {
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, scene = null, motes = [], visible = false, raf = 0;
    var paused = false, pausedAt = 0, lag = 0, last = performance.now(); // lag: time spent paused, kept off the clock
    function resize() {
      var d = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h || (w === W && h === H && d === dpr)) return; // the observer's first call repeats the initial size
      dpr = d; W = w; H = h;
      cv.width = W * dpr; cv.height = H * dpr; scene = make(W, H, dpr);
      var r = rng(9); motes = [];
      for (var i = 0; i < scene.motes; i++) motes.push({ x: r() * W, y: r() * H, sp: 2 + r() * 5, ph: r() * 6.3, rad: 0.7 + r() * 1.4, brass: r() < 0.2 });
      paint(paused ? last : performance.now() - lag);
    }
    function progress() { var b = cv.getBoundingClientRect(), vh = window.innerHeight; return clamp((vh - b.top) / (vh + b.height), 0, 1); }
    function paint(now) {
      if (!scene) return;
      var p = reduce ? 0.5 : progress(), t = now / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      scene.layers.forEach(function (l) {
        var y = (-2 * l.k * H * p + (l.y0 || 0)) * dpr;
        if (!l.drift) return ctx.drawImage(l.cv, 0, y);
        var x = (reduce ? 0 : (t * l.drift) % W) * dpr; // a drifting layer tiles: two copies side by side
        ctx.drawImage(l.cv, x, y); ctx.drawImage(l.cv, x - W * dpr, y);
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (scene.manta && !reduce) { // one ray drifting between the columns, now and then
        var cyc = (t % 48) / 48;
        if (cyc < 0.6) {
          var u = cyc / 0.6, mx = lerp(-0.1, 0.75, u) * W, my = H * (0.42 + 0.06 * Math.sin(u * 5)) - 2 * 0.1 * H * p;
          drawManta(ctx, mx, my, Math.max(40, W * 0.05), 0.08 * Math.cos(u * 5), t * 1.1, 0.55 * Math.sin(u * Math.PI));
        }
      }
      if (scene.live) scene.live(ctx, reduce ? 0 : t, p);
      motes.forEach(function (m) {
        var y = reduce ? m.y : ((m.y - t * m.sp) % H + H) % H, x = m.x + (reduce ? 0 : Math.sin(t * 0.35 + m.ph) * 8);
        var a = reduce ? 0.45 : 0.3 + 0.3 * Math.sin(t * (m.brass ? 1.6 : 0.6) + m.ph), col = m.brass ? "201,162,83" : "191,232,222";
        ctx.fillStyle = "rgba(" + col + "," + a * 0.35 + ")"; ctx.beginPath(); ctx.arc(x, y, m.rad * 3, 0, 6.29); ctx.fill();
        ctx.fillStyle = "rgba(" + col + "," + a + ")"; ctx.beginPath(); ctx.arc(x, y, m.rad * 0.6, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = ctx.createPattern(grain, "repeat"); ctx.fillRect(0, 0, W, H);
      // melt into the page above and below
      var f = ctx.createLinearGradient(0, 0, 0, H);
      f.addColorStop(0, "rgba(13,16,15,1)"); f.addColorStop(0.12, "rgba(13,16,15,0)"); f.addColorStop(0.8, "rgba(13,16,15,0)"); f.addColorStop(1, "rgba(13,16,15,1)");
      ctx.fillStyle = f; ctx.fillRect(0, 0, W, H);
    }
    function schedule() { if (visible && !raf && !reduce && !paused) raf = requestAnimationFrame(loop); }
    function loop(now) { raf = 0; last = now - lag; paint(last); schedule(); }
    function setPaused(p) {
      if (p === paused) return;
      paused = p;
      if (p) { pausedAt = performance.now(); if (raf) cancelAnimationFrame(raf); raf = 0; }
      else { lag += performance.now() - pausedAt; schedule(); }
    }
    var io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && paused) paint(last); // frozen, but framed for where the band now sits
      schedule();
    });
    var ro = new ResizeObserver(resize);
    io.observe(cv); ro.observe(cv);
    resize();
    return {
      setPaused: setPaused,
      destroy: function () { if (raf) cancelAnimationFrame(raf); raf = 0; visible = false; io.disconnect(); ro.disconnect(); },
    };
  }
  return { band: band, clouds: clouds, forest: forest };
}
