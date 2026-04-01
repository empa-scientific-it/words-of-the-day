import type { APIRoute } from "astro";
import { db, Words } from "astro:db";

export const prerender = false;

export const GET: APIRoute = async () => {
  const words = await db.select().from(Words);
  return new Response(JSON.stringify(words, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
};
