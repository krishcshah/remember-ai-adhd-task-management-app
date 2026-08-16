import { Task } from '../types';

let audioCtx: AudioContext | null = null;

/**
 * Plays a gentle, pleasant ADHD-friendly notification chime using the Web Audio API.
 * No external sound files or assets required.
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Harmonious chord notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const tones = [
      { freq: 523.25, time: now, duration: 0.4, gain: 0.15 },
      { freq: 659.25, time: now + 0.1, duration: 0.45, gain: 0.15 },
      { freq: 783.99, time: now + 0.2, duration: 0.5, gain: 0.18 },
      { freq: 1046.50, time: now + 0.32, duration: 0.7, gain: 0.12 },
    ];

    tones.forEach(({ freq, time, duration, gain }) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Smooth attack and exponential decay
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.exponentialRampToValueAtTime(gain, time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });

    // Optional device vibration for mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Ignore vibration errors
      }
    }
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}

/**
 * Check the current status of browser Notification API
 */
export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request system notification permission from the user
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission || 'denied';
  }
}

/**
 * Triggers a browser native notification if permitted
 */
export function triggerSystemNotification(
  task: Task,
  options?: {
    onClick?: () => void;
  }
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const timeFormatted = task.scheduledTime || 'Now';
    const subtaskPreview =
      task.subtasks && task.subtasks.length > 0
        ? ` • 1st step: ${task.subtasks[0].title}`
        : '';

    const notification = new Notification(`⏰ Task Time: ${task.title}`, {
      body: `Scheduled for ${timeFormatted}${subtaskPreview} (~${task.estMinutes || 15}m)`,
      icon: '/favicon.ico',
      tag: `task-reminder-${task.id}-${task.scheduledTime}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options?.onClick) {
        options.onClick();
      }
    };

    return true;
  } catch (err) {
    console.warn('Failed to send system notification:', err);
    return false;
  }
}
