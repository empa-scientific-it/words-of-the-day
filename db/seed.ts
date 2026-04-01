import { db, Words } from "astro:db";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const WORDS_DIR = "src/content/words";

export default async function seed() {
  const files = fs.readdirSync(WORDS_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.log("[seed] No markdown files found, skipping");
    return;
  }

  const rows = files.map((file) => {
    const raw = fs.readFileSync(path.join(WORDS_DIR, file), "utf-8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) throw new Error(`Bad frontmatter in ${file}`);

    const fm = parse(match[1]);
    const body = match[2].trim() || null;
    const created = new Date(fm.created);

    return {
      slug: fm.slug as string,
      word: fm.word as string,
      meaning: (fm.meaning as string) ?? null,
      partOfSpeech: (fm.partOfSpeech as string[]) ?? [],
      origin: (fm.origin as string) ?? null,
      languages: (fm.languages as Record<string, string>) ?? {},
      favourite: (fm.favourite as boolean) ?? false,
      created,
      featured: fm.featured ? new Date(fm.featured) : created,
      isComplete: (fm.isComplete as boolean) ?? false,
      relatedWords: (fm.relatedWords as string[]) ?? [],
      body,
    };
  });

  await db.insert(Words).values(rows);
  console.log(`[seed] Inserted ${rows.length} words`);
}
