import { GoogleGenAI } from "@google/genai";

function getClientApiKey(): string | null {
  // 1. Check local storage user configured key
  if (typeof window !== "undefined") {
    const customKey = localStorage.getItem("remember_custom_gemini_key");
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  }

  // 2. Check Vite client environment variables (Vercel / Netlify / Vite builds)
  const metaEnv = (import.meta as any).env || {};
  const viteKey =
    (metaEnv.VITE_GEMINI_API_KEY as string) ||
    (metaEnv.VITE_GOOGLE_API_KEY as string) ||
    (metaEnv.VITE_API_KEY as string);

  if (viteKey && viteKey.trim() && viteKey !== "MY_GEMINI_API_KEY") {
    return viteKey.trim();
  }

  return null;
}

export function hasClientApiKey(): boolean {
  return Boolean(getClientApiKey());
}

export function setCustomClientApiKey(key: string) {
  if (typeof window !== "undefined") {
    if (!key || !key.trim()) {
      localStorage.removeItem("remember_custom_gemini_key");
    } else {
      localStorage.setItem("remember_custom_gemini_key", key.trim());
    }
  }
}

export function getCustomClientApiKey(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("remember_custom_gemini_key") || "";
  }
  return "";
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

async function callDirectGemini(prompt: string, responseSchema?: any): Promise<any> {
  const apiKey = getClientApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key found on client");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { "User-Agent": "aistudio-build-client" },
    },
  });

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
        config: responseSchema ? { responseMimeType: "application/json", responseSchema } : undefined,
      });
      return parseGeminiJSON(response.text);
    } catch (err: any) {
      console.warn(`Direct client Gemini model (${model}) error:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

export async function directClientBreakdown(params: {
  title: string;
  difficulty?: number;
  notes?: string;
  category?: string;
  context?: string;
  availableCategories?: string[];
}) {
  const categoriesList =
    params.availableCategories && params.availableCategories.length > 0
      ? params.availableCategories.join(", ")
      : "work, personal, health, errands, study, other";

  const prompt = `You are Remember, an expert executive-function and ADHD task assistant.
When given a raw user task input, scaffold and break it down:

1. REWRITE & POLISH TITLE WITH A RELEVANT EMOJI:
   - Prefix with a single relevant emoji (e.g., "💊 Take morning vitamins", "🧹 Declutter desk", "📊 Finish quarterly budget report").
2. SELECT BEST CATEGORY from: [${categoriesList}].
3. REPEAT PATTERN: "none", "daily", or "weekly_on" (with repeatDays array where 0=Sun, 1=Mon... 6=Sat).
4. GENERATE 3-6 ACTIONABLE SUBTASKS starting with imperative action verbs.

Input Task: "${params.title}"
${params.notes ? `Notes: "${params.notes}"` : ""}
${params.category ? `Category Hint: "${params.category}"` : ""}
${params.context ? `User Life Context: "${params.context}"` : ""}

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

  return await callDirectGemini(prompt);
}

export async function directClientBrainDump(params: { text: string; context?: string }) {
  const prompt = `You are Remember, an executive function assistant.
Extract independent actionable tasks from this unstructured brain dump text.
Output JSON: { "tasks": [ { "title": "Task title with verb", "category": "work"|"personal"|"health"|"errands"|"study"|"other", "estimatedMinutes": 15, "subtasks": [{ "title": "Subtask title", "estimatedMinutes": 5 }] } ] }

Brain Dump Input:
"""
${params.text}
"""`;

  return await callDirectGemini(prompt);
}

export async function directClientChatEdit(params: {
  task: any;
  instruction: string;
  context?: string;
}) {
  const prompt = `You are Remember, an ADHD task assistant.
The user wants to modify their existing task and subtasks.
Original task: ${JSON.stringify(params.task)}
User Request: "${params.instruction}"
${params.context ? `User Life Context: "${params.context}"` : ""}

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

  return await callDirectGemini(prompt);
}

export async function directClientTest(keyOverride?: string): Promise<{ ok: boolean; model?: string; latencyMs?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const key = keyOverride || getClientApiKey();
    if (!key) {
      return { ok: false, error: "No API key configured. Enter a key or set VITE_GEMINI_API_KEY in Vercel." };
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const modelsToTry = ["gemini-3.7-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

    let lastError: any = null;
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: 'Respond with JSON: {"status":"ready","message":"AI is active"}',
          config: { responseMimeType: "application/json" },
        });

        parseGeminiJSON(response.text);
        return {
          ok: true,
          model,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        lastError = err;
      }
    }

    return {
      ok: false,
      error: lastError?.message || "Failed to communicate with Gemini API from client",
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Failed to communicate with Gemini API from client",
      latencyMs: Date.now() - startTime,
    };
  }
}
