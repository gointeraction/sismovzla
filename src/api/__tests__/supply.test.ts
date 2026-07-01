import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supplyInventoryApi, supplyRequestsApi } from '../supply';

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

describe('supplyInventoryApi', () => {
  it('has all CRUD methods', () => {
    expect(supplyInventoryApi.subscribe).toBeInstanceOf(Function);
    expect(supplyInventoryApi.create).toBeInstanceOf(Function);
    expect(supplyInventoryApi.update).toBeInstanceOf(Function);
    expect(supplyInventoryApi.remove).toBeInstanceOf(Function);
    expect(supplyInventoryApi.getAll).toBeInstanceOf(Function);
    expect(supplyInventoryApi.getById).toBeInstanceOf(Function);
  });
});

describe('supplyRequestsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(supplyRequestsApi.subscribe).toBeInstanceOf(Function);
    expect(supplyRequestsApi.create).toBeInstanceOf(Function);
    expect(supplyRequestsApi.update).toBeInstanceOf(Function);
    expect(supplyRequestsApi.remove).toBeInstanceOf(Function);
    expect(supplyRequestsApi.getAll).toBeInstanceOf(Function);
    expect(supplyRequestsApi.getById).toBeInstanceOf(Function);
  });

  it('has deliver method', () => {
    expect(supplyRequestsApi.deliver).toBeInstanceOf(Function);
  });

  it('delivers request with batch', async () => {
    const items = [
      { itemName: 'Agua', quantityRequested: 10 },
      { itemName: 'Medicinas', quantityRequested: 5 },
    ];

    await supplyRequestsApi.deliver('request-1', items);

    const { writeBatch } = await import('firebase/firestore');
    expect(writeBatch).toHaveBeenCalled();
  });
});
