import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { Octokit } from "octokit";
import { languages, type LanguageKey } from "../config";

const REPO_OWNER = "edoardob90";
const REPO_NAME = "words-of-the-day";
const BASE_BRANCH = "main";

const languageKeys = Object.keys(languages) as LanguageKey[];

const langFields = Object.fromEntries(
  languageKeys.map((k) => [k, z.string().optional()]),
);

function slugify(word: string): string {
  return word
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildMarkdown(input: Record<string, unknown>): string {
  const word = input.word as string;
  const slug = slugify(word);
  const lines: string[] = ["---"];

  lines.push(`word: ${word}`);
  lines.push(`slug: ${slug}`);
  if (input.meaning) lines.push(`meaning: ${JSON.stringify(input.meaning)}`);
  if (input.partOfSpeech) {
    lines.push("partOfSpeech:");
    lines.push(`  - ${input.partOfSpeech}`);
  }

  const langs = languageKeys.filter((k) => input[k]);
  if (langs.length > 0) {
    lines.push("languages:");
    for (const k of langs) {
      lines.push(`  ${k}: ${input[k]}`);
    }
  }

  lines.push(`favourite: ${input.favourite ?? false}`);
  lines.push(`created: ${new Date().toISOString().split("T")[0]}`);
  lines.push(`isComplete: ${langs.length === languageKeys.length}`);
  lines.push("---");

  return lines.join("\n") + "\n";
}

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
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GITHUB_TOKEN not configured",
        });
      }

      const octokit = new Octokit({ auth: token });
      const slug = slugify(input.word);
      const branch = `word/${slug}`;
      const filePath = `src/content/words/${slug}.md`;
      const content = buildMarkdown(input);

      try {
        // Get the SHA of the base branch HEAD
        const { data: ref } = await octokit.rest.git.getRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `heads/${BASE_BRANCH}`,
        });

        // Create a new branch
        await octokit.rest.git.createRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `refs/heads/${branch}`,
          sha: ref.object.sha,
        });

        // Create the file on the new branch
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: filePath,
          message: `Add word: ${input.word}`,
          content: Buffer.from(content).toString("base64"),
          branch,
        });

        // Open a PR
        const { data: pr } = await octokit.rest.pulls.create({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          title: `New word: ${input.word}`,
          head: branch,
          base: BASE_BRANCH,
          body: `Submitted via the website.\n\n**Word:** ${input.word}\n**Meaning:** ${input.meaning}`,
        });

        return { success: true, prUrl: pr.html_url };
      } catch (err) {
        console.error("[submit] GitHub API error:", err);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create pull request. Please try again.",
        });
      }
    },
  }),
};
