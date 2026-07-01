import { describe, it, expect, vi, beforeEach } from 'vitest';
import { familyRequestsApi, peopleSearchApi } from '../family';

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

describe('familyRequestsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(familyRequestsApi.subscribe).toBeInstanceOf(Function);
    expect(familyRequestsApi.create).toBeInstanceOf(Function);
    expect(familyRequestsApi.update).toBeInstanceOf(Function);
    expect(familyRequestsApi.remove).toBeInstanceOf(Function);
    expect(familyRequestsApi.getAll).toBeInstanceOf(Function);
    expect(familyRequestsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(familyRequestsApi.findMatches).toBeInstanceOf(Function);
    expect(familyRequestsApi.markContacted).toBeInstanceOf(Function);
    expect(familyRequestsApi.markReunified).toBeInstanceOf(Function);
  });

  it('findMatches queries people_search', async () => {
    const { getDocs } = await import('firebase/firestore');
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);

    await familyRequestsApi.findMatches('Juan Pérez');

    expect(getDocs).toHaveBeenCalled();
  });

  it('markContacted updates status', async () => {
    await familyRequestsApi.markContacted('request-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('markReunified updates status', async () => {
    await familyRequestsApi.markReunified('request-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('peopleSearchApi', () => {
  it('has all CRUD methods', () => {
    expect(peopleSearchApi.subscribe).toBeInstanceOf(Function);
    expect(peopleSearchApi.create).toBeInstanceOf(Function);
    expect(peopleSearchApi.update).toBeInstanceOf(Function);
    expect(peopleSearchApi.remove).toBeInstanceOf(Function);
    expect(peopleSearchApi.getAll).toBeInstanceOf(Function);
    expect(peopleSearchApi.getById).toBeInstanceOf(Function);
  });

  it('has search method', () => {
    expect(peopleSearchApi.search).toBeInstanceOf(Function);
  });
});
