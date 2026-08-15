import { Task, TaskCategory } from '../types';

// Helper to guess category from keywords
export function detectCategory(text: string): TaskCategory {
  const lower = text.toLowerCase();
  if (/doctor|dentist|pill|medicine|workout|run|gym|therapy|walk|stretch|hydrate|sleep|water|meal|cook|vet/.test(lower)) {
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

// Fallback Task Breakdown heuristic
export function fallbackBreakdown(
  title: string,
  difficulty: 1 | 2 | 3 = 2,
  _notes?: string,
  suggestedCategory?: TaskCategory
): { category: TaskCategory; estimatedMinutes: number; subtasks: { title: string; estimatedMinutes: number }[] } {
  const category = suggestedCategory || detectCategory(title);
  const cleanTitle = title.trim();

  let subtasks: { title: string; estimatedMinutes: number }[] = [];

  if (difficulty === 1) {
    // 3 bite-size micro-steps to overcome initiation freeze
    subtasks = [
      { title: `Open materials & set up workspace for "${cleanTitle}"`, estimatedMinutes: 3 },
      { title: `Complete the first small section / initial action`, estimatedMinutes: 10 },
      { title: `Review output and wrap up "${cleanTitle}"`, estimatedMinutes: 7 },
    ];
  } else if (difficulty === 3) {
    // 6-7 detailed micro-steps for overwhelming tasks
    subtasks = [
      { title: `Clear desk & silence distractions`, estimatedMinutes: 3 },
      { title: `Gather all links, notes, and requirements for "${cleanTitle}"`, estimatedMinutes: 7 },
      { title: `Draft a quick outline or starting point`, estimatedMinutes: 10 },
      { title: `Execute the core chunk of work`, estimatedMinutes: 15 },
      { title: `Take a 2-minute posture check & review progress`, estimatedMinutes: 5 },
      { title: `Complete the final details & formatting`, estimatedMinutes: 10 },
      { title: `Mark finished, save files, and clean up`, estimatedMinutes: 5 },
    ];
  } else {
    // Normal 4-5 balanced steps
    subtasks = [
      { title: `Prepare tools and locate materials for "${cleanTitle}"`, estimatedMinutes: 5 },
      { title: `Begin the primary task action`, estimatedMinutes: 15 },
      { title: `Refine, finish up, and check details`, estimatedMinutes: 10 },
      { title: `Save/send/file and close out`, estimatedMinutes: 5 },
    ];
  }

  const totalEst = subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return {
    category,
    estimatedMinutes: totalEst,
    subtasks,
  };
}

// Fallback Brain Dump extraction
export function fallbackBrainDump(text: string): {
  title: string;
  category: TaskCategory;
  estimatedMinutes: number;
  subtasks?: { title: string; estimatedMinutes: number }[];
}[] {
  // Split on newlines, bullet points, numbers, or semicolons
  const lines = text
    .split(/\n+|;|\band then\b|\balso\b|•|-|\d+\.\s+/i)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^(and|also|then|um|uh|like)$/i.test(l));

  if (lines.length === 0) {
    return [
      {
        title: text.slice(0, 40) || 'Quick brainstormed task',
        category: detectCategory(text),
        estimatedMinutes: 20,
      },
    ];
  }

  return lines.map((line) => {
    // Clean leading verbs or punctuation
    const title = line.replace(/^[,\.\-\s]+/, '');
    const category = detectCategory(title);
    return {
      title: title.length > 60 ? title.slice(0, 57) + '...' : title,
      category,
      estimatedMinutes: 15,
      subtasks: [
        { title: `Start first step of ${title.slice(0, 30)}`, estimatedMinutes: 5 },
        { title: `Complete ${title.slice(0, 30)}`, estimatedMinutes: 10 },
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
