import { Instrument_Sans, JetBrains_Mono, Marcellus, Spectral } from "next/font/google";

// Engraved capitals for titles.
export const display = Marcellus({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-display" });
// Running text, clean enough for a recruiter skimming.
export const body = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-body" });
// The personal voice: quotes and intimate passages, italic only.
export const voice = Spectral({ weight: ["300", "400"], style: "italic", subsets: ["latin", "latin-ext"], variable: "--font-voice" });
// Strata labels, tags, data.
export const mono = JetBrains_Mono({ weight: ["400", "500"], subsets: ["latin", "latin-ext"], variable: "--font-mono" });

export const fontVariables = [display.variable, body.variable, voice.variable, mono.variable].join(" ");
