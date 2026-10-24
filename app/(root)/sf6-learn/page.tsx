import type { Metadata } from "next";
import { MotionToggle } from "@/components/MotionToggle";
import { Sf6Learn } from "@/components/sf6/Sf6Learn";

// /sf6-learn/: my Street Fighter 6 notes, read live from the sf6-learn repository on my
// Forgejo through sf6-gateway. The page itself is static and public; the content is not.
export const metadata: Metadata = {
  title: "sf6-learn · Léo Azzopardi",
  description: "Carnet d'entraînement Street Fighter 6 — accès sur clé.",
  alternates: { canonical: "/sf6-learn/" },
  robots: { index: false, follow: false },
  // Media URLs carry a signed token: never leak them through Referer.
  referrer: "no-referrer",
};

export default function Sf6LearnPage() {
  return (
    <div className="sf6">
      <a className="skip" href="#content">
        Aller au contenu
      </a>
      <header className="site-nav">
        <a className="mark" href="/fr/">
          Léo Azzopardi<span>.</span>
        </a>
        <div className="tools">
          <a className="sf6-back" href="/fr/#offline">
            <span aria-hidden="true">← </span>Portfolio
          </a>
          <MotionToggle label="Mettre les animations en pause" />
        </div>
      </header>
      <main id="content">
        <Sf6Learn />
      </main>
    </div>
  );
}
