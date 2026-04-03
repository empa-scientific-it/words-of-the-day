/**
 * Backfill the `modified` column with the `created` date for all existing words.
 *
 * Usage: npx astro db execute scripts/backfill-modified.ts --remote
 */
import { db, Words, eq } from "astro:db";

export default async function () {
  const allWords = await db.select().from(Words);
  let updated = 0;

  for (const row of allWords) {
    if (!row.modified) {
      await db
        .update(Words)
        .set({ modified: row.created })
        .where(eq(Words.slug, row.slug));
      updated++;
    }
  }

  console.log(
    `[backfill-modified] Updated ${updated}/${allWords.length} words.`,
  );
}
