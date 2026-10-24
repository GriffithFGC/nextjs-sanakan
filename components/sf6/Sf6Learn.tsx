"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { GATEWAY_URL, Gateway, GatewayError, type Index, type Session, keyStore } from "./api";
import { Vault, parseRoute } from "./files";
import { KeyGate } from "./KeyGate";
import { Explorer, Viewer } from "./Reader";

type Open = { gateway: Gateway; session: Session; index: Index; vault: Vault };
type State = { phase: "boot" } | { phase: "locked"; error?: string } | ({ phase: "ready" } & Open);

function explain(e: unknown): string {
  if (!(e instanceof GatewayError)) return "Quelque chose s'est mal passé. Réessaie.";
  switch (e.kind) {
    case "unauthorized":
      return "Clé refusée : elle est invalide, expirée ou révoquée.";
    case "throttled":
      return `Trop d'essais. Réessaie dans ${Math.max(1, Math.ceil((e.retryAfter ?? 600) / 60))} min.`;
    case "network":
      return "La passerelle ne répond pas : la machine qui héberge les ressources est peut-être éteinte.";
    default:
      return e.message;
  }
}

/** Checks a key against the gateway and loads the repository listing. Never touches state. */
async function open(key: string, remember: boolean): Promise<State> {
  try {
    const gateway = new Gateway(GATEWAY_URL, key);
    const [session, index] = await Promise.all([gateway.session(), gateway.index()]);
    keyStore.write(key, remember);
    return { phase: "ready", gateway, session, index, vault: new Vault(index.entries) };
  } catch (e) {
    if (e instanceof GatewayError && e.kind === "unauthorized") keyStore.clear();
    return { phase: "locked", error: explain(e) };
  }
}

const onHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function Sf6Learn() {
  const [state, setState] = useState<State>({ phase: "boot" });
  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => "");
  const route = parseRoute(hash);

  // A key kept from an earlier visit opens the door by itself.
  useEffect(() => {
    let live = true;
    const stored = keyStore.read();
    (async () => {
      const next: State = stored ? await open(stored.key, stored.remembered) : { phase: "locked" };
      if (live) setState(next);
    })();
    return () => {
      live = false;
    };
  }, []);

  // Media links are signed for a few hours: renew them before they lapse.
  const ready = state.phase === "ready" ? state : null;
  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(30_000, ready.session.media.expires * 1000 - Date.now() - 10 * 60_000);
    const timer = window.setTimeout(() => {
      ready.gateway.session().then(
        (session) => setState((s) => (s.phase === "ready" ? { ...s, session } : s)),
        (e) => {
          if (e instanceof GatewayError && e.kind === "unauthorized") {
            keyStore.clear();
            setState({ phase: "locked", error: "Ta clé a été révoquée ou a expiré." });
          }
        },
      );
    }, wait);
    return () => window.clearTimeout(timer);
  }, [ready]);

  // A new page starts at the top, unless the link points at a heading.
  useEffect(() => {
    if (!route.anchor) window.scrollTo({ top: 0 });
  }, [route.path, route.anchor]);

  if (state.phase !== "ready") {
    return (
      <KeyGate
        checking={state.phase === "boot"}
        error={state.phase === "locked" ? state.error : undefined}
        onUnlock={async (key, remember) => setState(await open(key, remember))}
      />
    );
  }

  const ctx = { gateway: state.gateway, vault: state.vault, commit: state.index.commit, token: state.session.media.token };
  const lock = () => {
    keyStore.clear();
    window.location.hash = "";
    setState({ phase: "locked" });
  };

  return (
    <div className="sf6-app">
      <Explorer vault={state.vault} current={route.path} session={state.session} onLock={lock} />
      <Viewer ctx={ctx} path={route.path} anchor={route.anchor} repoName={state.session.repo.name} />
    </div>
  );
}
