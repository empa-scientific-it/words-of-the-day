import { db, Words, desc, eq } from "astro:db";
import { languages as langConfig, type LanguageKey } from "../config";
import { parseTranslation } from "../schema";

export function enrichLanguages(raw: Record<string, string>) {
  return Object.entries(raw)
    .filter((entry): entry is [string, string] => entry[1] != null)
    .map(([key, value]) => {
      const lang = key as LanguageKey;
      return { lang, ...parseTranslation(value), ...langConfig[lang] };
    });
}

export async function getAllWords() {
  return db.select().from(Words).orderBy(desc(Words.featured));
}

export async function getWordBySlug(slug: string) {
  const rows = await db.select().from(Words).where(eq(Words.slug, slug));
  return rows[0] ?? null;
}

export async function getAllSlugs() {
  return db.select({ slug: Words.slug }).from(Words);
}
