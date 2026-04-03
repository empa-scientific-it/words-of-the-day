import { z } from "astro/zod";
import { languages, type LanguageKey, partsOfSpeech, genders } from "./config";

export const languageKeys = Object.keys(languages) as LanguageKey[];

/** Per-language structured entry as stored in DB */
export interface LangEntry {
  word: string;
  gender?: string;
  transliteration?: string;
}

/** Typed shape for per-language flat form fields (e.g. el_word, el_gender, el_transliteration) */
const genderSchema = z.enum(genders);

type LangInputShape = {
  [K in LanguageKey as `${K}_word`]: z.ZodOptional<z.ZodString>;
} & {
  [K in LanguageKey as `${K}_gender`]: z.ZodOptional<typeof genderSchema>;
} & {
  [K in LanguageKey as `${K}_transliteration`]: z.ZodOptional<z.ZodString>;
};

function buildLangInputShape(): LangInputShape {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const k of languageKeys) {
    shape[`${k}_word`] = z.string().optional();
    shape[`${k}_gender`] = genderSchema.optional();
    shape[`${k}_transliteration`] = z.string().optional();
  }
  return shape as LangInputShape;
}

/** Form submission schema — multiple POS (from checkboxes), optional body, flat language fields */
export const submitInputSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().optional(),
  partOfSpeech: z.array(z.enum(partsOfSpeech)).optional().default([]),
  favourite: z.boolean().optional(),
  origin: z.string().optional(),
  body: z.string().optional(),
  featured: z.string().optional(),
  ...buildLangInputShape(),
});

export type SubmitInput = z.infer<typeof submitInputSchema>;

/** Update schema — same fields plus slug to identify the row */
export const updateInputSchema = submitInputSchema.extend({
  slug: z.string().min(1),
});

export type UpdateInput = z.infer<typeof updateInputSchema>;
