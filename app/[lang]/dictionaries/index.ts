import type { Dictionary } from "./types";

const dictionaries = {
  fr: () => import("./fr").then((m) => m.default),
  en: () => import("./en").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;
export const locales = Object.keys(dictionaries) as Locale[];

export const hasLocale = (locale: string): locale is Locale => locale in dictionaries;

export const getDictionary = async (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
