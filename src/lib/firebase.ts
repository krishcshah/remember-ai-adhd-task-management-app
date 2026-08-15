import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { Task, CategoryMeta, Settings } from '../types';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
}, config.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Device ID for anonymous/guest cloud syncing
const DEVICE_ID_KEY = 'remember_device_cloud_id';

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Cloud Sync Helpers
 */
export async function syncTasksToCloud(userId: string | null, tasks: Task[]) {
  try {
    const parentPath = userId ? `users/${userId}` : `devices/${getOrCreateDeviceId()}`;
    const colRef = collection(db, `${parentPath}/tasks`);
    const existingSnapshot = await getDocs(colRef);
    
    const currentTaskIds = new Set(tasks.map((t) => t.id));
    const batch = writeBatch(db);

    // 1. Delete tasks in cloud that no longer exist locally
    existingSnapshot.forEach((docSnap) => {
      if (!currentTaskIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // 2. Set/update current tasks
    tasks.forEach((t) => {
      const taskRef = doc(db, `${parentPath}/tasks`, t.id);
      batch.set(taskRef, t, { merge: true });
    });

    // 3. Save metadata / root doc
    const rootRef = doc(db, parentPath);
    batch.set(rootRef, { updatedAt: new Date().toISOString(), taskCount: tasks.length }, { merge: true });

    await batch.commit();
  } catch (err) {
    console.warn('Background cloud task sync error (offline or transient):', err);
  }
}

export async function clearAllTasksFromCloud(userId: string | null) {
  try {
    const parentPath = userId ? `users/${userId}` : `devices/${getOrCreateDeviceId()}`;
    const colRef = collection(db, `${parentPath}/tasks`);
    const existingSnapshot = await getDocs(colRef);
    
    if (!existingSnapshot.empty) {
      const batch = writeBatch(db);
      existingSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    const rootRef = doc(db, parentPath);
    await setDoc(rootRef, { updatedAt: new Date().toISOString(), taskCount: 0, clearedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Cloud clear all tasks error:', err);
  }
}

export async function syncTaskDeletionToCloud(userId: string | null, taskId: string) {
  try {
    const parentPath = userId ? `users/${userId}` : `devices/${getOrCreateDeviceId()}`;
    await deleteDoc(doc(db, `${parentPath}/tasks`, taskId));
  } catch (err) {
    console.warn('Cloud task delete warning:', err);
  }
}

export async function syncSettingsToCloud(userId: string | null, settings: Settings) {
  try {
    const parentPath = userId ? `users/${userId}` : `devices/${getOrCreateDeviceId()}`;
    await setDoc(doc(db, parentPath), { settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Cloud settings sync warning:', err);
  }
}

export async function syncCategoriesToCloud(userId: string | null, categories: Record<string, CategoryMeta>) {
  try {
    const parentPath = userId ? `users/${userId}` : `devices/${getOrCreateDeviceId()}`;
    await setDoc(doc(db, parentPath), { categories, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Cloud categories sync warning:', err);
  }
}

export async function fetchAllTasksFromCloud(userId: string | null): Promise<Task[]> {
  try {
    const parentPath = userId ? `users/${userId}` : `devices/${getOrCreateDeviceId()}`;
    const colRef = collection(db, `${parentPath}/tasks`);
    const snapshot = await getDocs(colRef);
    const cloudTasks: Task[] = [];
    snapshot.forEach((d) => {
      cloudTasks.push(d.data() as Task);
    });
    return cloudTasks;
  } catch (err) {
    console.warn('Error fetching cloud tasks:', err);
    return [];
  }
}
