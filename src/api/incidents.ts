import { updateDoc, doc, addDoc, collection, writeBatch } from 'firebase/firestore';
import { createCrud, CrudApi, currentUser } from './crud';
import { Incident } from '../types';
import { db } from '../firebase';

export const incidentsApi: CrudApi<Incident> & {
  verify: (id: string) => Promise<void>;
  resolve: (id: string) => Promise<void>;
  queueOffline: (data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  syncOfflineQueue: () => Promise<{ synced: number; failed: number }>;
} = {
  ...createCrud<Incident>('incidents'),
  verify: (id) => updateDoc(doc(db, 'incidents', id), { verified: true, updatedAt: Date.now() }),
  resolve: (id) => updateDoc(doc(db, 'incidents', id), { resolved: true, updatedAt: Date.now() }),

  queueOffline: (data) => {
    const queue = JSON.parse(localStorage.getItem('sismovzla_offline_incidents') || '[]');
    queue.push({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
    localStorage.setItem('sismovzla_offline_incidents', JSON.stringify(queue));
  },

  syncOfflineQueue: async () => {
    const queue: Array<Record<string, unknown>> = JSON.parse(localStorage.getItem('sismovzla_offline_incidents') || '[]');
    if (queue.length === 0) return { synced: 0, failed: 0 };

    const batch = writeBatch(db);
    const failed: Array<Record<string, unknown>> = [];
    let synced = 0;

    for (const report of queue) {
      try {
        batch.set(doc(collection(db, 'incidents')), { ...report, reportedBy: currentUser() });
        synced++;
      } catch (e) {
        failed.push(report);
      }
    }

    if (synced > 0) await batch.commit();
    localStorage.setItem('sismovzla_offline_incidents', JSON.stringify(failed));
    return { synced, failed: failed.length };
  },
};
