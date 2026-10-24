"use client";

import { type FormEvent, useState } from "react";
import { DescentBand } from "../descent/DescentBand";

// The way in: deeper than the portfolio's last band (−1 200 m), the training room.
export function KeyGate({ error, checking, onUnlock }: { error?: string; checking?: boolean; onUnlock: (key: string, remember: boolean) => Promise<void> }) {
  const [key, setKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    await onUnlock(key.trim(), remember);
    setBusy(false);
  }

  const waiting = busy || checking;

  return (
    <section className="sf6-gate" aria-labelledby="sf6-title">
      <DescentBand scene="forest" depth="−1 600 m" name="Salle d'entraînement" />
      <div className="sf6-gate-inner">
        <p className="strata">Accès restreint · Street Fighter 6</p>
        <h1 id="sf6-title">sf6-learn</h1>
        <p className="quote">Le carnet d&apos;entraînement : frame data, combos, matchups, replays annotés.</p>

        <form className="sf6-key" onSubmit={submit} aria-busy={waiting || undefined}>
          <label htmlFor="sf6-key-input" className="kicker">
            Clé d&apos;accès
          </label>
          <div className="sf6-key-row">
            <input
              id="sf6-key-input"
              type={visible ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sf6_…"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
              disabled={checking}
              aria-describedby={error ? "sf6-key-error" : undefined}
              aria-invalid={error ? true : undefined}
            />
            <button type="button" className="sf6-ghost" onClick={() => setVisible(!visible)} aria-pressed={visible}>
              {visible ? "Masquer" : "Afficher"}
            </button>
          </div>
          <label className="sf6-check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Se souvenir de la clé sur cet appareil
          </label>
          {error && (
            <p id="sf6-key-error" className="sf6-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn solid" disabled={waiting}>
            {checking ? "Vérification de la clé enregistrée…" : busy ? "Vérification…" : "Déverrouiller"}
          </button>
        </form>

        <p className="note">
          Les clés sont distribuées à la main. Pas de clé ? <a href="/fr/#contact">Demande-la</a>.
        </p>
      </div>
    </section>
  );
}
