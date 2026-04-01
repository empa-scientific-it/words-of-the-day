import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { db, Words, eq } from "astro:db";
import {
  submitInputSchema,
  updateInputSchema,
  languageKeys,
  type SubmitInput,
  type UpdateInput,
} from "../schema";

function slugify(word: string): string {
  return word
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildLangs(input: Record<string, unknown>): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const k of languageKeys) {
    const val = input[k as string] as string | undefined;
    if (val) langs[k] = val;
  }
  return langs;
}

export const server = {
  submit: defineAction({
    accept: "form",
    input: submitInputSchema,
    handler: async (input: SubmitInput) => {
      const slug = slugify(input.word);
      const now = new Date();
      const langs = buildLangs(input);

      const row = {
        slug,
        word: input.word,
        meaning: input.meaning ?? null,
        partOfSpeech: input.partOfSpeech ? [input.partOfSpeech] : [],
        origin: input.origin ?? null,
        languages: langs,
        favourite: input.favourite ?? false,
        created: now,
        featured: now,
        isComplete: Object.keys(langs).length === languageKeys.length,
        relatedWords: [] as string[],
        body: input.body?.trim() || null,
      };

      try {
        await db.insert(Words).values(row);
        return { success: true, slug };
      } catch (err) {
        console.error("[submit] DB insert error:", err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save word. It may already exist.",
        });
      }
    },
  }),

  update: defineAction({
    accept: "form",
    input: updateInputSchema,
    handler: async (input: UpdateInput) => {
      const langs = buildLangs(input);

      try {
        await db
          .update(Words)
          .set({
            word: input.word,
            meaning: input.meaning ?? null,
            partOfSpeech: input.partOfSpeech ? [input.partOfSpeech] : [],
            origin: input.origin ?? null,
            languages: langs,
            favourite: input.favourite ?? false,
            isComplete: Object.keys(langs).length === languageKeys.length,
            body: input.body?.trim() || null,
          })
          .where(eq(Words.slug, input.slug));

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
    handler: async ({ slug }) => {
      try {
        await db.delete(Words).where(eq(Words.slug, slug));
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
