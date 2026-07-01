import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sheltersApi, shelterOccupantsApi, shelterRequestsApi } from '../shelters';

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

describe('sheltersApi', () => {
  it('has all CRUD methods', () => {
    expect(sheltersApi.subscribe).toBeInstanceOf(Function);
    expect(sheltersApi.create).toBeInstanceOf(Function);
    expect(sheltersApi.update).toBeInstanceOf(Function);
    expect(sheltersApi.remove).toBeInstanceOf(Function);
    expect(sheltersApi.getAll).toBeInstanceOf(Function);
    expect(sheltersApi.getById).toBeInstanceOf(Function);
  });

  it('has updateOccupancy method', () => {
    expect(sheltersApi.updateOccupancy).toBeInstanceOf(Function);
  });

  it('updates occupancy by delta', async () => {
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ occupantCount: 10 }),
      id: 'shelter-1',
    } as any);

    await sheltersApi.updateOccupancy('shelter-1', 5);

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('shelterOccupantsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(shelterOccupantsApi.subscribe).toBeInstanceOf(Function);
    expect(shelterOccupantsApi.create).toBeInstanceOf(Function);
    expect(shelterOccupantsApi.update).toBeInstanceOf(Function);
    expect(shelterOccupantsApi.remove).toBeInstanceOf(Function);
    expect(shelterOccupantsApi.getAll).toBeInstanceOf(Function);
    expect(shelterOccupantsApi.getById).toBeInstanceOf(Function);
  });

  it('has checkIn and checkOut methods', () => {
    expect(shelterOccupantsApi.checkIn).toBeInstanceOf(Function);
    expect(shelterOccupantsApi.checkOut).toBeInstanceOf(Function);
  });

  it('checkIn creates occupant and updates shelter', async () => {
    const { getDoc } = await import('firebase/firestore');
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ occupantCount: 10 }),
      id: 'shelter-1',
    } as any);

    await shelterOccupantsApi.checkIn({
      shelterId: 'shelter-1',
      name: 'Juan Pérez',
      idNumber: '12345678',
      status: 'Activo',
    });

    const { addDoc, updateDoc } = await import('firebase/firestore');
    expect(addDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
  });

  it('checkOut updates occupant and shelter', async () => {
    await shelterOccupantsApi.checkOut('occupant-1', 'shelter-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('shelterRequestsApi', () => {
  it('has all CRUD methods', () => {
    expect(shelterRequestsApi.subscribe).toBeInstanceOf(Function);
    expect(shelterRequestsApi.create).toBeInstanceOf(Function);
    expect(shelterRequestsApi.update).toBeInstanceOf(Function);
    expect(shelterRequestsApi.remove).toBeInstanceOf(Function);
    expect(shelterRequestsApi.getAll).toBeInstanceOf(Function);
    expect(shelterRequestsApi.getById).toBeInstanceOf(Function);
  });
});
