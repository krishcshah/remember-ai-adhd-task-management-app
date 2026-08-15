import { GoogleGenAI, Type } from "@google/genai";

function getApiKey(): string | null {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!rawKey) return null;
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned === "MY_GEMINI_API_KEY" || cleaned === "YOUR_API_KEY") {
    return null;
  }
  return cleaned;
}

function parseGeminiJSON(text: string | undefined): any {
  if (!text || typeof text !== "string") {
    throw new Error("Empty or invalid response from AI model");
  }
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    throw new Error(`Failed to parse AI response as JSON`);
  }
}

export default async function handler(req: any, res: any) {
  // Enable CORS for Vercel functions
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: "GEMINI_API_KEY is not configured in Vercel Environment Variables. Add GEMINI_API_KEY in Vercel Settings -> Environment Variables and redeploy.",
      fallbackNeeded: true,
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const action = req.query?.action || req.body?.action || "breakdown";

  try {
    if (action === "test" || req.url?.includes("/test")) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: 'Respond with JSON: {"status":"ready","message":"AI is active on Vercel"}',
        config: { responseMimeType: "application/json" },
      });
      return res.status(200).json({
        ok: true,
        model: "gemini-2.5-flash",
        result: parseGeminiJSON(response.text),
      });
    }

    if (action === "braindump" || req.url?.includes("/braindump")) {
      const { text, context = "" } = req.body || {};
      const prompt = `You are Remember, an executive function and ADHD task assistant.
Extract independent actionable tasks from this brain dump text.
Output JSON: { "tasks": [ { "title": string, "category": "work"|"personal"|"health"|"errands"|"study"|"other", "estimatedMinutes": number, "subtasks": [{ "title": string, "estimatedMinutes": number }] } ] }

Brain Dump Input:
"""
${text}
"""
${context ? `User Context: "${context}"` : ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      return res.status(200).json(parseGeminiJSON(response.text));
    }

    if (action === "chat-edit" || req.url?.includes("/chat-edit")) {
      const { task, instruction } = req.body || {};
      const prompt = `You are Remember, an ADHD task assistant.
Modify this task based on instruction: "${instruction}".
Original task: ${JSON.stringify(task)}
Output updated JSON: { "title": string, "category": string, "estimatedMinutes": number, "subtasks": [ { "title": string, "estimatedMinutes": number } ] }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      return res.status(200).json(parseGeminiJSON(response.text));
    }

    // Default: Task breakdown
    const { title, difficulty = 1, notes = "", category = "", context = "", availableCategories = [] } = req.body || {};
    const categoriesList = Array.isArray(availableCategories) && availableCategories.length > 0
      ? availableCategories.join(", ")
      : "work, personal, health, errands, study, other";

    const prompt = `You are Remember, an expert executive-function and ADHD task assistant.
When given a raw user task input, scaffold and break it down:
1. REWRITE & POLISH TITLE WITH A RELEVANT EMOJI (e.g. "💊 Take morning vitamins", "🧹 Declutter desk").
2. SELECT BEST CATEGORY from: [${categoriesList}].
3. REPEAT PATTERN: "none", "daily", or "weekly_on" (with repeatDays array where 0=Sun, 1=Mon... 6=Sat).
4. GENERATE 3-6 ACTIONABLE SUBTASKS starting with imperative verbs.

Input Task: "${title}"
${notes ? `Notes: "${notes}"` : ""}
${category ? `Category Hint: "${category}"` : ""}
${context ? `User Context: "${context}"` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    return res.status(200).json(parseGeminiJSON(response.text));
  } catch (err: any) {
    console.error("Vercel Serverless AI Error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to generate content with Gemini API",
    });
  }
}
