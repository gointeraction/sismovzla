import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triagePatientsApi, triageTeamsApi } from '../triage';

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

describe('triagePatientsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(triagePatientsApi.subscribe).toBeInstanceOf(Function);
    expect(triagePatientsApi.create).toBeInstanceOf(Function);
    expect(triagePatientsApi.update).toBeInstanceOf(Function);
    expect(triagePatientsApi.remove).toBeInstanceOf(Function);
    expect(triagePatientsApi.getAll).toBeInstanceOf(Function);
    expect(triagePatientsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(triagePatientsApi.assignStartCode).toBeInstanceOf(Function);
    expect(triagePatientsApi.bulkCreate).toBeInstanceOf(Function);
  });

  describe('assignStartCode', () => {
    it('returns Negro when not conscious', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: false,
        breathing: true,
        ambulatory: true,
        respiratoryRate: 18,
      });
      expect(result).toBe('Negro');
    });

    it('returns Negro when not breathing', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: true,
        breathing: false,
        ambulatory: true,
        respiratoryRate: 18,
      });
      expect(result).toBe('Negro');
    });

    it('returns Negro when neither conscious nor breathing', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: false,
        breathing: false,
        ambulatory: true,
        respiratoryRate: 18,
      });
      expect(result).toBe('Negro');
    });

    it('returns Rojo when respiratory rate > 30', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: true,
        breathing: true,
        ambulatory: true,
        respiratoryRate: 35,
      });
      expect(result).toBe('Rojo');
    });

    it('returns Rojo when respiratory rate < 10', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: true,
        breathing: true,
        ambulatory: true,
        respiratoryRate: 8,
      });
      expect(result).toBe('Rojo');
    });

    it('returns Rojo when not ambulatory', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: true,
        breathing: true,
        ambulatory: false,
        respiratoryRate: 18,
      });
      expect(result).toBe('Rojo');
    });

    it('returns Verde for stable patient', () => {
      const result = triagePatientsApi.assignStartCode({
        conscious: true,
        breathing: true,
        ambulatory: true,
        respiratoryRate: 18,
      });
      expect(result).toBe('Verde');
    });
  });
});

describe('triageTeamsApi', () => {
  it('has all CRUD methods', () => {
    expect(triageTeamsApi.subscribe).toBeInstanceOf(Function);
    expect(triageTeamsApi.create).toBeInstanceOf(Function);
    expect(triageTeamsApi.update).toBeInstanceOf(Function);
    expect(triageTeamsApi.remove).toBeInstanceOf(Function);
    expect(triageTeamsApi.getAll).toBeInstanceOf(Function);
    expect(triageTeamsApi.getById).toBeInstanceOf(Function);
  });
});
