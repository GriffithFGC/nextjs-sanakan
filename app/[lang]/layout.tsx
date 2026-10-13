import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "../fonts";
import { getDictionary, hasLocale, locales } from "./dictionaries";
import "../globals.css";

const SITE = "https://leoazzopardi.org";

export const dynamicParams = false;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}/`,
      languages: { fr: "/fr/", en: "/en/", "x-default": "/fr/" },
    },
    openGraph: {
      type: "website",
      url: `/${lang}/`,
      title: dict.meta.title,
      description: dict.meta.description,
      locale: lang === "fr" ? "fr_FR" : "en_US",
      siteName: "Léo Azzopardi",
    },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
