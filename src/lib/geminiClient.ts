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
  notes?: string;
  category?: string;
  context?: string;
  availableCategories?: string[];
  existingSubtasks?: Array<{ title: string; estimatedMinutes?: number; estMinutes?: number }>;
  currentSubtasks?: Array<{ title: string; estimatedMinutes?: number; estMinutes?: number }>;
}) {
  const categoriesList =
    params.availableCategories && params.availableCategories.length > 0
      ? params.availableCategories.join(", ")
      : "work, personal, health, errands, study, other";

  const subtasksToConsider =
    Array.isArray(params.existingSubtasks) && params.existingSubtasks.length > 0
      ? params.existingSubtasks
      : Array.isArray(params.currentSubtasks) && params.currentSubtasks.length > 0
      ? params.currentSubtasks
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
1. REWRITE & POLISH TITLE WITH A RELEVANT EMOJI (e.g., "💊 Take morning vitamins", "🧹 Declutter desk", "📊 Finish quarterly budget report"). Fix any spelling mistakes.
2. OPTIMAL SUBTASK GRANULARITY: Autonomously determine the ideal breakdown depth and micro-step durations based on the task complexity:
   - Simple routine: 3-4 bite-sized steps (1-5 min each).
   - Standard tasks: 4-6 clear, sequential action steps (5-10 min each).
   - Complex tasks: 5-8 detailed, reassuring micro-steps.
   - Assign appropriate "granularity" (1 for small, 2 for standard, 3 for deep).`}

2. SELECT BEST CATEGORY from: [${categoriesList}]. ${params.category ? `User category: "${params.category}". Keep unless clearly wrong.` : ""}
3. REPEAT PATTERN: "none", "daily", or "weekly_on" (with repeatDays array where 0=Sun, 1=Mon... 6=Sat).

Input Task: "${params.title}"
${params.notes ? `Notes: "${params.notes}" (Fix any spelling mistakes in notes)` : ""}
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
  const prompt = `You are Remember, an expert ADHD task assistant.
The user wants to modify their existing task and subtask breakdown.
Current Task:
Title: "${params.task?.title || ""}"
Category: "${params.task?.category || ""}"
${params.task?.notes ? `Notes: "${params.task.notes}"` : ""}
Current Subtasks:
${((params.task?.subtasks as any[]) || []).map((s: any, i: number) => `${i + 1}. "${s?.title || s}" (~${s?.estMinutes || s?.estimatedMinutes || 5} min)`).join("\n")}

User Request: "${params.instruction}"
${params.context ? `User Life Context: "${params.context}"` : ""}

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
