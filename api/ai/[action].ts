import { GoogleGenAI } from "@google/genai";

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

async function callGeminiWithFallback(ai: GoogleGenAI, prompt: string, config?: any) {
  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest"
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini models failed to respond");
}

export default async function handler(req: any, res: any) {
  // CORS configuration
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
      error: "GEMINI_API_KEY environment variable is not configured in Vercel. In Vercel, go to Settings -> Environment Variables, add GEMINI_API_KEY with your key value, and redeploy.",
      fallbackNeeded: true,
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const urlPath = req.url || "";
  const action = req.query?.action || req.body?.action || (urlPath.includes("/test") ? "test" : urlPath.includes("/braindump") ? "braindump" : urlPath.includes("/chat-edit") ? "chat-edit" : "breakdown");

  try {
    if (action === "test" || urlPath.includes("test")) {
      const { response, modelUsed } = await callGeminiWithFallback(
        ai,
        'Respond with JSON: {"status":"ready","message":"AI is active on Vercel"}',
        { responseMimeType: "application/json" }
      );
      return res.status(200).json({
        ok: true,
        model: modelUsed,
        result: parseGeminiJSON(response.text),
      });
    }

    if (action === "braindump" || urlPath.includes("braindump")) {
      const { text, context = "" } = req.body || {};
      const prompt = `You are Remember, an executive function and ADHD task assistant.
Extract independent actionable tasks from this brain dump text.
Output JSON: { "tasks": [ { "title": string, "category": "work"|"personal"|"health"|"errands"|"study"|"other", "estimatedMinutes": number, "subtasks": [{ "title": string, "estimatedMinutes": number }] } ] }

Brain Dump Input:
"""
${text}
"""
${context ? `User Context: "${context}"` : ""}`;

      const { response } = await callGeminiWithFallback(ai, prompt, {
        responseMimeType: "application/json",
      });
      return res.status(200).json(parseGeminiJSON(response.text));
    }

    if (action === "chat-edit" || urlPath.includes("chat-edit")) {
      const { task, instruction, context = "" } = req.body || {};
      const prompt = `You are Remember, an expert ADHD task assistant.
The user wants to modify their existing task and subtask breakdown.
Current Task:
Title: "${task?.title || ""}"
Category: "${task?.category || ""}"
${task?.notes ? `Notes: "${task.notes}"` : ""}
Current Subtasks:
${((task?.subtasks as any[]) || []).map((s: any, i: number) => `${i + 1}. "${s?.title || s}" (~${s?.estMinutes || s?.estimatedMinutes || 5} min)`).join("\n")}

User Request: "${instruction}"
${context ? `User Context: "${context}"` : ""}

DIRECTIVES:
1. Fix all typos, spelling mistakes, and grammar errors in the title, notes, and subtasks.
2. PRESERVE existing subtasks and details, applying the user's modifications directly.
3. Ensure every subtask starts with a crisp imperative verb.

Output clean JSON in this exact structure:
{
  "title": "Clean concise task title with relevant emoji",
  "category": "work" | "personal" | "health" | "errands" | "study" | "other",
  "estimatedMinutes": 20,
  "subtasks": [
    { "title": "Imperative action step 1", "estimatedMinutes": 5 },
    { "title": "Imperative action step 2", "estimatedMinutes": 5 }
  ]
}`;

      const { response } = await callGeminiWithFallback(ai, prompt, {
        responseMimeType: "application/json",
      });
      return res.status(200).json(parseGeminiJSON(response.text));
    }

    // Default: Task breakdown
    const {
      title,
      difficulty = 1,
      notes = "",
      category = "",
      context = "",
      availableCategories = [],
      existingSubtasks = [],
      currentSubtasks = [],
    } = req.body || {};
    const categoriesList = Array.isArray(availableCategories) && availableCategories.length > 0
      ? availableCategories.join(", ")
      : "work, personal, health, errands, study, other";

    const subtasksToConsider = Array.isArray(existingSubtasks) && existingSubtasks.length > 0
      ? existingSubtasks
      : Array.isArray(currentSubtasks) && currentSubtasks.length > 0
      ? currentSubtasks
      : [];

    const hasExistingSteps = subtasksToConsider.length > 0;

    const prompt = `You are Remember, an expert executive-function and ADHD task assistant.
${hasExistingSteps ? `CRITICAL DIRECTIVE: The user has ALREADY entered steps/subtasks manually or is re-applying AI to an existing task.
DO NOT discard, replace, or invent completely new unrelated steps.
Use their existing input as primary context:
1. FIX ALL SPELLING MISTAKES, TYPOS, AND GRAMMAR ERRORS in the task title, notes, and subtask steps.
2. PRESERVE the user's specific steps, meaning, and order, polishing each step to start with a clear, active imperative verb (e.g. "Open...", "Draft...", "Check...").
3. If they only provided 1 or 2 partial steps, keep their steps (polished and spell-checked) and append logical missing next steps to complete the workflow.
4. Calculate realistic time estimates for each step and total duration.
5. Polish the title with an appropriate emoji and correct any spelling mistakes in the title.

Existing User Steps:
${subtasksToConsider.map((s: any, i: number) => {
  const stepTitle = typeof s === "string" ? s : (s?.title || s?.text || s?.name || "");
  const stepMins = Number(s?.estimatedMinutes || s?.estMinutes || 5) || 5;
  return `${i + 1}. "${stepTitle}" (~${stepMins} min)`;
}).join("\n")}` : `When given a raw user task input, scaffold and break it down:
1. REWRITE & POLISH TITLE WITH A RELEVANT EMOJI (e.g. "💊 Take morning vitamins", "🧹 Declutter desk"). Fix any spelling mistakes in the title.
2. GENERATE 3-6 LOGICAL ACTIONABLE SUBTASKS starting with imperative verbs.`}

2. SELECT BEST CATEGORY from: [${categoriesList}]. ${category ? `User current category: "${category}". Keep it unless clearly wrong.` : ""}
3. REPEAT PATTERN: "none", "daily", or "weekly_on" (with repeatDays array where 0=Sun, 1=Mon... 6=Sat).

Input Task: "${title}"
${notes ? `Notes: "${notes}" (Fix any spelling mistakes in notes)` : ""}
${category ? `Category Hint: "${category}"` : ""}
${context ? `User Context: "${context}"` : ""}

Output clean JSON in this exact structure:
{
  "title": "Clean concise task title with emoji",
  "category": "work" | "personal" | "health" | "errands" | "study" | "other",
  "repeatType": "none" | "daily" | "weekly" | "weekly_on",
  "repeatDays": [1, 3, 5],
  "granularity": 1,
  "estimatedMinutes": 20,
  "subtasks": [
    { "title": "Action step 1", "estimatedMinutes": 4 },
    { "title": "Action step 2", "estimatedMinutes": 5 }
  ]
}`;

    const { response } = await callGeminiWithFallback(ai, prompt, {
      responseMimeType: "application/json",
    });

    return res.status(200).json(parseGeminiJSON(response.text));
  } catch (err: any) {
    console.error("Vercel AI Endpoint Error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Error generating content from Gemini API",
      statusText: err?.statusText,
      code: err?.status || err?.code,
    });
  }
}
