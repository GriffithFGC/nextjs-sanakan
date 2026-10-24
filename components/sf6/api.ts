// Talks to sf6-gateway (see /sf6-gateway in this repository). The site is static, so the
// visitor's browser holds the access key and the gateway checks it on every request.

import type { Entry } from "./files";
import { encodePath } from "./files";

/**
 * Public address of the gateway: `tailscale serve` (tailnet visitors) or `tailscale funnel`
 * (anyone with a key). Not a secret. Override at build time with NEXT_PUBLIC_SF6_GATEWAY.
 */
export const GATEWAY_URL = (process.env.NEXT_PUBLIC_SF6_GATEWAY || "https://sanakan.your-tailnet.ts.net").replace(/\/+$/, "");

export type Session = {
  key: { id: string; label: string | null; expires: string | null };
  repo: { name: string; fullName: string; description: string; ref: string; commit: string; updated: string | null };
  media: { token: string; expires: number };
};
export type Index = { commit: string; updated: string | null; entries: Entry[] };

export type FailureKind = "unauthorized" | "throttled" | "network" | "upstream" | "not_found";

export class GatewayError extends Error {
  constructor(
    readonly kind: FailureKind,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export class Gateway {
  private textCache = new Map<string, Promise<string>>();

  constructor(
    readonly base: string,
    private readonly key: string,
  ) {}

  private async get(path: string): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(this.base + path, { headers: { Authorization: `Bearer ${this.key}` }, cache: "no-store", referrerPolicy: "no-referrer" });
    } catch {
      throw new GatewayError("network", "La passerelle est injoignable.");
    }
    if (res.ok) return res;
    let message = `Erreur ${res.status}`;
    try {
      message = ((await res.json()) as { message?: string }).message ?? message;
    } catch {}
    if (res.status === 401) throw new GatewayError("unauthorized", message);
    if (res.status === 429) throw new GatewayError("throttled", message, Number(res.headers.get("Retry-After")) || undefined);
    if (res.status === 404) throw new GatewayError("not_found", message);
    throw new GatewayError("upstream", message);
  }

  async session(): Promise<Session> {
    return (await this.get("/v1/session")).json();
  }

  async index(): Promise<Index> {
    return (await this.get("/v1/index")).json();
  }

  /** Text of a note, cached for the visit (the index pins a commit, so it cannot change under us). */
  text(path: string, commit: string): Promise<string> {
    const k = `${commit}:${path}`;
    let p = this.textCache.get(k);
    if (!p) {
      p = this.get(`/v1/files/${encodePath(path)}`).then((r) => r.text());
      p.catch(() => this.textCache.delete(k));
      this.textCache.set(k, p);
    }
    return p;
  }

  /** URL for <img>/<video>/<audio>/<iframe>, which cannot send headers: signed and short-lived. */
  mediaUrl(path: string, token: string): string {
    return `${this.base}/v1/files/${encodePath(path)}?t=${encodeURIComponent(token)}`;
  }
}

// ---- where the key lives: this tab only, or this device when the visitor asks for it

const SLOT = "sf6-learn:key";

export const keyStore = {
  read(): { key: string; remembered: boolean } | null {
    try {
      const s = sessionStorage.getItem(SLOT);
      if (s) return { key: s, remembered: false };
      const l = localStorage.getItem(SLOT);
      if (l) return { key: l, remembered: true };
    } catch {}
    return null;
  },
  write(key: string, remember: boolean) {
    this.clear();
    try {
      (remember ? localStorage : sessionStorage).setItem(SLOT, key);
    } catch {}
  },
  clear() {
    try {
      sessionStorage.removeItem(SLOT);
      localStorage.removeItem(SLOT);
    } catch {}
  },
};
