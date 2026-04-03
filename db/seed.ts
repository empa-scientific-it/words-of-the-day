import { db, Words } from "astro:db";
import fs from "node:fs";

const EXPORT_FILE = "db/exports/Words.json";
const GENDER_VALUES = new Set(["masculine", "feminine", "neuter"]);

/** Migrate old "word (note)" string to structured { word, gender?, transliteration? } */
function migrateTranslation(value: string): {
  word: string;
  gender?: string;
  transliteration?: string;
} {
  const match = value.match(/^(.+)\s+\(([^)]+)\)$/);
  if (!match) return { word: value.trim() };
  const word = match[1].trim();
  const note = match[2].trim();
  if (GENDER_VALUES.has(note)) return { word, gender: note };
  return { word, transliteration: note };
}

export default async function seed() {
  const raw = fs.readFileSync(EXPORT_FILE, "utf-8");
  const records = JSON.parse(raw) as Record<string, unknown>[];

  if (records.length === 0) {
    console.log("[seed] No records found, skipping");
    return;
  }

  const rows = records.map((r) => {
    // JSON fields are double-encoded as strings in the export
    const partOfSpeech =
      typeof r.partOfSpeech === "string"
        ? JSON.parse(r.partOfSpeech)
        : (r.partOfSpeech ?? []);

    const relatedWords =
      typeof r.relatedWords === "string"
        ? JSON.parse(r.relatedWords)
        : (r.relatedWords ?? []);

    const rawLangs =
      typeof r.languages === "string"
        ? JSON.parse(r.languages)
        : (r.languages ?? {});

    // Migrate flat strings to structured objects
    const languages: Record<
      string,
      { word: string; gender?: string; transliteration?: string }
    > = {};
    for (const [key, val] of Object.entries(rawLangs)) {
      if (typeof val === "string") {
        languages[key] = migrateTranslation(val);
      } else {
        languages[key] = val as {
          word: string;
          gender?: string;
          transliteration?: string;
        };
      }
    }

    return {
      slug: r.slug as string,
      word: r.word as string,
      meaning: (r.meaning as string) ?? null,
      partOfSpeech,
      origin: (r.origin as string) ?? null,
      languages,
      favourite: r.favourite === 1 || r.favourite === true,
      created: new Date(r.created as string),
      featured: new Date(r.featured as string),
      isComplete: r.isComplete === 1 || r.isComplete === true,
      relatedWords,
      body: (r.body as string) ?? null,
    };
  });

  await db.insert(Words).values(rows);
  console.log(`[seed] Inserted ${rows.length} words`);
}
