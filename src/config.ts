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
