import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  weatherAlertsApi,
  publicAlertsApi,
  aerialOpsApi,
  fuelEnergyApi,
} from '../alerts';

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

describe('weatherAlertsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(weatherAlertsApi.subscribe).toBeInstanceOf(Function);
    expect(weatherAlertsApi.create).toBeInstanceOf(Function);
    expect(weatherAlertsApi.update).toBeInstanceOf(Function);
    expect(weatherAlertsApi.remove).toBeInstanceOf(Function);
    expect(weatherAlertsApi.getAll).toBeInstanceOf(Function);
    expect(weatherAlertsApi.getById).toBeInstanceOf(Function);
  });

  it('has status methods', () => {
    expect(weatherAlertsApi.activate).toBeInstanceOf(Function);
    expect(weatherAlertsApi.deactivate).toBeInstanceOf(Function);
  });

  it('activate updates status', async () => {
    await weatherAlertsApi.activate('alert-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('deactivate updates status', async () => {
    await weatherAlertsApi.deactivate('alert-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('publicAlertsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(publicAlertsApi.subscribe).toBeInstanceOf(Function);
    expect(publicAlertsApi.create).toBeInstanceOf(Function);
    expect(publicAlertsApi.update).toBeInstanceOf(Function);
    expect(publicAlertsApi.remove).toBeInstanceOf(Function);
    expect(publicAlertsApi.getAll).toBeInstanceOf(Function);
    expect(publicAlertsApi.getById).toBeInstanceOf(Function);
  });

  it('has status methods', () => {
    expect(publicAlertsApi.activate).toBeInstanceOf(Function);
    expect(publicAlertsApi.deactivate).toBeInstanceOf(Function);
  });
});

describe('aerialOpsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has all CRUD methods', () => {
    expect(aerialOpsApi.subscribe).toBeInstanceOf(Function);
    expect(aerialOpsApi.create).toBeInstanceOf(Function);
    expect(aerialOpsApi.update).toBeInstanceOf(Function);
    expect(aerialOpsApi.remove).toBeInstanceOf(Function);
    expect(aerialOpsApi.getAll).toBeInstanceOf(Function);
    expect(aerialOpsApi.getById).toBeInstanceOf(Function);
  });

  it('has specialized methods', () => {
    expect(aerialOpsApi.start).toBeInstanceOf(Function);
    expect(aerialOpsApi.complete).toBeInstanceOf(Function);
    expect(aerialOpsApi.land).toBeInstanceOf(Function);
  });

  it('start updates status', async () => {
    await aerialOpsApi.start('ops-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('complete updates status', async () => {
    await aerialOpsApi.complete('ops-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });

  it('land updates status', async () => {
    await aerialOpsApi.land('ops-1');

    const { updateDoc } = await import('firebase/firestore');
    expect(updateDoc).toHaveBeenCalled();
  });
});

describe('fuelEnergyApi', () => {
  it('has all CRUD methods', () => {
    expect(fuelEnergyApi.subscribe).toBeInstanceOf(Function);
    expect(fuelEnergyApi.create).toBeInstanceOf(Function);
    expect(fuelEnergyApi.update).toBeInstanceOf(Function);
    expect(fuelEnergyApi.remove).toBeInstanceOf(Function);
    expect(fuelEnergyApi.getAll).toBeInstanceOf(Function);
    expect(fuelEnergyApi.getById).toBeInstanceOf(Function);
  });
});
