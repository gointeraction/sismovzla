import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cascadeEventsApi,
  searchSectorsApi,
  rescueTeamsApi,
  evacuationRoutesApi,
  interagencyTasksApi,
} from '../eoc';

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

describe('cascadeEventsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(cascadeEventsApi.subscribe).toBeInstanceOf(Function);
    expect(cascadeEventsApi.create).toBeInstanceOf(Function);
    expect(cascadeEventsApi.update).toBeInstanceOf(Function);
    expect(cascadeEventsApi.remove).toBeInstanceOf(Function);
    expect(cascadeEventsApi.getAll).toBeInstanceOf(Function);
    expect(cascadeEventsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(cascadeEventsApi.contain).toBeInstanceOf(Function);
    expect(cascadeEventsApi.resolve).toBeInstanceOf(Function);
    expect(cascadeEventsApi.monitor).toBeInstanceOf(Function);
  });

  it('contain updates status', async () => {
    await cascadeEventsApi.contain('event-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('resolve updates status', async () => {
    await cascadeEventsApi.resolve('event-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('monitor updates status', async () => {
    await cascadeEventsApi.monitor('event-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('searchSectorsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(searchSectorsApi.subscribe).toBeInstanceOf(Function);
    expect(searchSectorsApi.create).toBeInstanceOf(Function);
    expect(searchSectorsApi.update).toBeInstanceOf(Function);
    expect(searchSectorsApi.remove).toBeInstanceOf(Function);
    expect(searchSectorsApi.getAll).toBeInstanceOf(Function);
    expect(searchSectorsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(searchSectorsApi.start).toBeInstanceOf(Function);
    expect(searchSectorsApi.complete).toBeInstanceOf(Function);
    expect(searchSectorsApi.verify).toBeInstanceOf(Function);
  });

  it('start updates status', async () => {
    await searchSectorsApi.start('sector-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('complete updates status', async () => {
    await searchSectorsApi.complete('sector-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('verify updates status', async () => {
    await searchSectorsApi.verify('sector-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('rescueTeamsApi', () => {
  it('has all CRUD methods', () => {
    expect(rescueTeamsApi.subscribe).toBeInstanceOf(Function);
    expect(rescueTeamsApi.create).toBeInstanceOf(Function);
    expect(rescueTeamsApi.update).toBeInstanceOf(Function);
    expect(rescueTeamsApi.remove).toBeInstanceOf(Function);
    expect(rescueTeamsApi.getAll).toBeInstanceOf(Function);
    expect(rescueTeamsApi.getById).toBeInstanceOf(Function);
  });
});

describe('evacuationRoutesApi', () => {
  it('has all CRUD methods', () => {
    expect(evacuationRoutesApi.subscribe).toBeInstanceOf(Function);
    expect(evacuationRoutesApi.create).toBeInstanceOf(Function);
    expect(evacuationRoutesApi.update).toBeInstanceOf(Function);
    expect(evacuationRoutesApi.remove).toBeInstanceOf(Function);
    expect(evacuationRoutesApi.getAll).toBeInstanceOf(Function);
    expect(evacuationRoutesApi.getById).toBeInstanceOf(Function);
  });
});

describe('interagencyTasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(interagencyTasksApi.subscribe).toBeInstanceOf(Function);
    expect(interagencyTasksApi.create).toBeInstanceOf(Function);
    expect(interagencyTasksApi.update).toBeInstanceOf(Function);
    expect(interagencyTasksApi.remove).toBeInstanceOf(Function);
    expect(interagencyTasksApi.getAll).toBeInstanceOf(Function);
    expect(interagencyTasksApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(interagencyTasksApi.complete).toBeInstanceOf(Function);
    expect(interagencyTasksApi.block).toBeInstanceOf(Function);
  });

  it('complete updates status', async () => {
    await interagencyTasksApi.complete('task-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('block updates status', async () => {
    await interagencyTasksApi.block('task-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});
