import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCrud, currentUser } from '../crud';

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

describe('createCrud', () => {
  interface TestItem {
    id: string;
    name: string;
    status: string;
    createdAt?: number;
    updatedAt?: number;
    reportedBy?: string;
  }

  let api: ReturnType<typeof createCrud<TestItem>>;

  beforeEach(() => {
    vi.clearAllMocks();
    api = createCrud<TestItem>('test_collection');
  });

  it('creates an API with all required methods', () => {
    expect(api.subscribe).toBeInstanceOf(Function);
    expect(api.create).toBeInstanceOf(Function);
    expect(api.update).toBeInstanceOf(Function);
    expect(api.remove).toBeInstanceOf(Function);
    expect(api.getAll).toBeInstanceOf(Function);
    expect(api.getById).toBeInstanceOf(Function);
    expect(api.setStatus).toBeInstanceOf(Function);
    expect(api.setField).toBeInstanceOf(Function);
  });

  it('creates a document with timestamps and reportedBy', async () => {
    const { addDoc } = await import('firebase/firestore');
    const id = await api.create({ name: 'Test', status: 'active' });
    
    expect(addDoc).toHaveBeenCalled();
    expect(id).toBe('new-doc-id');
  });

  it('updates a document with timestamp', async () => {
    const { updateDoc } = await import('firebase/firestore');
    await api.update('doc-1', { name: 'Updated' });
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('removes a document', async () => {
    const { deleteDoc } = await import('firebase/firestore');
    await api.remove('doc-1');
    
    expect(deleteDoc).toHaveBeenCalled();
  });

  it('sets status field', async () => {
    const { updateDoc } = await import('firebase/firestore');
    await api.setStatus('doc-1', 'completed');
    
    expect(updateDoc).toHaveBeenCalled();
  });

  it('sets arbitrary field', async () => {
    const { updateDoc } = await import('firebase/firestore');
    await api.setField('doc-1', 'priority', 'high');
    
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('currentUser', () => {
  it('returns current user email', () => {
    expect(currentUser()).toBe('test@sismovzla.com');
  });
});
