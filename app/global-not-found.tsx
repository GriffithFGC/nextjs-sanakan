import type { Metadata } from "next";
import Link from "next/link";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 · Léo Azzopardi",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        <main className="picker">
          <p className="strata">404</p>
          <h1>Signal perdu · Signal lost</h1>
          <p>
            <Link href="/fr/" hrefLang="fr" lang="fr">
              Retour à l&apos;accueil
            </Link>
            {" · "}
            <Link href="/en/" hrefLang="en" lang="en">
              Back to the home page
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
