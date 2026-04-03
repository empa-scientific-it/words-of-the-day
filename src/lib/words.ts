import { db, Words, desc, eq, like, or, and } from "astro:db";
import { languages as langConfig, type LanguageKey } from "../config";
import type { LangEntry } from "../schema";

export function enrichLanguages(raw: Record<string, LangEntry>) {
  return Object.entries(raw)
    .filter(([key]) => key in langConfig)
    .filter(([, v]) => v != null)
    .map(([key, entry]) => ({
      lang: key as LanguageKey,
      word: entry.word,
      gender: entry.gender,
      transliteration: entry.transliteration,
      ...langConfig[key as LanguageKey],
    }));
}

export async function getWords(opts?: { q?: string; pos?: string }) {
  const conditions = [];

  if (opts?.q) {
    const pattern = `%${opts.q}%`;
    conditions.push(
      or(
        like(Words.word, pattern),
        like(Words.meaning, pattern),
        like(Words.origin, pattern),
        like(Words.body, pattern),
        like(Words.languages, pattern),
      )!,
    );
  }

  if (opts?.pos) {
    conditions.push(like(Words.partOfSpeech, `%"${opts.pos}"%`));
  }

  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  return db.select().from(Words).where(where).orderBy(desc(Words.featured));
}

export async function getWordBySlug(slug: string) {
  const rows = await db.select().from(Words).where(eq(Words.slug, slug));
  return rows[0] ?? null;
}

export async function getAllSlugs() {
  return db.select({ slug: Words.slug }).from(Words);
}

export function getPosCounts(words: { partOfSpeech: unknown }[]) {
  const counts: Record<string, number> = {};
  words.map((w) =>
    (w.partOfSpeech as string[]).map((pos) => {
      counts[pos] = (counts[pos] ?? 0) + 1;
    }),
  );
  return counts;
}
