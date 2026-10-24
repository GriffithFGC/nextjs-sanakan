"use client";

import { type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { type ExElement, type Point, type Scene, box, linkOf } from "./excalidraw";
import { kindOf, routeHref, title } from "./files";
import type { ReaderContext } from "./Reader";

// An Excalidraw board, explored like in Excalidraw: drag to move, wheel (or pinch) to zoom
// around the pointer. Shapes and text are one SVG, embeds are HTML on top of it (videos must
// stay real players); both sit on a stage in scene units that one CSS transform moves and
// scales. The SVG takes Excalidraw's own dark-mode filter, so the colours match Obsidian.

const MIN_ZOOM = 0.02;
const MAX_ZOOM = 4;
const DRAG = 4; // px of travel before a press becomes a drag rather than a click

type Resolved = { path: string } | { url: string } | null;
type View = { x: number; y: number; z: number };

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export function Drawing({ ctx, path, scene }: { ctx: ReaderContext; path: string; scene: Scene }) {
  const [port, setPort] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [moved, setMoved] = useState<View | null>(null); // null: the whole drawing, centred
  const [playing, setPlaying] = useState<string | null>(null);
  // Signed once: a refreshed token must not reload what is on screen.
  const [media] = useState(() => (p: string) => ctx.gateway.mediaUrl(p, ctx.token));

  // Measured as soon as the viewport exists, then on every resize.
  const measure = useCallback((el: HTMLDivElement | null) => {
    setPort(el);
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { bounds } = scene;
  const fit = useCallback((): View => {
    const z = clampZoom(Math.min(1, size.w / bounds.width, size.h / bounds.height));
    return { x: (size.w - bounds.width * z) / 2, y: (size.h - bounds.height * z) / 2, z };
  }, [size, bounds]);
  const view = moved ?? fit();

  // Read by the native listeners below, which are bound once.
  const live = useRef(view);
  useLayoutEffect(() => {
    live.current = view;
  });

  /** Zoom by `factor`, keeping the scene point under (cx, cy) where it is on screen. */
  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    const v = live.current;
    const z = clampZoom(v.z * factor);
    const k = z / v.z;
    setMoved({ x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, z });
  }, []);

  // Wheel and touch need non-passive listeners: the page must not scroll or zoom meanwhile.
  useEffect(() => {
    if (!port) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = port.getBoundingClientRect();
      const lines = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1;
      // ctrl+wheel is a trackpad pinch: its deltas are small, give them more weight
      const delta = e.deltaY * lines * (e.ctrlKey ? 10 : 1);
      zoomAt(Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.0025), e.clientX - r.left, e.clientY - r.top);
    };
    port.addEventListener("wheel", wheel, { passive: false });
    return () => port.removeEventListener("wheel", wheel);
  }, [port, zoomAt]);

  // Pointers: one moves the board, two pinch it. A press that barely moves stays a click.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dragging: boolean; start: { x: number; y: number }; pinch: number | null }>({ dragging: false, start: { x: 0, y: 0 }, pinch: null });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) gesture.current = { dragging: false, start: { x: e.clientX, y: e.clientY }, pinch: null };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const last = pointers.current.get(e.pointerId);
    if (!last || !port) return;
    const g = gesture.current;
    const now = { x: e.clientX, y: e.clientY };
    if (!g.dragging && Math.hypot(now.x - g.start.x, now.y - g.start.y) < DRAG) return;
    if (!g.dragging) {
      g.dragging = true;
      port.setPointerCapture(e.pointerId);
    }
    pointers.current.set(e.pointerId, now);
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = port.getBoundingClientRect();
      if (g.pinch) zoomAt(dist / g.pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      g.pinch = dist;
      // and the midpoint drags the board along
      const v = live.current;
      setMoved({ ...v, x: v.x + (now.x - last.x) / 2, y: v.y + (now.y - last.y) / 2 });
    } else {
      const v = live.current;
      setMoved({ ...v, x: v.x + now.x - last.x, y: v.y + now.y - last.y });
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    gesture.current.pinch = null;
  };

  // The click that ends a drag must not open the tile or link it started on.
  const onClickCapture = (e: MouseEvent) => {
    if (!gesture.current.dragging) return;
    e.preventDefault();
    e.stopPropagation();
    gesture.current.dragging = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 60;
    const v = live.current;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => setMoved({ ...v, x: v.x + step }),
      ArrowRight: () => setMoved({ ...v, x: v.x - step }),
      ArrowUp: () => setMoved({ ...v, y: v.y + step }),
      ArrowDown: () => setMoved({ ...v, y: v.y - step }),
      "+": () => zoomAt(1.25, size.w / 2, size.h / 2),
      "=": () => zoomAt(1.25, size.w / 2, size.h / 2),
      "-": () => zoomAt(1 / 1.25, size.w / 2, size.h / 2),
      "0": () => setMoved(null),
    };
    const run = moves[e.key];
    if (!run || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    run();
  };

  const resolve = (e: ExElement): Resolved => {
    const l = linkOf(e);
    if (!l) return null;
    if ("url" in l) return l;
    const p = ctx.vault.resolve(l.target, path);
    return p ? { path: p } : null;
  };

  const embeds = scene.elements.filter((e) => e.type === "embeddable" || e.type === "iframe" || e.type === "image");

  return (
    <div className="sf6-board">
      <div className="sf6-board-bar">
        <span className="sf6-board-hint">Glisser pour se déplacer · molette pour zoomer{embeds.length > 0 && " · clic sur une vidéo pour la lire"}</span>
        <span className="num" aria-live="polite">
          {Math.round(view.z * 100)} %
        </span>
        <button type="button" className="sf6-ghost" onClick={() => setMoved(null)} disabled={!moved}>
          Recentrer
        </button>
      </div>
      <div
        className="sf6-board-port"
        ref={measure}
        tabIndex={0}
        role="application"
        aria-label={`Dessin ${title(path)} : flèches pour se déplacer, + et − pour zoomer, 0 pour recentrer`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
      >
        {size.w > 0 && (
          <div className="sf6-board-stage" style={{ width: bounds.width, height: bounds.height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
            <Shapes scene={scene} resolve={resolve} />
            {embeds.map((e) => (
              <Embed key={e.id} e={e} scene={scene} z={view.z} root={port} target={e.type === "image" ? fileOf(e, scene, ctx, path) : resolve(e)} media={media} onPlay={setPlaying} />
            ))}
          </div>
        )}
      </div>
      <Player path={playing} media={media} onClose={() => setPlaying(null)} />
    </div>
  );
}

function fileOf(e: ExElement, scene: Scene, ctx: ReaderContext, from: string): Resolved {
  const link = e.fileId ? scene.files.get(e.fileId) : undefined;
  const wiki = link && /\[\[([^\]|#]+)/.exec(link);
  const p = wiki ? ctx.vault.resolve(wiki[1], from) : null;
  return p ? { path: p } : null;
}

// ---- embeds: videos as tiles that open a player, images as images, the rest as links

type EmbedProps = { e: ExElement; scene: Scene; z: number; root: HTMLElement | null; target: Resolved; media: (p: string) => string; onPlay: (p: string) => void };

function Embed({ e, scene, z, root, target, media, onPlay }: EmbedProps) {
  const b = box(e);
  // In scene units, like the stage; labels keep a readable size on screen whatever the zoom.
  const style = {
    left: b.x - scene.bounds.x,
    top: b.y - scene.bounds.y,
    width: b.width,
    height: b.height,
    transform: e.angle ? `rotate(${e.angle}rad)` : undefined,
    fontSize: Math.max(9, Math.min(14, b.height * z * 0.08)) / z,
    borderWidth: 1 / z,
  };
  if (!target) return <span className="sf6-tile sf6-tile-missing" style={style} title="Lien introuvable dans le dépôt" />;
  if ("url" in target)
    return (
      <a className="sf6-tile" style={style} href={target.url} target="_blank" rel="noopener noreferrer" draggable={false}>
        <span>{new URL(target.url).hostname} ↗</span>
      </a>
    );
  const kind = kindOf(target.path);
  if (kind === "video") return <VideoTile path={target.path} style={style} big={b.width * z >= 96} root={root} media={media} onPlay={onPlay} />;
  if (kind === "image")
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URL from the gateway, not a static asset
      <img className="sf6-tile sf6-tile-img" style={style} src={media(target.path)} alt={title(target.path)} loading="lazy" decoding="async" draggable={false} />
    );
  return (
    <a className="sf6-tile" style={style} href={routeHref(target.path)} draggable={false}>
      <span>{title(target.path)}</span>
    </a>
  );
}

/** A still of the clip once the tile is in view and big enough to show one; the clip plays in the player. */
function VideoTile({ path, style, big, root, media, onPlay }: { path: string; style: CSSProperties; big: boolean; root: HTMLElement | null; media: (p: string) => string; onPlay: (p: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || !big || !root) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), { root, rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, big, root]);
  return (
    <button type="button" ref={ref} className="sf6-tile sf6-tile-video" style={style} onClick={() => onPlay(path)} aria-label={`Lire ${title(path)}`}>
      {seen && big && <video src={`${media(path)}#t=0.1`} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" />}
      <span className="sf6-tile-play" aria-hidden="true">
        ▶
      </span>
    </button>
  );
}

function Player({ path, media, onClose }: { path: string | null; media: (p: string) => string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (path && d && !d.open) d.showModal();
  }, [path]);
  return (
    <dialog ref={ref} className="sf6-player" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current?.close()}>
      {path && (
        <>
          <div className="sf6-player-bar">
            <span>{title(path)}</span>
            <button type="button" className="sf6-ghost" onClick={() => ref.current?.close()}>
              Fermer
            </button>
          </div>
          <video key={path} src={media(path)} controls autoPlay playsInline />
        </>
      )}
    </dialog>
  );
}

// ---- shapes

function Shapes({ scene, resolve }: { scene: Scene; resolve: (e: ExElement) => Resolved }) {
  const uid = useId().replace(/:/g, "");
  const { bounds } = scene;
  const patterns = new Map<string, string>();
  const fillOf = (e: ExElement) => {
    const bg = e.backgroundColor;
    if (!bg || bg === "transparent") return "none";
    if (!e.fillStyle || e.fillStyle === "solid") return bg;
    const key = `${e.fillStyle}|${bg}`;
    if (!patterns.has(key)) patterns.set(key, `${uid}-p${patterns.size}`);
    return `url(#${patterns.get(key)})`;
  };

  const drawn = scene.elements.map((e) => {
    const shape = draw(e, fillOf);
    if (!shape) return null;
    const b = box(e);
    const rot = e.angle ? `rotate(${(e.angle * 180) / Math.PI} ${b.x + b.width / 2} ${b.y + b.height / 2})` : undefined;
    const g = (
      <g key={e.id} transform={rot} opacity={(e.opacity ?? 100) / 100}>
        {shape}
      </g>
    );
    const to = e.type === "embeddable" || e.type === "image" ? null : resolve(e);
    if (!to) return g;
    const href = "url" in to ? to.url : routeHref(to.path);
    return (
      <a key={e.id} href={href} className="sf6-board-link" draggable={false} {...("url" in to ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {g}
      </a>
    );
  });

  return (
    <svg
      className="sf6-board-svg"
      data-dark={scene.dark || undefined}
      width={bounds.width}
      height={bounds.height}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      aria-hidden="true"
    >
      <defs>
        {[...patterns].map(([key, id]) => {
          const [style, color] = key.split("|");
          return (
            <pattern key={id} id={id} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="12" stroke={color} strokeWidth="2" />
              {style === "cross-hatch" && <line x1="0" y1="6" x2="12" y2="6" stroke={color} strokeWidth="2" />}
            </pattern>
          );
        })}
      </defs>
      <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill={scene.background} />
      {drawn}
    </svg>
  );
}

function dash(e: ExElement): string | undefined {
  const sw = e.strokeWidth ?? 1;
  if (e.strokeStyle === "dashed") return `${8 * sw} ${6 * sw}`;
  if (e.strokeStyle === "dotted") return `${sw} ${4 * sw}`;
  return undefined;
}

function draw(e: ExElement, fillOf: (e: ExElement) => string): ReactNode {
  const stroke = e.strokeColor || "#1e1e1e";
  const sw = e.strokeWidth ?? 1;
  const common = { stroke, strokeWidth: sw, strokeDasharray: dash(e), strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const w = Math.abs(e.width), h = Math.abs(e.height);
  switch (e.type) {
    case "rectangle": {
      const r = e.roundness ? Math.min(32, Math.min(w, h) / 4) : 0;
      return <rect x={e.x} y={e.y} width={w} height={h} rx={r} fill={fillOf(e)} {...common} />;
    }
    case "ellipse":
      return <ellipse cx={e.x + w / 2} cy={e.y + h / 2} rx={w / 2} ry={h / 2} fill={fillOf(e)} {...common} />;
    case "diamond":
      return <polygon points={`${e.x + w / 2},${e.y} ${e.x + w},${e.y + h / 2} ${e.x + w / 2},${e.y + h} ${e.x},${e.y + h / 2}`} fill={fillOf(e)} {...common} />;
    case "line":
    case "arrow": {
      const pts = (e.points ?? []).map(([px, py]): Point => [e.x + px, e.y + py]);
      if (pts.length < 2) return null;
      return (
        <>
          <path d={pathOf(pts, !!e.roundness)} fill="none" {...common} />
          {head(pts[pts.length - 1], pts[pts.length - 2], e.endArrowhead, stroke, sw)}
          {head(pts[0], pts[1], e.startArrowhead, stroke, sw)}
        </>
      );
    }
    case "freedraw": {
      const pts = (e.points ?? []).map(([px, py]): Point => [e.x + px, e.y + py]);
      if (pts.length < 2) return null;
      return <path d={pathOf(pts, true)} fill="none" {...common} strokeWidth={sw * 2} strokeDasharray={undefined} />;
    }
    case "text":
      return <Text e={e} />;
    case "embeddable":
    case "iframe":
    case "image":
      return null; // drawn as HTML on top
    default:
      return null;
  }
}

/** Straight segments, or a smooth curve through the points (Catmull-Rom as Béziers). */
function pathOf(pts: Point[], smooth: boolean): string {
  const f = (n: number) => Math.round(n * 10) / 10;
  if (!smooth || pts.length < 3) return `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}`;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function head(tip: Point, from: Point, kind: string | null | undefined, color: string, sw: number): ReactNode {
  if (!kind) return null;
  const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const len = Math.hypot(tip[0] - from[0], tip[1] - from[1]);
  const s = Math.min(18 + sw * 4, len * 0.6);
  const wing = (da: number): Point => [tip[0] - s * Math.cos(a + da), tip[1] - s * Math.sin(a + da)];
  const [l, r] = [wing(0.45), wing(-0.45)];
  if (kind === "triangle" || kind === "triangle_outline")
    return <polygon points={`${tip.join(",")} ${l.join(",")} ${r.join(",")}`} fill={kind === "triangle" ? color : "none"} stroke={color} strokeWidth={sw} strokeLinejoin="round" />;
  if (kind === "dot" || kind === "circle" || kind === "circle_outline")
    return <circle cx={tip[0]} cy={tip[1]} r={s / 3} fill={kind === "circle_outline" ? "none" : color} stroke={color} strokeWidth={sw} />;
  if (kind === "bar") {
    const [b1, b2] = [wing(Math.PI / 2), wing(-Math.PI / 2)].map(([x, y]): Point => [x + s * Math.cos(a), y + s * Math.sin(a)]);
    return <path d={`M${b1.join(" ")}L${b2.join(" ")}`} stroke={color} strokeWidth={sw} strokeLinecap="round" />;
  }
  return <path d={`M${l.join(" ")}L${tip.join(" ")}L${r.join(" ")}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
}

/**
 * Text in the page's mono. Excalidraw measured its boxes with its own fonts: a line that
 * would overflow its box is narrowed to fit instead of spilling over the drawing.
 */
function Text({ e }: { e: ExElement }) {
  const size = e.fontSize ?? 20;
  const lh = size * (e.lineHeight ?? 1.25);
  const lines = (e.text ?? "").split("\n");
  const longest = Math.max(1, ...lines.map((l) => [...l].length));
  const k = Math.min(1, Math.abs(e.width) / (longest * size * 0.6));
  const align = e.textAlign === "center" ? "middle" : e.textAlign === "right" ? "end" : "start";
  const ax = align === "middle" ? e.x + e.width / 2 : align === "end" ? e.x + e.width : e.x;
  return (
    <text
      transform={k < 1 ? `translate(${ax} 0) scale(${k} 1) translate(${-ax} 0)` : undefined}
      x={ax}
      fontSize={size}
      fill={e.strokeColor || "#1e1e1e"}
      textAnchor={align}
      dominantBaseline="central"
      xmlSpace="preserve"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={ax} y={e.y + lh * (i + 0.5)}>
          {line || " "}
        </tspan>
      ))}
    </text>
  );
}
