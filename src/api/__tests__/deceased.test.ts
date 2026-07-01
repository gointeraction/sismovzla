import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deceasedPersonsApi } from '../deceased';

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

describe('deceasedPersonsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(deceasedPersonsApi.subscribe).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.create).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.update).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.remove).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.getAll).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(deceasedPersonsApi.moveToMorgue).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.identify).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.deliverToFamily).toBeInstanceOf(Function);
    expect(deceasedPersonsApi.bury).toBeInstanceOf(Function);
  });

  it('moveToMorgue updates status', async () => {
    await deceasedPersonsApi.moveToMorgue('deceased-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('identify updates identification', async () => {
    await deceasedPersonsApi.identify('deceased-1', 'Juan Pérez', 'V-12345678');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('deliverToFamily updates status', async () => {
    await deceasedPersonsApi.deliverToFamily('deceased-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('bury updates status', async () => {
    await deceasedPersonsApi.bury('deceased-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});
