import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { languages, type LanguageKey } from "../config";

const languageKeys = Object.keys(languages) as LanguageKey[];

const langFields = Object.fromEntries(
  languageKeys.map((k) => [k, z.string().optional()]),
);

export const server = {
  submit: defineAction({
    accept: "form",
    input: z.object({
      word: z.string().min(1),
      meaning: z.string().min(1),
      partOfSpeech: z
        .enum(["Noun", "Verb", "Adjective", "Adverb", "Preposition"])
        .optional(),
      favourite: z.boolean().optional(),
      ...langFields,
    }),
    handler: async (input) => {
      const body = new URLSearchParams();
      body.set("form-name", "word-submission");
      for (const [key, value] of Object.entries(input)) {
        if (value != null && value !== "") body.set(key, String(value));
      }

      // In production on Netlify, POST to own origin to trigger form detection.
      // In dev, skip the Netlify POST and just log.
      if (import.meta.env.PROD) {
        const res = await fetch(
          new URL("/submit", import.meta.env.SITE ?? "http://localhost"),
          {
            method: "POST",
            body,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );
        if (!res.ok) throw new Error(`Netlify Forms error: ${res.status}`);
      } else {
        console.log("[dev] Form submission:", Object.fromEntries(body));
      }

      return { success: true };
    },
  }),
};
