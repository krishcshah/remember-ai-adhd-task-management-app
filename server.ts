import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health Check
  app.get("/api/health", (_req, res) => {
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({ status: "ok", aiAvailable: hasApiKey });
  });

  // AI Task Breakdown Endpoint
  app.post("/api/ai/breakdown", async (req, res) => {
    try {
      const { title, difficulty = 1, context = "", notes = "", category } = req.body;

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

      const difficultyGuide =
        difficulty === 1
          ? "Difficulty 1 (Bite-size): Provide 3-4 very small, low-friction steps that reduce task initiation freeze. First step must be ultra-simple."
          : difficulty === 3
          ? "Difficulty 3 (Deep): Provide 6-8 micro-steps breaking down complex multi-part tasks in thorough detail."
          : "Difficulty 2 (Normal): Provide 4-6 balanced, sequential steps.";

      const prompt = `You are Remember, an expert executive-function task assistant.
Break down this task into clear, sequential, bite-sized subtasks.

Task Title: "${title.trim()}"
${notes ? `Additional Notes: "${notes}"` : ""}
${category ? `Suggested Category: "${category}"` : ""}
${context ? `User Life Context: "${context}"` : ""}

Rules for ADHD/Executive-friendly task breakdown:
1. Every subtask title MUST start with an active imperative verb (e.g., "Open...", "Gather...", "Draft...", "Write...", "Send...").
2. ${difficultyGuide}
3. Account for realistic task-initiation friction and mental transitions in the estimatedMinutes.
4. Keep the category to one of: "work", "personal", "health", "errands", "study", "other" or custom string.
5. Return realistic time estimates in minutes (estMinutes for total task and for each subtask).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "Category identifier",
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
            required: ["category", "estimatedMinutes", "subtasks"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from AI model");
      }

      const parsed = JSON.parse(text);
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

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
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
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from AI model");
      }

      const parsed = JSON.parse(text);
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
${(task.subtasks || []).map((s: any, i: number) => `${i + 1}. ${s.title} (${s.estMinutes}m)`).join("\n")}

User Request: "${instruction}"
${context ? `User Life Context: "${context}"` : ""}

Update the task title, category, total estimated minutes, and subtask list according to the user's request. Keep subtask titles starting with imperative verbs.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
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
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from AI model");
      }

      const parsed = JSON.parse(text);
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
