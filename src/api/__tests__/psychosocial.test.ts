import { describe, it, expect, vi, beforeEach } from 'vitest';
import { psychosocialCasesApi } from '../psychosocial';

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

describe('psychosocialCasesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(psychosocialCasesApi.subscribe).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.create).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.update).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.remove).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.getAll).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(psychosocialCasesApi.open).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.followUp).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.close).toBeInstanceOf(Function);
    expect(psychosocialCasesApi.refer).toBeInstanceOf(Function);
  });

  it('open updates status to Abierto', async () => {
    await psychosocialCasesApi.open('case-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('followUp updates case', async () => {
    await psychosocialCasesApi.followUp('case-1', 'Seguimiento positivo');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('close updates status', async () => {
    await psychosocialCasesApi.close('case-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('refer updates status', async () => {
    await psychosocialCasesApi.refer('case-1', 'Hospital Central');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});
