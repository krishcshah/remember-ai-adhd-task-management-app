# Remember 🧠✨

> **An Executive Function & Focus Companion designed to overcome task paralysis and cognitive overwhelm.**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-8e75ff.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

**Remember** acts as an external prefrontal cortex for neurodivergent minds, busy professionals, and students. Instead of presenting overwhelming task matrices and endless to-do lists, Remember isolates **one task at a time**, breaks daunting goals into bite-sized micro-steps, and guides you through an immersive, distraction-free playlist timer with ambient soundscapes.

---

## ✨ Key Features

### 🎯 Single-Task "Now" Hero Card
- **Zero Decision Fatigue:** Highlights your current priority task with a dedicated single-step card.
- **Micro-Step Progression:** Shows step 1 of N so you only focus on the immediate next physical action.
- **Queue Controls:** Reorder, skip to next, or complete tasks with celebratory confetti and sound effects.

### 🪄 Gemini 2.5 AI Magic Breakdown
- **Instant Micro-Decomposition:** Transforms vague, daunting tasks (e.g. *"File taxes"* or *"Clean room"*) into 3–4 tiny, low-friction steps starting with active imperative verbs.
- **ADHD-Friendly Granularity:** Defaults to Level 1 (Bite-sized) to bypass task-initiation freeze.
- **3-Button Quick Tweaks:**
  - 🥪 **Bite-sized:** Slices complex steps into even smaller micro-actions.
  - ⚡ **Faster:** Streamlines time estimates and trims non-essential steps.
  - 💬 **Custom:** Instruct the AI in plain language to rewrite or customize steps.

### 🧠 Unstructured Brain Dump Extractor
- Dump raw paragraphs, rambling thoughts, or speech-to-text transcripts into a freeform scratchpad.
- The AI automatically extracts clean, actionable tasks, assigns categories, estimates durations, and files them into your inbox.

### ⏱️ Playlist-Style Focus Timer & Audio Engine
- Runs your subtasks like a music playlist—moving step-by-step with dedicated countdowns.
- **Built-in Ambient Sound Synthesizer:** Built using the Web Audio API (Brown Noise, White Noise, Pink Noise, Gentle Rain, Binaural Alpha Beats, Ambient Cafe).
- **Audio Cues:** Subtle start, tick, and celebration chimes upon task completion.

### 🔁 Smart Repeating Schedules
- Set tasks to repeat **Daily**, **Weekly**, or on specific days of the week (**Weekly on Mon, Wed, Fri**).
- One-tap schedule badge right on task cards.

### 📅 Calendar & Library Views
- **Interactive Week & Month Planner:** Color-coded category dots showing day-by-day workload.
- **Unscheduled Tray:** Keep long-term ideas filed safely in your inbox until you are ready to schedule them.
- **Search & Filter:** Instant search across task titles, notes, and subtasks.

### 🏷️ Custom Categories & Life Context
- Create custom category tags with personalized color badges.
- **AI Life Context:** Save personal preferences (e.g. *"I work best in 15-minute bursts"*) that automatically steer all AI generation.

### 🔒 100% Local-First, Privacy-Safe & Offline Ready
- **No Cloud Tracking:** All data persists locally in your browser (`localStorage`).
- **Offline Decomposition Heuristics:** The app continues to function seamlessly without internet access or API keys using offline rule-based task decomposition.
- **One-Click Backup & Restore:** Export and import complete JSON backups anytime.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion (Animations), Lucide React (Icons), Canvas Confetti
- **Backend:** Node.js, Express (API proxy layer for secure server-side Gemini keys)
- **AI Engine:** Google Gen AI SDK (`@google/genai`) powered by `gemini-2.5-flash`
- **Audio:** Web Audio API procedural sound synthesizers (zero external audio file dependencies)
- **Build System:** Vite 6 & esbuild

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/remember.git
   cd remember
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
   *(Note: If no API key is provided, the application automatically uses offline heuristic breakdown rules).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware in dev mode (`localhost:3000`) |
| `npm run build` | Builds the client SPA into `dist/` and bundles `server.ts` with esbuild |
| `npm start` | Starts the production server (`dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checks (`tsc --noEmit`) |
| `npm run preview` | Previews the production Vite build locally |

---

## 🚢 Deployment

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the Framework Preset to **Vite**.
4. (Optional) Add `GEMINI_API_KEY` under **Project Settings → Environment Variables**.
5. Deploy!

### Deploy with Docker / Cloud Run
The repository is production-ready for containerized environments:
```bash
npm run build
npm start
```

---

## 📄 License

Distributed under the Apache-2.0 License. See `LICENSE` for more information.
