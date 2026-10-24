"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { type ExElement, type Point, type Scene, box, linkOf } from "./excalidraw";
import { kindOf, routeHref, title } from "./files";
import type { ReaderContext } from "./Reader";

// An Excalidraw board: shapes and text in one SVG, embeds as HTML on top of it (videos must
// stay real players), all laid out in scene units times the zoom. The SVG takes Excalidraw's
// own dark-mode filter, so the colours match what Obsidian shows; embeds are left untouched.

const MIN_ZOOM = 0.02;
const MAX_ZOOM = 2;
const STEP = 1.25;

type Resolved = { path: string } | { url: string } | null;

export function Drawing({ ctx, path, scene }: { ctx: ReaderContext; path: string; scene: Scene }) {
  const port = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null); // null: fit the width
  const [playing, setPlaying] = useState<string | null>(null);
  const keep = useRef<{ cx: number; cy: number } | null>(null);
  // Signed once: a refreshed token must not reload what is on screen.
  const [media] = useState(() => (p: string) => ctx.gateway.mediaUrl(p, ctx.token));

  // Measured as soon as the viewport exists, then on every resize.
  const measure = useCallback((el: HTMLDivElement | null) => {
    port.current = el;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { bounds } = scene;
  const fit = width ? Math.min(1, width / bounds.width) : 0;
  const z = zoom ?? fit;

  // Zooming keeps the middle of the view where it was.
  const zoomTo = (next: number | null) => {
    const el = port.current;
    if (el && z) keep.current = { cx: (el.scrollLeft + el.clientWidth / 2) / z, cy: (el.scrollTop + el.clientHeight / 2) / z };
    setZoom(next === null ? null : Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  };
  useLayoutEffect(() => {
    const el = port.current;
    if (!el || !keep.current) return;
    el.scrollLeft = keep.current.cx * z - el.clientWidth / 2;
    el.scrollTop = keep.current.cy * z - el.clientHeight / 2;
    keep.current = null;
  }, [z]);

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
      <div className="sf6-board-bar" role="toolbar" aria-label="Zoom du dessin">
        <button type="button" className="sf6-ghost" onClick={() => zoomTo(z / STEP)} aria-label="Dézoomer">
          −
        </button>
        <button type="button" className="sf6-ghost" onClick={() => zoomTo(null)} aria-pressed={zoom === null}>
          Ajuster
        </button>
        <button type="button" className="sf6-ghost" onClick={() => zoomTo(z * STEP)} aria-label="Zoomer">
          +
        </button>
        <span className="num">{Math.round(z * 100)} %</span>
        <span className="sf6-board-hint">{embeds.length > 0 && `${embeds.length} média${embeds.length > 1 ? "s" : ""} · touche une vidéo pour la lire`}</span>
      </div>
      <div className="sf6-board-port" ref={measure} tabIndex={0} aria-label={`Dessin ${title(path)}`}>
        {z > 0 && (
          <div className="sf6-board-canvas" style={{ width: bounds.width * z, height: bounds.height * z }}>
            <Shapes scene={scene} z={z} resolve={resolve} />
            {embeds.map((e) => (
              <Embed key={e.id} e={e} scene={scene} z={z} target={e.type === "image" ? fileOf(e, scene, ctx, path) : resolve(e)} media={media} onPlay={setPlaying} />
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

function Embed({ e, scene, z, target, media, onPlay }: { e: ExElement; scene: Scene; z: number; target: Resolved; media: (p: string) => string; onPlay: (p: string) => void }) {
  const b = box(e);
  const style = {
    left: (b.x - scene.bounds.x) * z,
    top: (b.y - scene.bounds.y) * z,
    width: b.width * z,
    height: b.height * z,
    transform: e.angle ? `rotate(${e.angle}rad)` : undefined,
    fontSize: Math.max(9, Math.min(14, b.height * z * 0.08)),
  };
  if (!target) return <span className="sf6-tile sf6-tile-missing" style={style} title="Lien introuvable dans le dépôt" />;
  if ("url" in target)
    return (
      <a className="sf6-tile" style={style} href={target.url} target="_blank" rel="noopener noreferrer">
        <span>{new URL(target.url).hostname} ↗</span>
      </a>
    );
  const kind = kindOf(target.path);
  if (kind === "video") return <VideoTile path={target.path} style={style} media={media} onPlay={onPlay} />;
  if (kind === "image")
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URL from the gateway, not a static asset
      <img className="sf6-tile sf6-tile-img" style={style} src={media(target.path)} alt={title(target.path)} loading="lazy" decoding="async" />
    );
  return (
    <a className="sf6-tile" style={style} href={routeHref(target.path)}>
      <span>{title(target.path)}</span>
    </a>
  );
}

/** A still of the clip once the tile is on screen and big enough to show one; the clip plays in the player. */
function VideoTile({ path, style, media, onPlay }: { path: string; style: CSSProperties; media: (p: string) => string; onPlay: (p: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);
  const big = Number(style.width) >= 96;
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || !big) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, big]);
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

function Shapes({ scene, z, resolve }: { scene: Scene; z: number; resolve: (e: ExElement) => Resolved }) {
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
      <a key={e.id} href={href} className="sf6-board-link" {...("url" in to ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {g}
      </a>
    );
  });

  return (
    <svg
      className="sf6-board-svg"
      data-dark={scene.dark || undefined}
      width={bounds.width * z}
      height={bounds.height * z}
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
