import type { Locale } from "../locales";
import type { Dictionary } from "./types";

export { hasLocale, locales, type Locale } from "../locales";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("./fr").then((m) => m.default),
  en: () => import("./en").then((m) => m.default),
  zh: () => import("./zh").then((m) => m.default),
  ja: () => import("./ja").then((m) => m.default),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
