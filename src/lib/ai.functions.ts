import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Admin access required");
}

async function callGemini(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 429) throw new Error("AI is busy right now — try again in a moment.");
    if (response.status === 402)
      throw new Error("AI credits are used up. Add credits in Lovable to keep generating.");
    throw new Error(`AI request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI returned an empty response");
  return content;
}

function extractJson(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI response was not valid product data");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

const COPY_SYSTEM = [
  "You are the senior copywriter for ALTAIRSTORE, a modern luxury watch boutique.",
  "Write refined, confident product copy in British-neutral English.",
  "Never invent certifications, brand names, warranties or prices.",
  "Never use hype words like 'amazing', 'best ever', or exclamation marks.",
  "Describe materials, dial, case, bracelet, wearability and occasion.",
].join(" ");

export const enhanceDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1),
        tagline: z.string().optional(),
        notes: z.string().optional(),
        specs: z.record(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);

    const user = [
      `Watch name: ${data.name}`,
      data.tagline ? `Tagline: ${data.tagline}` : "",
      data.specs && Object.keys(data.specs).length
        ? `Specifications: ${JSON.stringify(data.specs)}`
        : "",
      data.notes ? `Raw supplier notes (rewrite, do not copy):\n${data.notes}` : "",
      "",
      "Return exactly two paragraphs of 45-70 words each. No headings, no bullet points, no pricing.",
    ]
      .filter(Boolean)
      .join("\n");

    const description = await callGemini(COPY_SYSTEM, user);
    return { description };
  });

export const importFromLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ url: z.string().url() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);

    let html = "";
    try {
      const page = await fetch(data.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AltairStoreBot/1.0)" },
      });
      html = await page.text();
    } catch {
      throw new Error("Could not open that supplier link. Check the address and try again.");
    }

    const images = Array.from(
      new Set(
        [
          ...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi),
          ...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi),
        ]
          .map((m) => m[1])
          .filter((src): src is string => Boolean(src && src.startsWith("http")))
          .slice(0, 8),
      ),
    );

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);

    const raw = await callGemini(
      `${COPY_SYSTEM} You extract product data from a supplier page and rewrite it as original boutique copy. Reply with JSON only.`,
      [
        `Supplier page URL: ${data.url}`,
        `Page text:\n${text}`,
        "",
        "Return JSON with keys:",
        '{"name": string, "tagline": string (max 6 words), "description": string (two paragraphs, 45-70 words each, fully rewritten), "price": number (ZAR, 0 if unknown), "category": string, "specs": { "case": string, "movement": string, "glass": string, "water": string }}',
        "Do not copy supplier sentences verbatim. Do not include any other keys.",
      ].join("\n"),
    );

    const parsed = extractJson(raw);
    return {
      name: String(parsed["name"] ?? ""),
      tagline: String(parsed["tagline"] ?? ""),
      description: String(parsed["description"] ?? ""),
      price: Number(parsed["price"] ?? 0) || 0,
      category: String(parsed["category"] ?? "Watches"),
      specs: (parsed["specs"] ?? {}) as Record<string, string>,
      images,
    };
  });
