# Remember 🧠✨

> **An Executive Function & Focus Companion designed to overcome task paralysis and cognitive overwhelm.**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-3.7_Flash-8e75ff.svg)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_&_Auth-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

**Remember** acts as an external prefrontal cortex for neurodivergent minds, busy professionals, and students. Instead of presenting overwhelming task matrices and endless to-do lists, Remember isolates **one task at a time**, breaks daunting goals into bite-sized micro-steps, and guides you through an immersive, distraction-free playlist timer with procedural ambient soundscapes.

---

## ✨ Key Features

### 🎯 Single-Task "Now" Hero Card
- **Zero Decision Fatigue:** Focuses your attention on exactly one priority task at a time.
- **Micro-Step Progression:** Displays step 1 of N with dedicated action prompts so you only focus on the immediate physical step.
- **Queue Controls:** Reorder priority, jump between tasks, or complete tasks with celebratory confetti and chime audio effects.

### 🪄 Gemini 3.7 Flash AI Magic Scaffolding
- **Autonomous Scaffolding:** Transforms raw or shorthand task input (e.g. `clean kitchen`, `gym mon wed fri`, `renew passport`) into an actionable, polished task:
  - 🎨 **Contextual Emoji & Polished Title:** Assigns an emoji matching the action (e.g. `🧹 Clean kitchen`, `🏋️ Gym workout`, `📄 Renew passport`).
  - 🏷️ **Smart Category Selection:** Automatically chooses the best category based on your default and custom tags.
  - 🔁 **Repeat Pattern Recognition:** Detects recurring schedules (Daily, Weekly, or specific days like Mon/Wed/Fri).
  - 🧩 **Micro-Step Decomposition:** Generates 3–4 verb-led, low-friction micro-actions with realistic time estimates.
- **Granularity Dial:** Choose between Level 1 (Bite-sized micro-steps to defeat paralysis), Level 2 (Standard sequential), or Level 3 (Deep multi-phase breakdown).
- **Interactive AI Tweaks:**
  - 🥪 **Bite-sized:** Slices existing steps into smaller micro-actions.
  - ⚡ **Faster:** Trims steps and condenses time estimates.
  - 💬 **Custom:** Instruct the AI in plain language to adjust steps.

### 🌅 Automatic Task Rollover
- Unfinished tasks from past dates automatically roll forward into your **Today** view with a gentle rollover indicator.
- Configurable anytime in Settings (**Auto-Rollover Pending Tasks** toggle).

### 🧠 Unstructured Brain Dump Extractor
- Paste raw paragraphs, stream-of-consciousness notes, or speech-to-text transcripts into a freeform scratchpad.
- Gemini AI extracts clean, actionable tasks, assigns categories, estimates durations, and files them into your schedule.

### ⏱️ Playlist-Style Focus Timer & Procedural Audio Engine
- Step-by-step sequential focus countdowns with progress indicators.
- **Procedural Ambient Soundscapes (Web Audio API):**
  - 🟫 Brown Noise, White Noise, Pink Noise
  - 🌧️ Gentle Rain & Water Stream
  - ☕ Ambient Coffee Shop & Lo-Fi Hum
  - 🧠 Binaural Alpha Focus Waves (10 Hz)
- **Audio Feedback:** Non-jarring start, tick, and completion chimes.

### 🔁 Repeating Schedules & Calendar Views
- Recurring task management: **Daily**, **Weekly**, or specific days of the week (**Weekly on Mon, Wed, Fri**).
- **Interactive Week & Month Planner:** Color-coded workload density indicators and drag-free date scheduling.
- **Unscheduled Tray:** Keep long-term ideas filed safely until you are ready to schedule them.

### ☁️ Cloud Persistence & Multi-Tier Syncing
- **Cloud Firestore Database:** Multi-tab and multi-device persistence.
- **Anonymous Device Sync:** Instant zero-config cloud sync without needing an account.
- **Google Authentication:** Optional cross-device OAuth account sync.
- **Offline & Local-First:** 100% offline heuristic fallback support with local caching, JSON export/restore, reset to starter defaults, and full data wipe options.

---

## 🔐 Google Sign-In & Firebase Setup

Firebase Authentication restricts OAuth (Google Sign-In) to explicit **Authorized Domains** to prevent unauthorized origins from impersonating your app.

### Why Google Sign-In Fails on Deployed URLs by Default
When you deploy to Cloud Run (`https://*.run.app`), Vercel (`https://*.vercel.app`), or a custom domain, Firebase blocks Google Sign-In popups with `auth/unauthorized-domain` until you add the deployed domain to Firebase Console.

### 🛠️ How to Authorize Your Deployed Domain (3 Steps):

1. **Copy your deployed domain name:**
   - In the app, go to **Settings** → **Cloud Sync & Google Auth**.
   - If an authorization notice appears, click **"Copy Domain"** (e.g. `ais-pre-wrbg35zigo2dpr73cnzfgq-407703201313.europe-west2.run.app` or `yourdomain.com`).

2. **Add the domain in Firebase Console:**
   - Open the [Firebase Console](https://console.firebase.google.com/).
   - Select your project (`gen-lang-client-0796935490` or your custom project).
   - In the left navigation, click **Authentication** → select the **Settings** tab.
   - Scroll down to the **Authorized domains** table and click **Add domain**.
   - Paste your domain (e.g. `ais-pre-wrbg35zigo2dpr73cnzfgq-407703201313.europe-west2.run.app` or `*.run.app`), then click **Save**.

3. **Refresh and Sign In:**
   - Return to your deployed app, refresh the page, and click **"Sign in with Google"**.

> 💡 **Note for Iframe Previews:** If previewing inside an iframe container where third-party popups are restricted by browser policy, click **"Open in New Window"** in the Settings tab to authenticate in a full tab.

> 🔒 **Zero Data Loss Guarantee:** Even without Google Sign-In, **Remember** automatically syncs your data to Cloud Firestore using Anonymous Device Sync and saves everything locally in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 & TypeScript 5.8 |
| **Styling** | Tailwind CSS v4 |
| **Icons & UI** | Lucide React |
| **Animations** | Motion (`motion/react`) & Canvas Confetti |
| **Backend & Proxy** | Node.js Express (Serving Vite client + secure `/api/ai/*` endpoints) |
| **AI Model** | Google Gen AI SDK (`@google/genai`) with `gemini-3.7-flash` |
| **Database & Auth** | Firebase Cloud Firestore & Firebase Authentication |
| **Audio Engine** | Web Audio API procedural synthesizers |
| **Build Tooling** | Vite 6 & esbuild |

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
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
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
   *(If no API key is provided, the application automatically runs offline heuristic task decomposition).*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware on `http://localhost:3000` |
| `npm run build` | Compiles the React client into `dist/` and bundles `server.ts` into `dist/server.cjs` |
| `npm start` | Launches the production CommonJS server (`dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run preview` | Previews the production build locally |

---

## 🚢 Production Deployment

### Container / Cloud Run
The project includes a self-contained Express server bundled via `esbuild`:
```bash
npm run build
npm start
```
The server binds to port `3000` and host `0.0.0.0`, ready for Google Cloud Run, AWS ECS, or Docker containers.

### Vercel / Netlify
1. Push repository to GitHub.
2. Connect repository to Vercel/Netlify with Framework Preset set to **Vite**.
3. Add `GEMINI_API_KEY` under Environment Variables.
4. Add your deployment domain (e.g. `your-app.vercel.app`) to Firebase Console Authorized Domains.

---

## 📄 License

Distributed under the Apache-2.0 License. See `LICENSE` for details.
