[![Netlify Status](https://api.netlify.com/api/v1/badges/3a9266b6-afb8-4df1-8f13-90b64a61af37/deploy-status)](https://app.netlify.com/projects/words-of-the-day/deploys)

# Words of the Day

"Words of the Day" project as a standalone app built with Astro, Astro DB (any SQLite-compatible, we're using [Turso](https://turso.tech)), and Tailwind CSS. Currently supports Greek, German, and Italian translations.

## Adding a new language

Adding a language requires changes to **one file** and optionally seeding translations:

1. **`src/config.ts`** — add your language to the `languages` object:
   ```ts
   export const languages = {
     el: { name: "Greek", emoji: "🇬🇷" },
     de: { name: "German", emoji: "🇩🇪" },
     it: { name: "Italian", emoji: "🇮🇹" },
     fr: { name: "French", emoji: "🇫🇷" },  // new
   } as const;
   ```
   That's all. The form fields, validation schema, and display components all derive from this config automatically.

2. **Add translations** — use the app's submit/edit forms. The new language fields appear automatically once the config is updated.

> **Note:** Translations are stored as JSON flat strings in a single DB column. Languages not listed in `src/config.ts` are ignored at render time, so incomplete branches won't leak into production.

Open an [issue](../../issues/new?template=new-language.yml) to propose a new language, or submit a PR directly.

## Development

```sh
npm install        # also configures the pre-commit formatting hook
npm run dev        # dev server at localhost:4321
npm run build      # production build
npm run format     # format all .ts and .astro files with Prettier
```

Requires Node >= 22.12.0. The production build uses `astro build --remote` to connect to the Turso database.

### Syncing local DB

The local dev database is seeded from `db/exports/Words.json` (git-ignored). To update it with the latest data from the remote Turso DB:

1. Export the current data from `/api/export.json` (or the Turso dashboard)
2. Save the output to `db/exports/Words.json`
3. Restart the dev server. Astro re-runs the seed script `db/seed.ts` on startup
