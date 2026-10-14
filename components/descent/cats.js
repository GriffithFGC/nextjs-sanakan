/*
 * The two cats on the outcrop at -340 m, drawn live, black on the rock.
 *
 * - The sitting cat turns its back to us and watches the void. Its body is traced from a
 *   reference photo; only the tail moves.
 * - The lying cat rests on a ledge and, now and then, pushes up into a long stretch (front paws
 *   forward, rump high, tail up) before settling again. Both poses share one skeleton: bones of
 *   fixed length, a fixed thickness profile, legs solved by two-bone IK. Only angles and paw
 *   targets are blended, so the body keeps its proportions through the whole move.
 * - Tails are chains of short segments bent by a curvature wave that travels from the base to
 *   the tip: a slow idle drift, and swishes that come and go on their own schedule.
 *
 * Units: 1 = height of the sitting cat, origin on the ground under the cat, y up is negative.
 * The lying cat's head points to -x. Every function is pure in `t` (seconds), so pausing or
 * stilling the scene is just a matter of the time passed in.
 */
var INK = "#040605";
var TAU = Math.PI * 2;

function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(e0, e1, x) { var k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); }
function easeInOut(k) { k = clamp(k, 0, 1); return 0.5 - 0.5 * Math.cos(Math.PI * k); }

// smooth 1D value noise in [-1, 1]
function noise(seed) {
  var r = rng(seed), v = [];
  for (var i = 0; i < 256; i++) v.push(r() * 2 - 1);
  return function (x) { var i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f); return lerp(v[i & 255], v[(i + 1) & 255], k); };
}

// Episodes on a random schedule: the first starts at `first`, the next after a gap in [g0, g1];
// each lasts [d0, d1]. Returns the episode running at t ({ u: 0..1 progress, e }) or null.
function episodes(seed, first, g0, g1, d0, d1) {
  var r = rng(seed), list = [], end = null;
  return function (t) {
    if (end === null) { var d = d0 + r() * (d1 - d0); list.push({ s: first, d: d, a: 0.65 + r() * 0.35, ph: r() * TAU }); end = first + d; }
    while (end < t + 1) { var s = end + g0 + r() * (g1 - g0), dd = d0 + r() * (d1 - d0); list.push({ s: s, d: dd, a: 0.65 + r() * 0.35, ph: r() * TAU }); end = s + dd; }
    while (list.length > 1 && list[0].s + list[0].d < t) list.shift();
    var e = list[0];
    return e && t >= e.s && t <= e.s + e.d ? { u: (t - e.s) / e.d, e: e } : null;
  };
}

/* ---------------- tails ---------------- */

// Walk a chain of n segments from (x, y) at angle a0; curve(u) is the turn (radians per whole
// tail) at u in 0..1. Returns the points along the chain.
function chain(x, y, a0, len, n, curve) {
  var pts = [[x, y]], a = a0, dl = len / n;
  for (var i = 0; i < n; i++) {
    a += curve((i + 0.5) / n) / n;
    x += Math.cos(a) * dl; y += Math.sin(a) * dl; pts.push([x, y]);
  }
  return pts;
}
// Fill a tapered tube along pts, radius r0 at the base to r1 at the tip, round tip. If `floor`
// is set, no point dips below the ground (y = 0) minus its radius.
function tube(c, pts, r0, r1, floor) {
  var n = pts.length - 1, L = [], R = [];
  for (var i = 0; i <= n; i++) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    var rad = lerp(r0, r1, i / n), px = pts[i][0], py = pts[i][1];
    if (floor) py = Math.min(py, -rad);
    pts[i] = [px, py];
    L.push([px - dy / d * rad, py + dx / d * rad]); R.push([px + dy / d * rad, py - dx / d * rad]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (i = 1; i <= n; i++) c.lineTo(L[i][0], L[i][1]);
  for (i = n; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(pts[n][0], pts[n][1], r1, 0, TAU); c.fill();
  c.beginPath(); c.arc(pts[0][0], pts[0][1], r0, 0, TAU); c.fill();
}

/* ---------------- the sitting cat, from behind ---------------- */

// Traced from a reference photo (content/tools/trace-cat.py): ears to ground = 1, axis at x = 0.
var SIT = [-0.171,-0.996,-0.157,-0.99,-0.103,-0.941,-0.08,-0.933,-0.042,-0.938,-0.009,-0.934,0.019,-0.942,0.029,-0.948,0.056,-0.982,0.074,-0.994,0.086,-0.992,0.097,-0.976,0.101,-0.952,0.096,-0.888,0.105,-0.853,0.099,-0.806,0.097,-0.732,0.131,-0.683,0.141,-0.651,0.148,-0.544,0.172,-0.482,0.172,-0.469,0.179,-0.457,0.183,-0.431,0.199,-0.391,0.205,-0.356,0.211,-0.347,0.236,-0.337,0.236,-0.321,0.274,-0.277,0.29,-0.218,0.286,-0.174,0.274,-0.143,0.267,-0.096,0.236,-0.054,0.218,-0.019,0.182,0,-0.184,0.001,-0.173,-0.02,-0.211,-0.082,-0.225,-0.114,-0.23,-0.147,-0.24,-0.155,-0.244,-0.175,-0.241,-0.206,-0.244,-0.248,-0.232,-0.297,-0.218,-0.323,-0.219,-0.343,-0.21,-0.353,-0.197,-0.378,-0.186,-0.443,-0.173,-0.472,-0.172,-0.517,-0.16,-0.57,-0.161,-0.614,-0.155,-0.676,-0.136,-0.733,-0.139,-0.745,-0.158,-0.766,-0.167,-0.804,-0.17,-0.833,-0.155,-0.896,-0.159,-0.927,-0.176,-0.98,-0.175,-0.991];

function outline(c, flat) {
  // a closed curve through the midpoints, the traced points as control points: no corners
  var n = flat.length / 2, mx = function (i) { i = (i + n) % n; return (flat[2 * i] + flat[2 * ((i + 1) % n)]) / 2; }, my = function (i) { i = (i + n) % n; return (flat[2 * i + 1] + flat[2 * ((i + 1) % n) + 1]) / 2; };
  c.beginPath(); c.moveTo(mx(-1), my(-1));
  for (var i = 0; i < n; i++) c.quadraticCurveTo(flat[2 * i], flat[2 * i + 1], mx(i), my(i));
  c.closePath(); c.fill();
}

export function makeSittingCat(seed) {
  var drift = noise(seed), flicks = episodes(seed + 1, 3 + (seed % 5), 5, 12, 1.8, 3.6);
  return function draw(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = INK;
    outline(c, SIT);
    // the tail leaves from under the left haunch, lies along the ground and curls up at the tip;
    // the base stays put under the cat's weight, the free end does the talking
    var f = flicks(t), env = f ? Math.pow(Math.sin(Math.PI * f.u), 2) * f.e.a : 0, ph = f ? f.e.ph : 0;
    var pts = chain(-0.06, -0.035, Math.PI + 0.04, 0.6, 22, function (u) {
      var free = smooth(0.32, 0.8, u);
      var rest = 6.4 * smooth(0.4, 0.85, u);
      var idle = 1.3 * drift(t * 0.3 - u * 0.9) + 0.5 * Math.sin(t * 0.9 - u * 2.2);
      var swish = env * 4.2 * Math.sin(t * 5.2 - u * 3.4 + ph);
      return rest + free * (idle + swish);
    });
    tube(c, pts, 0.042, 0.034, true);
    c.restore();
  };
}

/* ---------------- the lying cat and its stretch ---------------- */

var BONE = { sb: 0.32, bh: 0.3, ht: 0.1, neck: 0.2, arm: 0.25, fore: 0.3, thigh: 0.25, shank: 0.3 };
// Lying: a loaf on the ledge, head up, forearms flat (sphinx), hind legs folded along the belly.
// Bow: chest down, forearms far forward, rump high on near-straight hind legs, tail up.
var LIE = { sx: -0.28, sy: -0.165, a1: -0.07, a2: 0.07, a3: 0.75, neck: -1.95, tilt: 0.05, fp: -0.56, fp2: -0.5, hp: 0.38, hp2: 0.4 };
var BOW = { sx: -0.34, sy: -0.2, a1: -0.68, a2: -0.5, a3: -1.35, neck: -2.9, tilt: -0.3, fp: -0.84, fp2: -0.76, hp: 0.3, hp2: 0.24 };

// Two-bone IK: from joint j to target p with bone lengths l1, l2; bend picks the elbow's side.
function ik(j, p, l1, l2, bend) {
  var dx = p[0] - j[0], dy = p[1] - j[1], d = clamp(Math.hypot(dx, dy), 1e-4, l1 + l2 - 1e-4);
  var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  var ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
  return [[j[0] + ux * a - uy * h * bend, j[1] + uy * a + ux * h * bend], [j[0] + ux * d, j[1] + uy * d]];
}
// circles along a bone, radius r0 to r1, added to the current path; never below the ground
function bone(c, a, b, r0, r1) {
  var len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(len / 0.02));
  for (var i = 0; i <= n; i++) {
    var k = i / n, x = lerp(a[0], b[0], k), r = lerp(r0, r1, k), y = Math.min(lerp(a[1], b[1], k), -r);
    c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
  }
}
function dot(c, x, y, rx, ry, rot) { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }

export function makeLyingCat(seed) {
  var drift = noise(seed), flicks = episodes(seed + 1, 2.5, 4, 10, 1.6, 3.2);
  // the stretch: first one soon after the scene shows up, then every half minute or so
  var stretches = episodes(seed + 2, 7, 18, 34, 7.6, 9);

  function pose(t) {
    // 0 = lying, 1 = bow. Paws reach first, the rump follows, the tail lifts last; the return
    // runs the same way, so nothing moves as one rigid block
    var st = stretches(t), k = { paw: 0, hip: 0, tail: 0, push: 0 };
    if (st) {
      var T = st.u * st.e.d, D = st.e.d, up = 2.4, down = 2.6;
      var part = function (delay, dur) { return easeInOut((T - delay) / dur) * (1 - easeInOut((T - (D - down) - delay * 0.6) / dur)); };
      k.paw = part(0, up - 0.4); k.hip = part(0.35, up - 0.35); k.tail = part(0.6, up - 0.2);
      // while held, the cat pushes into the stretch twice, a slow breathing pull
      k.push = smooth(up, up + 0.5, T) * (1 - smooth(D - down - 0.3, D - down + 0.2, T)) * (0.5 - 0.5 * Math.cos((T - up) * 2.4));
    }
    return k;
  }

  return function draw(c, x, y, s, t) {
    var k = pose(t), P = function (key, kk) { return lerp(LIE[key], BOW[key], kk); };
    var breath = Math.sin(t * 1.3) * 0.006 * (1 - k.hip);
    var S = [P("sx", k.paw) - k.push * 0.015, P("sy", k.hip) + k.push * 0.012];
    var a1 = P("a1", k.hip), a2 = P("a2", k.hip), a3 = P("a3", k.tail);
    var B = [S[0] + Math.cos(a1) * BONE.sb, S[1] + Math.sin(a1) * BONE.sb];
    var H = [B[0] + Math.cos(a2) * BONE.bh, B[1] + Math.sin(a2) * BONE.bh];
    var T0 = [H[0] + Math.cos(a3) * BONE.ht, H[1] + Math.sin(a3) * BONE.ht];
    var na = P("neck", k.paw), head = [S[0] + Math.cos(na) * BONE.neck, S[1] + Math.sin(na) * BONE.neck], tilt = P("tilt", k.paw);

    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = INK;
    c.beginPath();
    // one silhouette: legs, body, neck and head all go into a single path, filled once.
    // Shoulders sit high in the chest so the elbows can rest on the ground; hips low in the haunch
    var fj = [S[0] + 0.03, S[1] - 0.1], hj = [H[0] - 0.01, H[1] + 0.05];
    var legs = [
      [fj, [P("fp2", k.paw) - k.push * 0.02, -0.035], BONE.arm, BONE.fore, 0.06, 0.04, -1],
      [fj, [P("fp", k.paw) - k.push * 0.03, -0.035], BONE.arm, BONE.fore, 0.065, 0.042, -1],
      [hj, [P("hp2", k.hip), -0.035], BONE.thigh, BONE.shank, 0.11, 0.042, 1],
      [hj, [P("hp", k.hip), -0.035], BONE.thigh, BONE.shank, 0.125, 0.045, 1],
    ];
    legs.forEach(function (l) {
      var m = ik(l[0], l[1], l[2], l[3], l[6]);
      bone(c, l[0], m[0], l[4], (l[4] + l[5]) / 2); bone(c, m[0], m[1], (l[4] + l[5]) / 2 * 0.8, l[5]);
      dot(c, m[1][0] - 0.02, -0.03, 0.055, 0.03, 0);
    });
    bone(c, [S[0] - 0.04, S[1] + 0.01], S, 0.14, 0.165 + breath);
    bone(c, S, B, 0.165 + breath, 0.152 + breath);
    bone(c, B, H, 0.152 + breath, 0.17);
    bone(c, S, head, 0.1, 0.085);
    // head: skull, muzzle toward where it looks, ears up from the skull
    var fa = Math.PI + tilt; // facing left, tilted
    dot(c, head[0], head[1], 0.115, 0.105, 0);
    dot(c, head[0] + Math.cos(fa) * 0.085, head[1] + Math.sin(fa) * 0.085 + 0.028, 0.06, 0.045, tilt);
    c.fill();
    [[-0.6, 0.05], [0.4, 0.055]].forEach(function (e) {
      var ea = -Math.PI / 2 + e[0] + tilt, bx = head[0] + Math.cos(ea) * 0.085, by = head[1] + Math.sin(ea) * 0.085;
      var tx = head[0] + Math.cos(ea) * 0.185, ty = head[1] + Math.sin(ea) * 0.185, nx = -Math.sin(ea) * e[1], ny = Math.cos(ea) * e[1];
      c.beginPath(); c.moveTo(bx - nx, by - ny); c.lineTo(tx, ty); c.lineTo(bx + nx, by + ny); c.closePath(); c.fill();
    });

    // tail: lies along the ledge, the tip lifting now and then; in the stretch it stands up and
    // hooks over toward the back
    var f = flicks(t), env = f ? Math.pow(Math.sin(Math.PI * f.u), 2) * f.e.a : 0, ph = f ? f.e.ph : 0;
    var pts = chain(T0[0], T0[1], a3, 0.78, 24, function (u) {
      var lie = (u < 0.22 ? -0.7 / 0.22 : 0) - 2.5 * smooth(0.8, 1, u); // down onto the ledge, tip turned up
      var bow = 3.7 * smooth(0.2, 0.95, u); // up from the rump, hooking back
      var rest = lerp(lie, bow, k.tail);
      var free = smooth(0.35, 0.9, u);
      // at rest the tip only ever lifts off the ledge, it never pushes into it
      var idle = -(0.55 + 0.45 * drift(t * 0.25 - u * 0.8)) * 0.9 * (1 - k.tail);
      var lift = -env * (4.2 + 2.6 * Math.sin(t * 4.4 - u * 3 + ph)) * (1 - k.tail);
      var sway = k.tail * 0.9 * Math.sin(t * 1.6 - u * 2.6 + ph);
      return rest + free * (idle + lift + sway);
    });
    tube(c, pts, 0.042, 0.032, true);
    c.restore();
  };
}
