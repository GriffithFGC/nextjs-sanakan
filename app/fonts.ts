import { Instrument_Sans, JetBrains_Mono, Marcellus, Spectral } from "next/font/google";

// `subsets` only picks what gets preloaded: Latin covers French and English, while the
// latin-ext faces stay declared (unicode-range) and download only if a page needs them.

// Engraved capitals for titles.
export const display = Marcellus({ weight: "400", subsets: ["latin"], variable: "--font-display" });
// Running text, clean enough for a recruiter skimming.
export const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
// The personal voice: quotes and intimate passages, italic only.
export const voice = Spectral({ weight: ["300", "400"], style: "italic", subsets: ["latin"], variable: "--font-voice" });
// Strata labels, tags, data. Variable: one file covers every weight, bold included.
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
// /sf6-learn is set entirely in the mono, like my desktop; its italics only load there.
export const monoItalic = JetBrains_Mono({ style: "italic", subsets: ["latin"], variable: "--font-mono-italic", preload: false });

export const fontVariables = [display.variable, body.variable, voice.variable, mono.variable].join(" ");
