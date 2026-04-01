import { defineAction, ActionError } from "astro:actions";
import { Octokit } from "octokit";
import { stringify } from "yaml";
import { submitInputSchema, languageKeys, type SubmitInput } from "../schema";

const REPO_OWNER = "edoardob90";
const REPO_NAME = "words-of-the-day";
const BASE_BRANCH = "main";

function slugify(word: string): string {
  return word
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildMarkdown(input: SubmitInput): string {
  const slug = slugify(input.word);

  const frontmatter: Record<string, unknown> = {
    word: input.word,
    slug,
  };

  if (input.meaning) frontmatter.meaning = input.meaning;
  if (input.partOfSpeech) frontmatter.partOfSpeech = [input.partOfSpeech];
  if (input.origin) frontmatter.origin = input.origin;

  const langs: Record<string, string> = {};
  for (const k of languageKeys) {
    const val = input[k as keyof SubmitInput] as string | undefined;
    if (val) langs[k] = val;
  }
  if (Object.keys(langs).length > 0) frontmatter.languages = langs;

  frontmatter.favourite = input.favourite ?? false;
  frontmatter.created = new Date().toISOString().split("T")[0];
  frontmatter.isComplete = Object.keys(langs).length === languageKeys.length;

  const body = input.body?.trim() ?? "";
  return `---\n${stringify(frontmatter)}---\n\n${body}\n`;
}

export const server = {
  submit: defineAction({
    accept: "form",
    input: submitInputSchema,
    handler: async (input: SubmitInput) => {
      const slug = slugify(input.word);
      const branch = `word/${slug}`;
      const filePath = `src/content/words/${slug}.md`;
      const content = buildMarkdown(input);

      if (import.meta.env.DEV) {
        console.log("[dev] Validated input:", JSON.stringify(input, null, 2));
        console.log("[dev] Generated markdown:\n" + content);
        return {
          success: true,
          debug: { input, slug, branch, filePath, markdown: content },
        };
      }

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GITHUB_TOKEN not configured",
        });
      }

      const octokit = new Octokit({ auth: token });

      try {
        const { data: ref } = await octokit.rest.git.getRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `heads/${BASE_BRANCH}`,
        });

        await octokit.rest.git.createRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `refs/heads/${branch}`,
          sha: ref.object.sha,
        });

        await octokit.rest.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: filePath,
          message: `Add word: ${input.word}`,
          content: Buffer.from(content).toString("base64"),
          branch,
        });

        const { data: pr } = await octokit.rest.pulls.create({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          title: `New word: ${input.word}`,
          head: branch,
          base: BASE_BRANCH,
          body: `Submitted via the website.\n\n**Word:** ${input.word}\n**Meaning:** ${input.meaning ?? "—"}`,
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
