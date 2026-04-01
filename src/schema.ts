import { z } from "astro/zod";
import { languages, type LanguageKey, partsOfSpeech } from "./config";

export const languageKeys = Object.keys(languages) as [
  LanguageKey,
  ...LanguageKey[],
];

const langShape = Object.fromEntries(
  languageKeys.map((k) => [k, z.string().optional()]),
) as Record<LanguageKey, z.ZodOptional<z.ZodString>>;

/** Parses "word (note)" into { word, note } or just { word } */
export function parseTranslation(value: string) {
  const match = value.match(/^(.+)\s+\(([^)]+)\)$/);
  if (match) return { word: match[1].trim(), note: match[2].trim() };
  return { word: value.trim() };
}

/** Schema for the languages record in frontmatter — flat keys, enriched via transform */
export const languagesSchema = z
  .object(langShape)
  .optional()
  .default({})
  .transform((record) =>
    Object.entries(record)
      .filter((entry): entry is [string, string] => entry[1] != null)
      .map(([key, value]) => {
        const lang = key as LanguageKey;
        return { lang, ...parseTranslation(value), ...languages[lang] };
      }),
  );

/** Raw languages shape — flat keys, all optional strings */
export const languagesInputShape = langShape;

/** Shared fields that appear in both frontmatter and form submission */
export const wordFieldsSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().optional(),
  partOfSpeech: z.array(z.enum(partsOfSpeech)).optional().default([]),
  favourite: z.boolean().default(false),
  origin: z.string().optional(),
});

/** Form submission schema — single POS (from select), optional body, flat language fields */
export const submitInputSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().optional(),
  partOfSpeech: z.enum(partsOfSpeech).optional(),
  favourite: z.boolean().optional(),
  origin: z.string().optional(),
  body: z.string().optional(),
  ...languagesInputShape,
});

export type SubmitInput = z.infer<typeof submitInputSchema>;
