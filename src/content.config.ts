import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { wordFieldsSchema, languagesSchema } from "./schema";

const words = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/words" }),
  schema: wordFieldsSchema
    .extend({
      slug: z.string(),
      languages: languagesSchema,
      created: z.coerce.date(),
      featured: z.coerce.date().optional(),
      relatedWords: z.array(z.string()).optional().default([]),
      isComplete: z.boolean().default(false),
    })
    .transform((data) => ({
      ...data,
      featured: data.featured ?? data.created,
    })),
});

export const collections = { words };
