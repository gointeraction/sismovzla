import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incidentsApi } from '../incidents';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  where: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  auth: {
    currentUser: { email: 'test@sismovzla.com', uid: 'test-uid' },
  },
}));

describe('incidentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('has all CRUD methods', () => {
    expect(incidentsApi.subscribe).toBeInstanceOf(Function);
    expect(incidentsApi.create).toBeInstanceOf(Function);
    expect(incidentsApi.update).toBeInstanceOf(Function);
    expect(incidentsApi.remove).toBeInstanceOf(Function);
    expect(incidentsApi.getAll).toBeInstanceOf(Function);
    expect(incidentsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(incidentsApi.verify).toBeInstanceOf(Function);
    expect(incidentsApi.resolve).toBeInstanceOf(Function);
    expect(incidentsApi.queueOffline).toBeInstanceOf(Function);
    expect(incidentsApi.syncOfflineQueue).toBeInstanceOf(Function);
  });

  it('queues incident offline', () => {
    const incident = {
      type: 'Terremoto',
      severity: 'Alta',
      location: 'Caracas',
      description: 'Test',
      status: 'Pendiente',
    };

    incidentsApi.queueOffline(incident);

    const queue = JSON.parse(localStorage.getItem('sismovzla_offline_incidents') || '[]');
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('Terremoto');
  });

  it('syncs offline queue', async () => {
    const incident = {
      type: 'Terremoto',
      severity: 'Alta',
      location: 'Caracas',
      description: 'Test',
      status: 'Pendiente',
    };

    incidentsApi.queueOffline(incident);
    const result = await incidentsApi.syncOfflineQueue();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('returns 0 synced when queue is empty', async () => {
    const result = await incidentsApi.syncOfflineQueue();
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
  });
});
