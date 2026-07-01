import { createCrud, CrudApi } from './crud';
import { DeceasedPerson } from '../types';

export const deceasedPersonsApi: CrudApi<DeceasedPerson> & {
  moveToMorgue: (id: string) => Promise<void>;
  identify: (id: string) => Promise<void>;
  deliverToFamily: (id: string) => Promise<void>;
  bury: (id: string) => Promise<void>;
} = {
  ...createCrud<DeceasedPerson>('deceased_persons'),
  moveToMorgue: (id) => deceasedPersonsApi.setStatus(id, 'En Morgue'),
  identify: (id) => deceasedPersonsApi.update(id, { status: 'Identificado', identified: true }),
  deliverToFamily: (id) => deceasedPersonsApi.update(id, { status: 'Entregado a Familiares', familyNotified: true }),
  bury: (id) => deceasedPersonsApi.setStatus(id, 'Sepultado'),
};
