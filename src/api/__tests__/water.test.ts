import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waterPointsApi, sanitationPointsApi } from '../water';

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

describe('waterPointsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(waterPointsApi.subscribe).toBeInstanceOf(Function);
    expect(waterPointsApi.create).toBeInstanceOf(Function);
    expect(waterPointsApi.update).toBeInstanceOf(Function);
    expect(waterPointsApi.remove).toBeInstanceOf(Function);
    expect(waterPointsApi.getAll).toBeInstanceOf(Function);
    expect(waterPointsApi.getById).toBeInstanceOf(Function);
  });

  it('has status methods', () => {
    expect(waterPointsApi.setPotable).toBeInstanceOf(Function);
    expect(waterPointsApi.setNonPotable).toBeInstanceOf(Function);
    expect(waterPointsApi.setTesting).toBeInstanceOf(Function);
    expect(waterPointsApi.setDepleted).toBeInstanceOf(Function);
  });

  it('setPotable updates status', async () => {
    await waterPointsApi.setPotable('water-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('sanitationPointsApi', () => {
  it('has all CRUD methods', () => {
    expect(sanitationPointsApi.subscribe).toBeInstanceOf(Function);
    expect(sanitationPointsApi.create).toBeInstanceOf(Function);
    expect(sanitationPointsApi.update).toBeInstanceOf(Function);
    expect(sanitationPointsApi.remove).toBeInstanceOf(Function);
    expect(sanitationPointsApi.getAll).toBeInstanceOf(Function);
    expect(sanitationPointsApi.getById).toBeInstanceOf(Function);
  });
});
