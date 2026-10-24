"use client";

import { type MouseEvent, useEffect, useState } from "react";
import type { Gateway, Session } from "./api";
import { type Entry, KIND_LABEL, type Vault, basename, dirname, formatSize, kindOf, routeHref, title } from "./files";
import { Drawing } from "./Drawing";
import { type Scene, isDrawing, parseDrawing } from "./excalidraw";
import { type Heading, renderMarkdown } from "./markdown";

export type ReaderContext = { gateway: Gateway; vault: Vault; commit: string; token: string };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
export const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : "");

// ------------------------------------------------------------------ explorer

export function Explorer({ vault, current, session, onLock }: { vault: Vault; current: string; session: Session; onLock: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = query ? vault.search(query) : null;
  const { repo, key } = session;

  // On a phone the tree folds away; following a link closes it again.
  const close = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <aside className="sf6-side" data-open={open} aria-label="Fichiers du dépôt">
      <div className="sf6-repo">
        <p className="strata">Dépôt · lecture seule</p>
        <h2>
          <a href="#/">{repo.name}</a>
        </h2>
        {repo.description && <p className="sf6-desc">{repo.description}</p>}
        <p className="sf6-meta">
          <span>{repo.ref}</span> · <span className="num">{repo.commit.slice(0, 7)}</span>
          {repo.updated && <> · {formatDate(repo.updated)}</>}
        </p>
        <button type="button" className="sf6-nav-toggle" aria-expanded={open} aria-controls="sf6-tree" onClick={() => setOpen(!open)}>
          {open ? "Fermer" : "Fichiers"}
        </button>
      </div>

      <div id="sf6-tree" className="sf6-tree-wrap" onClick={close}>
        <label className="sr-only" htmlFor="sf6-search">
          Rechercher un fichier
        </label>
        <input id="sf6-search" className="sf6-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" autoComplete="off" spellCheck={false} />
        {results ? (
          <ul className="sf6-results" aria-live="polite">
            {results.length === 0 && <li className="sf6-empty">Aucun fichier.</li>}
            {results.map((e) => (
              <li key={e.path}>
                <a href={routeHref(e.path)} aria-current={e.path === current ? "page" : undefined}>
                  <b>{title(e.path)}</b>
                  <span>{dirname(e.path) || "/"}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <nav aria-label="Arborescence">
            <Tree vault={vault} dir="" current={current} />
          </nav>
        )}
        <p className="sf6-keyline">
          <span>Clé · {key.label || key.id}</span>
          <button type="button" className="sf6-ghost" onClick={onLock}>
            Verrouiller
          </button>
        </p>
      </div>
    </aside>
  );
}

function Tree({ vault, dir, current }: { vault: Vault; dir: string; current: string }) {
  return (
    <ul className="sf6-tree">
      {vault.children(dir).map((e) =>
        e.type === "dir" ? (
          <li key={e.path}>
            <details open={current === e.path || current.startsWith(`${e.path}/`) || undefined}>
              <summary>
                <a href={routeHref(e.path)} aria-current={current === e.path ? "page" : undefined}>
                  {basename(e.path)}
                </a>
              </summary>
              <Tree vault={vault} dir={e.path} current={current} />
            </details>
          </li>
        ) : (
          <li key={e.path}>
            <a href={routeHref(e.path)} aria-current={current === e.path ? "page" : undefined} data-kind={kindOf(e.path)} data-label={KIND_LABEL[kindOf(e.path)]} title={basename(e.path)}>
              {title(e.path)}
            </a>
          </li>
        ),
      )}
    </ul>
  );
}

// ------------------------------------------------------------------ viewer

export function Viewer({ ctx, path, anchor, repoName }: { ctx: ReaderContext; path: string; anchor: string | null; repoName: string }) {
  const isDir = ctx.vault.dirs.has(path);
  const entry = ctx.vault.files.get(path);

  return (
    <section className="sf6-main" aria-live="polite">
      <Crumbs path={path} repoName={repoName} />
      {isDir ? (
        <DirView ctx={ctx} dir={path} />
      ) : entry ? (
        <FileView key={path} ctx={ctx} entry={entry} anchor={anchor} />
      ) : (
        <div className="sf6-file">
          <p className="kicker">404 · Signal perdu</p>
          <h1>Introuvable</h1>
          <p>Ce chemin n&apos;existe pas, ou plus, dans le dépôt.</p>
          <a className="ext" href="#/">
            Retour à la racine
          </a>
        </div>
      )}
    </section>
  );
}

function Crumbs({ path, repoName }: { path: string; repoName: string }) {
  const parts = path ? path.split("/") : [];
  return (
    <nav className="sf6-crumbs" aria-label="Fil d'Ariane">
      <a href="#/" aria-current={parts.length ? undefined : "page"}>
        {repoName}
      </a>
      {parts.map((seg, i) => {
        const p = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={p}>
            <span aria-hidden="true"> / </span>
            {last ? <span aria-current="page">{title(seg)}</span> : <a href={routeHref(p)}>{seg}</a>}
          </span>
        );
      })}
    </nav>
  );
}

function DirView({ ctx, dir }: { ctx: ReaderContext; dir: string }) {
  const kids = ctx.vault.children(dir);
  const intro = ctx.vault.folderNote(dir);
  const files = kids.filter((k) => k.type === "file").length;
  return (
    <div className="sf6-file">
      <header className="sf6-head">
        <p className="kicker">
          Dossier · {kids.length - files} dossier{kids.length - files > 1 ? "s" : ""} · {files} fichier{files > 1 ? "s" : ""}
        </p>
        <h1>{dir ? basename(dir) : "Racine"}</h1>
      </header>
      <ul className="sf6-list">
        {dir && (
          <li>
            <span className="sf6-kind">↑</span>
            <a href={routeHref(dirname(dir))}>Dossier parent</a>
            <span />
          </li>
        )}
        {kids.map((e: Entry) => (
          <li key={e.path}>
            <span className="sf6-kind">{e.type === "dir" ? "Dossier" : KIND_LABEL[kindOf(e.path)]}</span>
            <a href={routeHref(e.path)}>{e.type === "dir" ? `${basename(e.path)}/` : title(e.path)}</a>
            <span className="num">{e.type === "file" ? formatSize(e.size) : ""}</span>
          </li>
        ))}
        {kids.length === 0 && <li className="sf6-empty">Dossier vide.</li>}
      </ul>
      {intro && (
        <div className="sf6-readme">
          <p className="kicker">{basename(intro)}</p>
          <Note ctx={ctx} path={intro} anchor={null} />
        </div>
      )}
    </div>
  );
}

function FileView({ ctx, entry, anchor }: { ctx: ReaderContext; entry: Entry; anchor: string | null }) {
  const kind = kindOf(entry.path);
  // Captured once: a refreshed token must not reload a video that is playing.
  const [src] = useState(() => ctx.gateway.mediaUrl(entry.path, ctx.token));
  const name = title(entry.path);

  return (
    <article className="sf6-file">
      <header className="sf6-head">
        <p className="kicker">
          {KIND_LABEL[kind]} · <span className="num">{formatSize(entry.size)}</span>
        </p>
        <h1>{name}</h1>
        {kind !== "markdown" && (
          <a className="ext" href={src} target="_blank" rel="noopener noreferrer">
            Ouvrir l&apos;original<span aria-hidden="true"> ↗</span>
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        )}
      </header>

      {(kind === "markdown" || kind === "excalidraw") && <Note ctx={ctx} path={entry.path} anchor={anchor} />}
      {kind === "image" && (
        <figure className="sf6-media">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed URL from the gateway, not a static asset */}
          <img src={src} alt={name} decoding="async" />
        </figure>
      )}
      {kind === "video" && (
        <figure className="sf6-media">
          <video src={src} controls preload="metadata" playsInline />
        </figure>
      )}
      {kind === "audio" && <audio className="sf6-audio" src={src} controls preload="metadata" />}
      {kind === "pdf" && <iframe className="sf6-pdf" src={src} title={name} />}
      {kind === "text" && <TextFile ctx={ctx} entry={entry} />}
      {kind === "other" && <p className="note">Aperçu indisponible pour ce type de fichier.</p>}
    </article>
  );
}

type Load<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: T };

function TextFile({ ctx, entry }: { ctx: ReaderContext; entry: Entry }) {
  const tooBig = (entry.size ?? 0) > 1_000_000;
  const [state, setState] = useState<Load<string>>({ status: "loading" });
  useEffect(() => {
    if (tooBig) return;
    let live = true;
    ctx.gateway.text(entry.path, ctx.commit).then(
      (value) => live && setState({ status: "ready", value }),
      (e: Error) => live && setState({ status: "error", message: e.message }),
    );
    return () => {
      live = false;
    };
  }, [ctx.gateway, ctx.commit, entry.path, tooBig]);
  if (tooBig) return <p className="note">Fichier trop volumineux pour un aperçu : ouvre l&apos;original.</p>;
  if (state.status === "loading") return <p className="sf6-loading">Lecture</p>;
  if (state.status === "error") return <p className="sf6-error">{state.message}</p>;
  return <pre className="sf6-text">{state.value}</pre>;
}

// A note, or an Excalidraw drawing saved as a note (null when its scene cannot be read).
type NoteState = { html: string; headings: Heading[]; tags: string[] } | { scene: Scene | null };

function Note({ ctx, path, anchor }: { ctx: ReaderContext; path: string; anchor: string | null }) {
  const [state, setState] = useState<Load<NoteState>>({ status: "loading" });
  const { gateway, vault, commit, token } = ctx;

  useEffect(() => {
    let live = true;
    gateway.text(path, commit).then(
      // Rendered with the token of the moment and kept: re-rendering on refresh would reload media.
      (text) =>
        live &&
        setState({
          status: "ready",
          value: isDrawing(path, text) ? { scene: parseDrawing(text) } : renderMarkdown(text, { from: path, vault, media: (p) => gateway.mediaUrl(p, token), title: title(path) }),
        }),
      (e: Error) => live && setState({ status: "error", message: e.message }),
    );
    return () => {
      live = false;
    };
    // token deliberately left out: see above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, vault, commit, path]);

  useEffect(() => {
    if (state.status !== "ready" || !anchor) return;
    const go = () => document.getElementById(anchor)?.scrollIntoView({ block: "start" });
    go();
    // images above the heading may still change the layout: settle once more
    const late = window.setTimeout(go, 400);
    return () => window.clearTimeout(late);
  }, [state.status, anchor]);

  if (state.status === "loading") return <p className="sf6-loading">Lecture de la note</p>;
  if (state.status === "error") return <p className="sf6-error">{state.message}</p>;
  if ("scene" in state.value) {
    if (state.value.scene) return <Drawing ctx={ctx} path={path} scene={state.value.scene} />;
    return <p className="note">Ce dessin Excalidraw n&apos;a pas pu être lu : ouvre l&apos;original.</p>;
  }
  const { html, headings, tags } = state.value;
  const toc = headings.filter((h) => h.level <= 3);

  return (
    <>
      {tags.length > 0 && (
        <ul className="tags sf6-tags" aria-label="Tags">
          {tags.map((t) => (
            <li key={t}>#{t}</li>
          ))}
        </ul>
      )}
      {toc.length >= 3 && (
        <details className="sf6-toc">
          <summary>Sommaire</summary>
          <ol>
            {toc.map((h) => (
              <li key={h.id} data-level={h.level}>
                <a href={routeHref(path, h.id)}>{h.text}</a>
              </li>
            ))}
          </ol>
        </details>
      )}
      {/* Safe by construction: renderMarkdown escapes all text and emits only its own tags. */}
      <div className="sf6-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
