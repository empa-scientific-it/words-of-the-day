import { defineDb, defineTable, column } from "astro:db";

export const Words = defineTable({
  columns: {
    slug: column.text({ primaryKey: true }),
    word: column.text(),
    meaning: column.text({ optional: true }),
    partOfSpeech: column.json({ default: [] }),
    origin: column.text({ optional: true }),
    languages: column.json({ default: {} }),
    favourite: column.boolean({ default: false }),
    created: column.date(),
    featured: column.date(),
    isComplete: column.boolean({ default: false }),
    modified: column.date({ optional: true }),
    relatedWords: column.json({ default: [] }),
    body: column.text({ optional: true }),
  },
});

export default defineDb({ tables: { Words } });
