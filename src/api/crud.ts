import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, limit as firestoreLimit, getDocs, getDoc, where,
  Unsubscribe, QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface CrudOptions {
  orderByField?: string;
  limitCount?: number;
  constraints?: QueryConstraint[];
}

export interface CrudApi<T extends { id: string }> {
  subscribe: (callback: (items: T[]) => void, opts?: CrudOptions) => Unsubscribe;
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getAll: (opts?: CrudOptions) => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  setStatus: (id: string, status: string) => Promise<void>;
  setField: (id: string, field: string, value: unknown) => Promise<void>;
}

function buildQuery(colRef: ReturnType<typeof collection>, opts?: CrudOptions) {
  const constraints: QueryConstraint[] = [
    orderBy(opts?.orderByField || 'createdAt', 'desc'),
    firestoreLimit(opts?.limitCount || 500),
    ...(opts?.constraints || []),
  ];
  return query(colRef, ...constraints);
}

export function createCrud<T extends { id: string }>(collectionName: string): CrudApi<T> {
  const colRef = collection(db, collectionName);

  return {
    subscribe: (callback, opts) => {
      return onSnapshot(buildQuery(colRef, opts), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as T)));
      });
    },

    create: async (data) => {
      const now = Date.now();
      const docRef = await addDoc(colRef, {
        ...data,
        reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon',
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    },

    update: async (id, data) => {
      await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: Date.now() });
    },

    remove: async (id) => {
      await deleteDoc(doc(db, collectionName, id));
    },

    getAll: async (opts) => {
      const snap = await getDocs(buildQuery(colRef, opts));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    },

    getById: async (id) => {
      const snap = await getDoc(doc(db, collectionName, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as T;
    },

    setStatus: async (id, status) => {
      await updateDoc(doc(db, collectionName, id), { status, updatedAt: Date.now() });
    },

    setField: async (id, field, value) => {
      await updateDoc(doc(db, collectionName, id), { [field]: value, updatedAt: Date.now() });
    },
  };
}

export function currentUser(): string {
  return auth.currentUser?.email || auth.currentUser?.uid || 'Anon';
}
