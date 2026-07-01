import { addDoc, collection, writeBatch, doc } from 'firebase/firestore';
import { createCrud, CrudApi, currentUser } from './crud';
import { TriagePatient, TriageTeam } from '../types';
import { db } from '../firebase';

export const triagePatientsApi: CrudApi<TriagePatient> & {
  assignStartCode: (vitals: { conscious: boolean; breathing: boolean; ambulatory: boolean; respiratoryRate: number }) => TriagePatient['triageCode'];
  bulkCreate: (patients: Omit<TriagePatient, 'id' | 'createdAt' | 'updatedAt' | 'reportedBy'>[]) => Promise<string[]>;
} = {
  ...createCrud<TriagePatient>('triage_patients'),

  assignStartCode: (vitals) => {
    if (!vitals.conscious || !vitals.breathing) return 'Negro';
    if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 10) return 'Rojo';
    if (!vitals.ambulatory) return 'Rojo';
    return 'Verde';
  },

  bulkCreate: async (patients) => {
    const batch = writeBatch(db);
    const now = Date.now();
    const ids: string[] = [];

    for (let i = 0; i < patients.length; i++) {
      const ref = doc(collection(db, 'triage_patients'));
      batch.set(ref, {
        ...patients[i],
        reportedBy: currentUser(),
        createdAt: now + i,
        updatedAt: now + i,
      });
      ids.push(ref.id);
    }

    await batch.commit();
    return ids;
  },
};

export const triageTeamsApi: CrudApi<TriageTeam> = createCrud<TriageTeam>('triage_teams');
