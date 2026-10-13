// The site's languages, in menu order. `hreflang` and `htmlLang` follow BCP 47.
export const LOCALES = {
  fr: { label: "FR", name: "Français", htmlLang: "fr", hreflang: "fr", og: "fr_FR" },
  en: { label: "EN", name: "English", htmlLang: "en", hreflang: "en", og: "en_US" },
  zh: { label: "中文", name: "简体中文", htmlLang: "zh-Hans", hreflang: "zh-Hans", og: "zh_CN" },
  ja: { label: "日本語", name: "日本語", htmlLang: "ja", hreflang: "ja", og: "ja_JP" },
} as const;

export type Locale = keyof typeof LOCALES;
export const locales = Object.keys(LOCALES) as Locale[];
export const hasLocale = (locale: string): locale is Locale => locale in LOCALES;
