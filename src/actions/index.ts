import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { db, Words, eq } from "astro:db";
import {
  submitInputSchema,
  updateInputSchema,
  languageKeys,
  type LangEntry,
  type SubmitInput,
  type UpdateInput,
} from "../schema";

function slugify(word: string): string {
  return word
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildLangs(
  input: SubmitInput | UpdateInput,
): Record<string, LangEntry> {
  const langs: Record<string, LangEntry> = {};
  for (const k of languageKeys) {
    const word = input[`${k}_word`];
    if (word) {
      const entry: LangEntry = { word };
      const gender = input[`${k}_gender`];
      const transliteration = input[`${k}_transliteration`];
      if (gender) entry.gender = gender;
      if (transliteration) entry.transliteration = transliteration;
      langs[k] = entry;
    }
  }
  return langs;
}

export const server = {
  submit: defineAction({
    accept: "form",
    input: submitInputSchema,
    handler: async (input, context) => {
      const slug = slugify(input.word);
      const now = new Date();
      const langs = buildLangs(input);
      const featured = input.featured ? new Date(input.featured) : now;

      const row = {
        slug,
        word: input.word,
        meaning: input.meaning ?? null,
        partOfSpeech: input.partOfSpeech,
        origin: input.origin ?? null,
        languages: langs,
        favourite: input.favourite ?? false,
        created: now,
        featured,
        isComplete:
          Object.keys(langs).length === languageKeys.length && !!input.meaning,
        relatedWords: input.relatedWords ?? [],
        body: input.body?.trim() || null,
      };

      try {
        await db.insert(Words).values(row);
        await context.cache.invalidate({ tags: ["words"] });
        return { success: true, slug };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[submit] DB insert error:", msg, err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save word: ${msg}`,
        });
      }
    },
  }),

  update: defineAction({
    accept: "form",
    input: updateInputSchema,
    handler: async (input, context) => {
      const langs = buildLangs(input);

      try {
        await db
          .update(Words)
          .set({
            word: input.word,
            meaning: input.meaning ?? null,
            partOfSpeech: input.partOfSpeech,
            origin: input.origin ?? null,
            languages: langs,
            favourite: input.favourite ?? false,
            isComplete:
              Object.keys(langs).length === languageKeys.length &&
              !!input.meaning,
            relatedWords: input.relatedWords ?? [],
            body: input.body?.trim() || null,
            ...(input.featured ? { featured: new Date(input.featured) } : {}),
          })
          .where(eq(Words.slug, input.slug));

        await context.cache.invalidate({ tags: ["words"] });
        return { success: true, slug: input.slug };
      } catch (err) {
        console.error("[update] DB update error:", err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update word.",
        });
      }
    },
  }),

  remove: defineAction({
    accept: "form",
    input: z.object({ slug: z.string().min(1) }),
    handler: async ({ slug }, context) => {
      try {
        await db.delete(Words).where(eq(Words.slug, slug));
        await context.cache.invalidate({ tags: ["words"] });
        return { success: true };
      } catch (err) {
        console.error("[remove] DB delete error:", err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete word.",
        });
      }
    },
  }),
};
