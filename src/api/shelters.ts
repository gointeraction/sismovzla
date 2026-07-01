import { updateDoc, doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { createCrud, CrudApi } from './crud';
import { Shelter, ShelterOccupant, ShelterRequest } from '../types';
import { db } from '../firebase';

export const sheltersApi: CrudApi<Shelter> & {
  updateOccupancy: (id: string, delta: number) => Promise<void>;
} = {
  ...createCrud<Shelter>('shelters'),

  updateOccupancy: async (id, delta) => {
    const snap = await getDoc(doc(db, 'shelters', id));
    if (!snap.exists()) return;
    const current = snap.data().occupantCount || 0;
    await updateDoc(doc(db, 'shelters', id), {
      occupantCount: Math.max(0, current + delta),
      updatedAt: Date.now(),
    });
  },
};

export const shelterOccupantsApi: CrudApi<ShelterOccupant> & {
  checkIn: (data: Omit<ShelterOccupant, 'id' | 'createdAt'>) => Promise<string>;
  checkOut: (id: string, shelterId: string) => Promise<void>;
} = {
  ...createCrud<ShelterOccupant>('shelter_occupants'),

  checkIn: async (data) => {
    const ref = await addDoc(collection(db, 'shelter_occupants'), {
      ...data,
      status: 'Albergado',
      createdAt: Date.now(),
    });
    await sheltersApi.updateOccupancy(data.shelterId, +1);
    return ref.id;
  },

  checkOut: async (id, shelterId) => {
    await updateDoc(doc(db, 'shelter_occupants', id), {
      status: 'Salida',
      exitDate: Date.now(),
    });
    await sheltersApi.updateOccupancy(shelterId, -1);
  },
};

export const shelterRequestsApi: CrudApi<ShelterRequest> = createCrud<ShelterRequest>('shelter_requests');
