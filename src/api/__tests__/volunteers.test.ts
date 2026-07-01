import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  volunteerRegistryApi,
  volunteerShiftsApi,
  donationsApi,
} from '../volunteers';

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

describe('volunteerRegistryApi', () => {
  it('has all CRUD methods', () => {
    expect(volunteerRegistryApi.subscribe).toBeInstanceOf(Function);
    expect(volunteerRegistryApi.create).toBeInstanceOf(Function);
    expect(volunteerRegistryApi.update).toBeInstanceOf(Function);
    expect(volunteerRegistryApi.remove).toBeInstanceOf(Function);
    expect(volunteerRegistryApi.getAll).toBeInstanceOf(Function);
    expect(volunteerRegistryApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(volunteerRegistryApi.updateStatus).toBeInstanceOf(Function);
    expect(volunteerRegistryApi.assignShift).toBeInstanceOf(Function);
  });
});

describe('volunteerShiftsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(volunteerShiftsApi.subscribe).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.create).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.update).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.remove).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.getAll).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(volunteerShiftsApi.startShift).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.completeShift).toBeInstanceOf(Function);
    expect(volunteerShiftsApi.cancelShift).toBeInstanceOf(Function);
  });

  it('startShift updates status', async () => {
    await volunteerShiftsApi.startShift('shift-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('completeShift updates status', async () => {
    await volunteerShiftsApi.completeShift('shift-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('cancelShift updates status', async () => {
    await volunteerShiftsApi.cancelShift('shift-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('donationsApi', () => {
  it('has all CRUD methods', () => {
    expect(donationsApi.subscribe).toBeInstanceOf(Function);
    expect(donationsApi.create).toBeInstanceOf(Function);
    expect(donationsApi.update).toBeInstanceOf(Function);
    expect(donationsApi.remove).toBeInstanceOf(Function);
    expect(donationsApi.getAll).toBeInstanceOf(Function);
    expect(donationsApi.getById).toBeInstanceOf(Function);
  });
});
