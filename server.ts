import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getApiKey(): string | null {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.API_KEY;

  if (!rawKey) return null;
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned === "MY_GEMINI_API_KEY" || cleaned === "YOUR_API_KEY") {
    return null;
  }
  return cleaned;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function parseGeminiJSON(text: string | undefined): any {
  if (!text || typeof text !== "string") {
    throw new Error("Empty or invalid response from AI model");
  }
  let cleaned = text.trim();
  // Remove markdown code fences if present (e.g. ```json ... ``` or ``` ...)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt regex extraction of first JSON object or array
    const objMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    throw new Error(`Failed to parse AI response as JSON: ${cleaned.substring(0, 120)}`);
  }
}

async function generateGeminiContent(
  ai: GoogleGenAI,
  prompt: string,
  config?: any
) {
  const modelsToTry = [
    "gemini-3.7-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
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
      console.warn(`Server Gemini model (${model}) error:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health & AI Status Check
  app.get("/api/health", (_req, res) => {
    const key = getApiKey();
    res.json({
      status: "ok",
      aiAvailable: Boolean(key),
      keySource: key ? "server_env" : "missing",
    });
  });

  // Live AI Connection Test Endpoint
  app.post("/api/ai/test", async (_req, res) => {
    const startTime = Date.now();
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          ok: false,
          error: "GEMINI_API_KEY is not configured in server environment or Secrets.",
          aiAvailable: false,
        });
      }

      const { response, modelUsed } = await generateGeminiContent(
        ai,
        "Respond with a 3-word confirmation in JSON: {\"status\":\"ready\",\"message\":\"AI is active\"}",
        {
          responseMimeType: "application/json",
        }
      );

      const latencyMs = Date.now() - startTime;
      const text = response.text;
      const parsed = parseGeminiJSON(text);

      return res.json({
        ok: true,
        model: modelUsed,
        latencyMs,
        result: parsed,
      });
    } catch (err: any) {
      console.error("AI live test failed:", err);
      const latencyMs = Date.now() - startTime;
      return res.status(500).json({
        ok: false,
        error: err.message || "Failed to communicate with Gemini API",
        details: err?.statusText || err?.code || "GENAI_ERROR",
        latencyMs,
      });
    }
  });

  // AI Task Breakdown Endpoint
  app.post("/api/ai/breakdown", async (req, res) => {
    try {
      const {
        title,
        difficulty,
        context = "",
        notes = "",
        category,
        availableCategories = [],
        existingSubtasks = [],
        currentSubtasks = [],
      } = req.body;

      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Task title is required" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured on server",
          fallbackNeeded: true,
        });
      }

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
}).join("\n")}` : `When given a raw user task input, your goal is to fully scaffold, organize, and break it down:
1. REWRITE & POLISH TITLE WITH A RELEVANT EMOJI: Clean up typos, spelling mistakes, or messy phrasing into an inspiring task title with an emoji prefix.
2. GENERATE 3-6 LOGICAL ACTIONABLE MICRO-STEPS starting with imperative verbs.`}

2. SELECT BEST CATEGORY:
   - Pick the most fitting category identifier from: [${categoriesList}]. ${category ? `User current category: "${category}". Keep it unless clearly wrong.` : ""}

3. SMART REPEAT PATTERN:
   - Determine if this is a recurring habit or routine:
     * "daily": for daily habits/routines (e.g., vitamins, brush teeth, daily journal, morning walk, stretch, bedtime winddown).
     * "weekly" or "weekly_on": for tasks on specific days (e.g., trash night, laundry day, gym on Mon/Wed/Fri). Include "repeatDays" as array of day numbers where 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
     * "none": for one-off tasks (e.g., file taxes, call landlord, buy birthday gift).

4. OPTIMAL SUBTASK GRANULARITY:
   - Autonomously determine the ideal breakdown depth and micro-step durations based on the task complexity and executive load:
     * Simple routine/habit: 3-4 bite-sized steps (1-5 min each).
     * Standard tasks: 4-6 clear, sequential action steps (5-10 min each).
     * Complex or high-friction tasks: 5-8 detailed, reassuring micro-steps with clear starting anchors.
   - Assign appropriate "granularity" (1 for small/bite-sized, 2 for standard, 3 for deep).

Input Task Title: "${title.trim()}"
${notes ? `Additional Notes: "${notes}" (Fix any spelling mistakes in notes context)` : ""}
${category ? `Category: "${category}"` : ""}
${context ? `User Life Context: "${context}"` : ""}`;

      const { response } = await generateGeminiContent(ai, prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Rewritten, clean action title prefixed with a relevant emoji",
            },
            category: {
              type: Type.STRING,
              description: "Category identifier matching one of the available categories",
            },
            repeatType: {
              type: Type.STRING,
              description: "Inferred repeat pattern: 'none', 'daily', 'weekly', or 'weekly_on'",
            },
            repeatDays: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "Array of day numbers (0=Sun, 1=Mon... 6=Sat) if repeating weekly on specific days",
            },
            granularity: {
              type: Type.INTEGER,
              description: "Chosen granularity level: 1 (Bite-sized), 2 (Normal), or 3 (Deep)",
            },
            estimatedMinutes: {
              type: Type.INTEGER,
              description: "Total estimated minutes for entire task",
            },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Subtask title starting with an imperative verb",
                  },
                  estimatedMinutes: {
                    type: Type.INTEGER,
                    description: "Estimated minutes for this subtask",
                  },
                },
                required: ["title", "estimatedMinutes"],
              },
            },
          },
          required: ["title", "category", "repeatType", "granularity", "estimatedMinutes", "subtasks"],
        },
      });

      const text = response.text;
      const parsed = parseGeminiJSON(text);
      return res.json(parsed);
    } catch (err: any) {
      console.error("AI breakdown error:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate AI breakdown",
        fallbackNeeded: true,
      });
    }
  });

  // AI Brain Dump Extraction Endpoint
  app.post("/api/ai/braindump", async (req, res) => {
    try {
      const { text: rawText, context = "" } = req.body;

      if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
        return res.status(400).json({ error: "Brain dump text is required" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured on server",
          fallbackNeeded: true,
        });
      }

      const prompt = `You are Remember, an executive function and task assistant.
The user has poured out an unstructured "brain dump" of thoughts, to-dos, or voice transcripts.
Extract distinct, concrete, actionable tasks from this text.

Brain Dump Text:
"""
${rawText.trim()}
"""
${context ? `User Life Context: "${context}"` : ""}

Rules:
1. Extract distinct actionable tasks.
2. Silently ignore pure emotional venting or non-actionable remarks that have no task attached.
3. Merge duplicate or redundant thoughts into clean, concise tasks.
4. Each task title must start with an active imperative verb and be concise (under 8 words).
5. Categorize each into: "work", "personal", "health", "errands", "study", or "other".
6. Provide a realistic time estimate in minutes (estMinutes).
7. Optionally include 2-4 starting subtasks if obvious.`;

      const { response } = await generateGeminiContent(ai, prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Concise actionable title starting with a verb",
              },
              category: {
                type: Type.STRING,
                description: "work, personal, health, errands, study, or other",
              },
              estimatedMinutes: {
                type: Type.INTEGER,
                description: "Estimated minutes",
              },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                  },
                  required: ["title", "estimatedMinutes"],
                },
              },
            },
            required: ["title", "category", "estimatedMinutes"],
          },
        },
      });

      const text = response.text;
      const parsed = parseGeminiJSON(text);
      return res.json({ tasks: parsed });
    } catch (err: any) {
      console.error("AI braindump error:", err);
      return res.status(500).json({
        error: err.message || "Failed to parse brain dump",
        fallbackNeeded: true,
      });
    }
  });

  // AI Chat-Edit / Refine Subtasks Endpoint
  app.post("/api/ai/chat-edit", async (req, res) => {
    try {
      const { task, instruction, context = "" } = req.body;

      if (!task || !instruction) {
        return res.status(400).json({ error: "Task and instruction are required" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured",
          fallbackNeeded: true,
        });
      }

      const prompt = `You are Remember, an expert ADHD task assistant.
The user wants to modify their existing task and subtask breakdown using natural language.

Current Task Details:
Title: "${task.title}"
Category: "${task.category}"
${task.notes ? `Notes: "${task.notes}"` : ""}
Current Subtasks:
${(task.subtasks || []).map((s: any, i: number) => `${i + 1}. "${s.title}" (~${s.estMinutes || 5} min)`).join("\n")}

User Request / Instruction: "${instruction}"
${context ? `User Life Context: "${context}"` : ""}

DIRECTIVES:
1. FIX ALL SPELLING MISTAKES, TYPOS, AND GRAMMAR ERRORS across the title, notes, and subtasks.
2. PRESERVE the existing subtasks and context, applying the user's requested instruction directly on top of them (rather than wiping them out or making up random new ones, unless instructed to do so).
3. Ensure every subtask starts with a crisp imperative verb and has realistic estimated minutes.
4. Total estimated minutes should accurately reflect the sum or overall scope.`;

      const { response } = await generateGeminiContent(ai, prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                },
                required: ["title", "estimatedMinutes"],
              },
            },
          },
          required: ["title", "category", "estimatedMinutes", "subtasks"],
        },
      });

      const text = response.text;
      const parsed = parseGeminiJSON(text);
      const rawSubs = Array.isArray(parsed?.subtasks) ? parsed.subtasks : [];
      const cleanSubs = rawSubs.map((s: any, i: number) => {
        const rawTitle = typeof s === "string" ? s : (s?.title || s?.text || s?.name || s?.step || s?.subtask || "");
        const titleStr = typeof rawTitle === "string" ? rawTitle.trim() : String(rawTitle || "").trim();
        return {
          title: titleStr && titleStr !== "undefined" ? titleStr : `Step ${i + 1}`,
          estimatedMinutes: Number(s?.estimatedMinutes || s?.estMinutes || 5) || 5,
        };
      });
      return res.json({
        title: parsed?.title || task.title,
        category: parsed?.category || task.category,
        estimatedMinutes: Number(parsed?.estimatedMinutes) || task.estMinutes,
        subtasks: cleanSubs,
      });
    } catch (err: any) {
      console.error("AI chat-edit error:", err);
      return res.status(500).json({
        error: err.message || "Failed to refine task",
        fallbackNeeded: true,
      });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Remember server running on http://localhost:${PORT}`);
  });
}

startServer();

