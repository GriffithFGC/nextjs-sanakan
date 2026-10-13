import type { Metadata } from "next";
import { fontVariables } from "../fonts";
import "../globals.css";

// `/` has no locale. A static host cannot negotiate one, so this tiny root layout
// only serves the language picker that forwards to /fr/, /en/, /zh/ or /ja/.
export const metadata: Metadata = {
  metadataBase: new URL("https://leoazzopardi.org"),
  title: "Léo Azzopardi",
  alternates: { canonical: "/fr/", languages: { fr: "/fr/", en: "/en/", "zh-Hans": "/zh/", ja: "/ja/", "x-default": "/fr/" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
