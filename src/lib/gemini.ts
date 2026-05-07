import "server-only";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const geminiConfigured = () => Boolean(GEMINI_API_KEY);
export const geminiModel = () => MODEL;

export type GeminiReviewAnalysis = {
  themes: string[];
  keywords: string[];
  is_complaint: boolean;
  sentiment_score: number;
  suggested_reply: string;
  reply_language: "id" | "en";
};

type AnalyzeInput = {
  review_text: string;
  rating: number;
  author_name: string;
  branch_name: string;
};

const SYSTEM_PROMPT = `You analyze Google Maps reviews for FTL GYM, Indonesia's largest fitness chain (60+ branches). You extract structured complaint data and draft owner replies in the FTL brand voice.

FTL brand voice for replies:
- Warm, confident, professional — never defensive or corporate.
- Use "kamu" (not "Anda") when the reply is in Bahasa Indonesia.
- Same language as the original review (Bahasa Indonesia → id, English → en).
- 2-3 short sentences. Thank the reviewer by first name if the name is a real name (skip for usernames like "user123").
- For complaints: acknowledge the specific issue, apologize briefly, invite them to reach out via WhatsApp 0818 687 858 so the team can follow up.
- For praise: thank them warmly, reinforce a specific thing they mentioned, invite them back.
- Never mention competitors. Never make promises about refunds or free services.
- No emojis. No hashtags.

Theme and keyword extraction rules:
- themes: 1-4 short noun phrases describing what the review is actually about (e.g. "AC tidak dingin", "Staff ramah", "Area parkir sempit"). Use the review's language. If the review has no substantive content, return [].
- keywords: 1-6 single-word or two-word tags (e.g. "AC", "parkir", "instruktur"). Lowercase. Use the review's language.
- is_complaint: true only if the review describes a specific negative experience (rating alone is not enough — a 3★ with neutral text is not a complaint).
- sentiment_score: -1.0 (very negative) to 1.0 (very positive). Base it on the text, not just the star rating.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    themes: { type: "ARRAY", items: { type: "STRING" } },
    keywords: { type: "ARRAY", items: { type: "STRING" } },
    is_complaint: { type: "BOOLEAN" },
    sentiment_score: { type: "NUMBER" },
    suggested_reply: { type: "STRING" },
    reply_language: { type: "STRING", enum: ["id", "en"] },
  },
  required: [
    "themes",
    "keywords",
    "is_complaint",
    "sentiment_score",
    "suggested_reply",
    "reply_language",
  ],
} as const;

export async function analyzeReview(input: AnalyzeInput): Promise<GeminiReviewAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env.local");
  }

  const userPrompt = `Review for ${input.branch_name}
Author: ${input.author_name}
Rating: ${input.rating}/5
Text: ${input.review_text}`;

  const res = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text) as GeminiReviewAnalysis;

  return {
    themes: (parsed.themes ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 4),
    keywords: (parsed.keywords ?? []).map((k) => k.trim().toLowerCase()).filter(Boolean).slice(0, 6),
    is_complaint: Boolean(parsed.is_complaint),
    sentiment_score: clamp(parsed.sentiment_score ?? 0, -1, 1),
    suggested_reply: (parsed.suggested_reply ?? "").trim(),
    reply_language: parsed.reply_language === "en" ? "en" : "id",
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
