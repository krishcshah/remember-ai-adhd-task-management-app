import { Task, TaskCategory, RepeatType } from '../types';

/**
 * Normalizes any subtask representation returned by AI or heuristic fallback
 * into valid clean objects, preventing "undefined" or missing properties.
 */
export function normalizeAiSubtasks(
  rawSubtasks: any,
  fallbackTitle?: string
): { title: string; estimatedMinutes: number }[] {
  if (!rawSubtasks) {
    if (fallbackTitle) {
      return [{ title: `Start with: ${fallbackTitle.replace(/^[\p{Emoji}\s]+/u, '').slice(0, 35)}`, estimatedMinutes: 5 }];
    }
    return [];
  }

  const list = Array.isArray(rawSubtasks) ? rawSubtasks : [rawSubtasks];
  const cleaned: { title: string; estimatedMinutes: number }[] = [];

  for (const item of list) {
    if (!item) continue;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed && trimmed !== 'undefined' && trimmed !== '[object Object]') {
        cleaned.push({
          title: trimmed,
          estimatedMinutes: 4,
        });
      }
    } else if (typeof item === 'object') {
      const rawTitle =
        item.title ||
        item.text ||
        item.name ||
        item.step ||
        item.subtask ||
        item.action ||
        item.task ||
        item.description ||
        item.label ||
        '';
      const titleStr = typeof rawTitle === 'string' ? rawTitle.trim() : String(rawTitle || '').trim();
      const mins =
        Number(item.estimatedMinutes || item.estMinutes || item.minutes || item.duration || item.time || 4) || 4;

      if (titleStr && titleStr !== 'undefined' && titleStr !== '[object Object]') {
        cleaned.push({
          title: titleStr,
          estimatedMinutes: mins,
        });
      }
    }
  }

  if (cleaned.length === 0 && fallbackTitle) {
    cleaned.push({
      title: `Start with: ${fallbackTitle.replace(/^[\p{Emoji}\s]+/u, '').slice(0, 35)}`,
      estimatedMinutes: 5,
    });
  }

  return cleaned;
}

// Helper to guess appropriate emoji
export function detectEmoji(text: string): string {
  const lower = text.toLowerCase();
  if (/vitamin|pill|med|medicine|supplement/.test(lower)) return '💊';
  if (/water|hydrate|drink/.test(lower)) return '💧';
  if (/teeth|brush|floss/.test(lower)) return '🪥';
  if (/workout|gym|run|lift|exercise|yoga|stretch|walk|cardio/.test(lower)) return '🏋️';
  if (/clean|tidy|vacuum|sweep|dishes|trash|mop|wipe|declutter/.test(lower)) return '🧹';
  if (/laundry|wash|fold|clothes/.test(lower)) return '🧺';
  if (/groceries|buy|store|target|market|shop|order/.test(lower)) return '🛒';
  if (/cook|meal|dinner|lunch|breakfast|prep|bake/.test(lower)) return '🍳';
  if (/tax|invoice|bill|receipt|finance|budget|bank|pay/.test(lower)) return '💰';
  if (/email|message|slack|call|reach out|contact/.test(lower)) return '📧';
  if (/write|draft|report|essay|doc|notes|journal/.test(lower)) return '📝';
  if (/code|build|bug|feature|dev|deploy|debug|repo/.test(lower)) return '💻';
  if (/study|read|book|exam|quiz|learn|lecture|research/.test(lower)) return '📚';
  if (/meeting|sync|presentation|demo|standup|call/.test(lower)) return '👥';
  if (/doctor|dentist|appointment|clinic|vet/.test(lower)) return '🩺';
  if (/sleep|bed|rest|wind down|meditate|relax/.test(lower)) return '🌙';
  return '✨';
}

// Helper to guess category from keywords
export function detectCategory(text: string): TaskCategory {
  const lower = text.toLowerCase();
  if (/doctor|dentist|pill|medicine|vitamin|workout|run|gym|therapy|walk|stretch|hydrate|sleep|water|meal|cook|vet/.test(lower)) {
    return 'health';
  }
  if (/buy|groceries|store|target|clean|laundry|wash|dishes|trash|order|pick up|mail|post office|package|return|bank/.test(lower)) {
    return 'errands';
  }
  if (/study|read|homework|quiz|exam|class|paper|research|book|lecture|course|learn|assignment/.test(lower)) {
    return 'study';
  }
  if (/email|client|meeting|report|deck|presentation|code|jira|ticket|slack|boss|pitch|project|invoice|budget/.test(lower)) {
    return 'work';
  }
  if (/friend|family|call mom|birthday|gift|hobby|garden|game|relax|journal|movie|plan trip|travel/.test(lower)) {
    return 'personal';
  }
  return 'other';
}

// Helper to detect repeat patterns
export function detectRepeatPattern(text: string): { repeatType: RepeatType; repeatDays?: number[] } {
  const lower = text.toLowerCase();
  
  if (/every\s*day|daily|each\s*day|morning routine|night routine|brush teeth|take vitamin/i.test(lower)) {
    return { repeatType: 'daily' };
  }

  // Check specific day mentions
  const days: number[] = [];
  if (/\b(mon|monday)\b/i.test(lower)) days.push(1);
  if (/\b(tue|tues|tuesday)\b/i.test(lower)) days.push(2);
  if (/\b(wed|wednesday)\b/i.test(lower)) days.push(3);
  if (/\b(thu|thur|thurs|thursday)\b/i.test(lower)) days.push(4);
  if (/\b(fri|friday)\b/i.test(lower)) days.push(5);
  if (/\b(sat|saturday)\b/i.test(lower)) days.push(6);
  if (/\b(sun|sunday)\b/i.test(lower)) days.push(0);

  if (days.length > 0) {
    return { repeatType: 'weekly_on', repeatDays: days };
  }

  if (/weekly|every week|each week/i.test(lower)) {
    return { repeatType: 'weekly' };
  }

  return { repeatType: 'none' };
}

// Helper to detect date and time from natural language
export function detectScheduledDateAndTime(
  text: string,
  baseDateIso?: string
): {
  scheduledDate: string | null;
  scheduledTime: string | null;
  cleanedText: string;
} {
  const base = baseDateIso && /^\d{4}-\d{2}-\d{2}$/.test(baseDateIso)
    ? new Date(baseDateIso + 'T12:00:00')
    : new Date();

  let scheduledDate: string | null = null;
  let scheduledTime: string | null = null;
  let cleaned = text;

  const lower = text.toLowerCase();

  // 1. Time detection (e.g. "at 3pm", "at 10:30am", "5pm", "14:00")
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at\s+)?(\d{1,2}):(\d{2})\b/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    if (timeMatch[3]) {
      // 12-hour AM/PM
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPm = timeMatch[3].toLowerCase() === 'pm';
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      scheduledTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } else if (timeMatch[4] && timeMatch[5]) {
      // 24-hour HH:MM
      const hours = parseInt(timeMatch[4], 10);
      const minutes = parseInt(timeMatch[5], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        scheduledTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    if (scheduledTime) {
      cleaned = cleaned.replace(timeMatch[0], ' ');
    }
  }

  // 2. Date detection
  if (/\b(?:tomorrow|tmrw)\b/i.test(lower)) {
    const d = new Date(base.getTime() + 86400000);
    scheduledDate = d.toISOString().split('T')[0];
    cleaned = cleaned.replace(/\b(?:tomorrow|tmrw)\b/gi, ' ');
  } else if (/\b(?:today|tonight|this morning|this afternoon|this evening)\b/i.test(lower)) {
    scheduledDate = base.toISOString().split('T')[0];
    cleaned = cleaned.replace(/\b(?:today|tonight|this morning|this afternoon|this evening)\b/gi, ' ');
  } else {
    // Check for "in X days"
    const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
    if (inDaysMatch) {
      const daysToAdd = parseInt(inDaysMatch[1], 10);
      const d = new Date(base.getTime() + daysToAdd * 86400000);
      scheduledDate = d.toISOString().split('T')[0];
      cleaned = cleaned.replace(/\bin\s+\d+\s+days?\b/gi, ' ');
    } else {
      // Check for day of week: (next/this/on) (monday|tuesday|...)
      const dayMap: Record<string, number> = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2, tues: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4, thur: 4, thurs: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6,
      };

      const dayMatch = lower.match(/\b(?:next|this|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/);
      if (dayMatch && dayMap[dayMatch[1]] !== undefined) {
        const targetDay = dayMap[dayMatch[1]];
        const currentDay = base.getDay();
        let diff = (targetDay - currentDay + 7) % 7;
        if (diff === 0) diff = 7; // Next occurrence
        const d = new Date(base.getTime() + diff * 86400000);
        scheduledDate = d.toISOString().split('T')[0];
        cleaned = cleaned.replace(dayMatch[0], ' ');
      }
    }
  }

  // Clean up remaining whitespace and dangling prepositions
  cleaned = cleaned
    .replace(/\b(?:by|on|at|for|due)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { scheduledDate, scheduledTime, cleanedText: cleaned };
}

// Fallback Task Breakdown heuristic
export function fallbackBreakdown(
  title: string,
  difficulty?: 1 | 2 | 3,
  _notes?: string,
  suggestedCategory?: TaskCategory,
  existingSubtasks?: Array<{ title: string; estimatedMinutes?: number; estMinutes?: number }>,
  baseDateIso?: string
): {
  title: string;
  category: TaskCategory;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  repeatType: RepeatType;
  repeatDays?: number[];
  granularity: 1 | 2 | 3;
  estimatedMinutes: number;
  subtasks: { title: string; estimatedMinutes: number }[];
} {
  const { scheduledDate, scheduledTime, cleanedText } = detectScheduledDateAndTime(title, baseDateIso);
  const category = suggestedCategory || detectCategory(title);
  const rawNoEmoji = (cleanedText || title).replace(/^[\p{Emoji}\s]+/u, '').trim();
  const emoji = detectEmoji(title);
  const polishedTitle = `${emoji} ${rawNoEmoji.charAt(0).toUpperCase() + rawNoEmoji.slice(1)}`;
  
  const repeatInfo = detectRepeatPattern(title);
  
  // Decide granularity: if explicitly provided use it, otherwise decide based on length/keywords
  const chosenDifficulty: 1 | 2 | 3 = difficulty || (rawNoEmoji.length > 30 || /tax|report|project|build|clean entire/i.test(rawNoEmoji) ? 2 : 1);

  let subtasks: { title: string; estimatedMinutes: number }[] = [];

  // If the user already provided existing subtasks, preserve and clean them up
  if (existingSubtasks && existingSubtasks.length > 0) {
    subtasks = existingSubtasks
      .map((s) => {
        const rawTitle = typeof s === 'string' ? s : (s?.title || '');
        const cleaned = String(rawTitle).trim();
        const mins = Number(s?.estimatedMinutes || s?.estMinutes || 5) || 5;
        if (!cleaned || cleaned === 'undefined') return null;
        // Capitalize first letter
        const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        return {
          title: capitalized,
          estimatedMinutes: mins,
        };
      })
      .filter((s): s is { title: string; estimatedMinutes: number } => s !== null);
  }

  // If no existing subtasks, generate based on difficulty
  if (subtasks.length === 0) {
    if (chosenDifficulty === 1) {
      // 3 bite-size micro-steps to overcome initiation freeze
      subtasks = [
        { title: `Set up tools & clear space for "${rawNoEmoji}"`, estimatedMinutes: 3 },
        { title: `Take the first immediate 5-minute action`, estimatedMinutes: 7 },
        { title: `Review and wrap up "${rawNoEmoji}"`, estimatedMinutes: 5 },
      ];
    } else if (chosenDifficulty === 3) {
      // 6-7 detailed micro-steps for overwhelming tasks
      subtasks = [
        { title: `Clear desk & silence notifications`, estimatedMinutes: 3 },
        { title: `Gather all links, notes, and requirements for "${rawNoEmoji}"`, estimatedMinutes: 7 },
        { title: `Draft a quick outline or starting point`, estimatedMinutes: 10 },
        { title: `Execute the core chunk of work`, estimatedMinutes: 15 },
        { title: `Take a 2-minute posture check & review progress`, estimatedMinutes: 5 },
        { title: `Complete the final details & polish`, estimatedMinutes: 10 },
        { title: `Mark finished, save files, and clean up`, estimatedMinutes: 5 },
      ];
    } else {
      // Normal 4-5 balanced steps
      subtasks = [
        { title: `Prepare tools and locate materials for "${rawNoEmoji}"`, estimatedMinutes: 5 },
        { title: `Begin the primary task action`, estimatedMinutes: 12 },
        { title: `Refine, finish up, and check details`, estimatedMinutes: 8 },
        { title: `Save/file and close out`, estimatedMinutes: 5 },
      ];
    }
  }

  const totalEst = subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return {
    title: polishedTitle,
    category,
    scheduledDate: scheduledDate || null,
    scheduledTime: scheduledTime || null,
    repeatType: repeatInfo.repeatType,
    repeatDays: repeatInfo.repeatDays,
    granularity: chosenDifficulty,
    estimatedMinutes: totalEst > 0 ? totalEst : 15,
    subtasks,
  };
}

// Fallback Brain Dump extraction
export function fallbackBrainDump(text: string, baseDateIso?: string): {
  title: string;
  category: TaskCategory;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  estimatedMinutes: number;
  subtasks?: { title: string; estimatedMinutes: number }[];
}[] {
  if (!text || typeof text !== 'string') {
    return [
      {
        title: 'Quick brainstormed task',
        category: 'other',
        scheduledDate: null,
        scheduledTime: null,
        estimatedMinutes: 15,
        subtasks: [
          { title: 'Start first step', estimatedMinutes: 5 },
          { title: 'Wrap up task', estimatedMinutes: 10 },
        ],
      },
    ];
  }

  // Split on newlines, bullet points, numbers, or semicolons
  const rawSegments = text.split(/\r?\n+|;|\band then\b|\balso\b|•|–|—|\*|\d+[\.\)]\s+/i);
  const cleanLines = rawSegments
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !/^(and|also|then|um|uh|like|so|plus|next)$/i.test(l));

  if (cleanLines.length === 0) {
    const { scheduledDate, scheduledTime, cleanedText } = detectScheduledDateAndTime(text.trim(), baseDateIso);
    const fallbackTitle = cleanedText.slice(0, 45) || 'Quick brainstormed task';
    return [
      {
        title: fallbackTitle,
        category: detectCategory(text),
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        estimatedMinutes: 20,
        subtasks: [
          { title: `Begin first step of ${fallbackTitle.slice(0, 25)}`, estimatedMinutes: 5 },
          { title: `Finish and check ${fallbackTitle.slice(0, 25)}`, estimatedMinutes: 10 },
        ],
      },
    ];
  }

  return cleanLines.map((line) => {
    // Clean leading verbs or punctuation
    const trimmed = line.replace(/^[\s,.\-•–—*#\d\)]+/, '').trim() || line.trim();
    const { scheduledDate, scheduledTime, cleanedText } = detectScheduledDateAndTime(trimmed, baseDateIso);
    const category = detectCategory(trimmed);
    const shortTitle = (cleanedText || trimmed).length > 70 ? (cleanedText || trimmed).slice(0, 67) + '...' : (cleanedText || trimmed);
    return {
      title: shortTitle,
      category: category || 'other',
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      estimatedMinutes: 15,
      subtasks: [
        { title: `Start first step of ${shortTitle.slice(0, 30)}`, estimatedMinutes: 5 },
        { title: `Complete ${shortTitle.slice(0, 30)}`, estimatedMinutes: 10 },
      ],
    };
  });
}

// Fallback Chat-Edit heuristic
export function fallbackChatEdit(
  task: Task,
  instruction: string
): {
  title: string;
  category: TaskCategory;
  estimatedMinutes: number;
  subtasks: { title: string; estimatedMinutes: number }[];
} {
  const lower = instruction.toLowerCase();
  let stepList: { title: string; estimatedMinutes: number }[] =
    task.subtasks.length > 0
      ? task.subtasks.map((s) => ({ title: s.title, estimatedMinutes: s.estMinutes }))
      : [{ title: task.title, estimatedMinutes: task.estMinutes }];

  if (lower.includes('shorter') || lower.includes('faster') || lower.includes('cut')) {
    stepList = stepList.map((s) => ({
      title: s.title,
      estimatedMinutes: Math.max(2, Math.round(s.estimatedMinutes * 0.7)),
    }));
  } else if (lower.includes('split') || lower.includes('smaller') || lower.includes('break down')) {
    const newSubs: { title: string; estimatedMinutes: number }[] = [];
    stepList.forEach((s) => {
      newSubs.push({ title: `Part 1: ${s.title}`, estimatedMinutes: Math.max(3, Math.round(s.estimatedMinutes / 2)) });
      newSubs.push({ title: `Part 2: Finish ${s.title}`, estimatedMinutes: Math.max(3, Math.round(s.estimatedMinutes / 2)) });
    });
    stepList = newSubs.slice(0, 8);
  } else if (lower.includes('more time') || lower.includes('longer')) {
    stepList = stepList.map((s) => ({
      title: s.title,
      estimatedMinutes: s.estimatedMinutes + 5,
    }));
  } else {
    // Generic add instruction step
    stepList.push({
      title: `Step: ${instruction.slice(0, 40)}`,
      estimatedMinutes: 10,
    });
  }

  const total = stepList.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return {
    title: task.title,
    category: task.category,
    estimatedMinutes: total,
    subtasks: stepList,
  };
}
