import { getDocs, query, collection } from 'firebase/firestore';
import { createCrud, CrudApi } from './crud';
import { FamilyRequest, PersonSearch } from '../types';
import { db } from '../firebase';

export const familyRequestsApi: CrudApi<FamilyRequest> & {
  findMatches: (missingName: string) => Promise<PersonSearch[]>;
  markContacted: (id: string) => Promise<void>;
  markReunified: (id: string) => Promise<void>;
} = {
  ...createCrud<FamilyRequest>('family_requests'),

  findMatches: async (missingName) => {
    const snap = await getDocs(query(collection(db, 'people_search')));
    const term = missingName.toLowerCase();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as PersonSearch))
      .filter(p => p.name.toLowerCase().includes(term) || term.includes(p.name.toLowerCase()));
  },

  markContacted: (id) => familyRequestsApi.setStatus(id, 'En Contacto'),
  markReunified: (id) => familyRequestsApi.setStatus(id, 'Reunificado'),
};

export const peopleSearchApi: CrudApi<PersonSearch> & {
  search: (term: string) => Promise<PersonSearch[]>;
} = {
  ...createCrud<PersonSearch>('people_search'),

  search: async (term) => {
    const snap = await getDocs(query(collection(db, 'people_search')));
    const lower = term.toLowerCase();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as PersonSearch))
      .filter(p => p.name.toLowerCase().includes(lower));
  },
};
