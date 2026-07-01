import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emergencyCommsApi } from '../comms';

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
}));

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  auth: {
    currentUser: { email: 'test@sismovzla.com', uid: 'test-uid' },
  },
}));

describe('emergencyCommsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(emergencyCommsApi.subscribe).toBeInstanceOf(Function);
    expect(emergencyCommsApi.create).toBeInstanceOf(Function);
    expect(emergencyCommsApi.update).toBeInstanceOf(Function);
    expect(emergencyCommsApi.remove).toBeInstanceOf(Function);
    expect(emergencyCommsApi.getAll).toBeInstanceOf(Function);
    expect(emergencyCommsApi.getById).toBeInstanceOf(Function);
  });

  it('has status methods', () => {
    expect(emergencyCommsApi.setOnline).toBeInstanceOf(Function);
    expect(emergencyCommsApi.setOffline).toBeInstanceOf(Function);
    expect(emergencyCommsApi.setStandby).toBeInstanceOf(Function);
  });

  it('setOnline updates status', async () => {
    await emergencyCommsApi.setOnline('comms-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('setOffline updates status', async () => {
    await emergencyCommsApi.setOffline('comms-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('setStandby updates status', async () => {
    await emergencyCommsApi.setStandby('comms-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});
