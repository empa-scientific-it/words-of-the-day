export const languages = {
  el: { name: "Greek", emoji: "🇬🇷" },
  de: { name: "German", emoji: "🇩🇪" },
  it: { name: "Italian", emoji: "🇮🇹" },
} as const;

export const partsOfSpeech = [
  "Noun",
  "Verb",
  "Adjective",
  "Adverb",
  "Preposition",
] as const;

export type LanguageKey = keyof typeof languages;

export const genders = ["masculine", "feminine", "neuter"] as const;

export const posStyles = {
  Noun: {
    base: "bg-blue-100 text-blue-800",
    hover: "hover:bg-blue-200",
    active: "bg-blue-700 text-white",
  },
  Verb: {
    base: "bg-green-100 text-green-800",
    hover: "hover:bg-green-200",
    active: "bg-green-700 text-white",
  },
  Adjective: {
    base: "bg-amber-100 text-amber-800",
    hover: "hover:bg-amber-200",
    active: "bg-amber-600 text-white",
  },
  Adverb: {
    base: "bg-purple-100 text-purple-800",
    hover: "hover:bg-purple-200",
    active: "bg-purple-700 text-white",
  },
  Preposition: {
    base: "bg-rose-100 text-rose-800",
    hover: "hover:bg-rose-200",
    active: "bg-rose-700 text-white",
  },
} as const;
