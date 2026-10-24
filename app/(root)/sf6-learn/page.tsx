import type { Metadata } from "next";
import Link from "next/link";
import { monoItalic } from "@/app/fonts";
import { MotionToggle } from "@/components/MotionToggle";
import { Sf6Learn } from "@/components/sf6/Sf6Learn";
import { ThemeToggle } from "@/components/sf6/ThemeToggle";

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
    <div className={`sf6 ${monoItalic.variable}`}>
      <a className="skip" href="#content">
        Aller au contenu
      </a>
      <header className="site-nav">
        <Link className="mark" href="/fr/">
          Léo Azzopardi<span>.</span>
        </Link>
        <div className="tools">
          <Link className="sf6-back" href="/fr/#offline">
            <span aria-hidden="true">← </span>
            <span className="sf6-back-label">Portfolio</span>
          </Link>
          <ThemeToggle />
          <MotionToggle label="Mettre les animations en pause" />
        </div>
      </header>
      <main id="content">
        <Sf6Learn />
      </main>
    </div>
  );
}
