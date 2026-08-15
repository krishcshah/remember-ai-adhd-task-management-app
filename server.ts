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
  const primaryModel = "gemini-3.7-flash";
  const fallbackModel = "gemini-flash-latest";

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config,
    });
    return { response, modelUsed: primaryModel };
  } catch (primaryErr: any) {
    console.warn(`Primary model (${primaryModel}) error:`, primaryErr?.message || primaryErr);
    // If model not found (404) or unavailable, try fallback alias
    if (
      primaryErr?.status === 404 ||
      (typeof primaryErr?.message === "string" &&
        (primaryErr.message.includes("not found") || primaryErr.message.includes("is not supported")))
    ) {
      console.log(`Attempting fallback model (${fallbackModel})...`);
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents: prompt,
        config,
      });
      return { response: fallbackResponse, modelUsed: fallbackModel };
    }
    throw primaryErr;
  }
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

      const prompt = `You are Remember, an expert executive-function and ADHD task assistant.
When given a raw user task input, your goal is to fully scaffold, organize, and break it down:

1. REWRITE & POLISH TITLE WITH A RELEVANT EMOJI:
   - Clean up vague, shorthand, or messy phrasing into an inspiring, actionable task title.
   - Prefix the title with a single relevant, appealing emoji (e.g., "💊 Take morning vitamins & hydrate", "🧹 Declutter and wipe down desk", "📊 Finish quarterly budget report", "🏋️ Leg day strength workout", "🧺 Fold & put away clean laundry", "🛒 Grocery shopping run").

2. SELECT BEST CATEGORY:
   - Pick the most fitting category identifier from: [${categoriesList}].

3. SMART REPEAT PATTERN:
   - Determine if this is a recurring habit or routine:
     * "daily": for daily habits/routines (e.g., vitamins, brush teeth, daily journal, morning walk, stretch, bedtime winddown).
     * "weekly" or "weekly_on": for tasks on specific days (e.g., trash night, laundry day, gym on Mon/Wed/Fri). Include "repeatDays" as array of day numbers where 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
     * "none": for one-off tasks (e.g., file taxes, call landlord, buy birthday gift).

4. DECIDE SUBTASK GRANULARITY:
   - If user explicitly specified difficulty (1, 2, or 3), you may respect it. Otherwise smartly decide based on task cognitive complexity:
     * 1 (Bite-sized, 3-4 micro steps): for high-friction initiation, quick chores, or daily habits to prevent freeze.
     * 2 (Normal, 4-5 steps): for standard multi-step projects.
     * 3 (Deep, 6-8 micro-steps): for complex, multi-stage or high-stress projects.

5. GENERATE SUBTASKS:
   - Every subtask title MUST start with an active imperative verb (e.g., "Open...", "Gather...", "Draft...", "Wipe...", "Check...").
   - Total estimated minutes should account for real friction.

Input Task: "${title.trim()}"
${notes ? `Additional Notes: "${notes}"` : ""}
${category ? `Suggested Category Hint: "${category}"` : ""}
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

      const prompt = `You are Remember, a task assistant.
The user wants to modify their existing task and subtask breakdown using natural language.

Current Task:
Title: "${task.title}"
Category: "${task.category}"
Current Subtasks:
${(task.subtasks || []).map((s: any, i: number) => `${i + 1}. ${s.title} (${s.estMinutes || 5}m)`).join("\n")}

User Request: "${instruction}"
${context ? `User Life Context: "${context}"` : ""}

Update the task title, category, total estimated minutes, and subtask list according to the user's request. Keep subtask titles starting with imperative verbs.`;

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
      return res.json(parsed);
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

