import { createCrud, CrudApi } from './crud';
import { VolunteerRegistry, VolunteerShift, Donation } from '../types';

export const volunteerRegistryApi: CrudApi<VolunteerRegistry> & {
  assignShift: (id: string, shiftId: string) => Promise<void>;
  updateStatus: (id: string, status: VolunteerRegistry['status']) => Promise<void>;
} = {
  ...createCrud<VolunteerRegistry>('volunteers_registry'),
  assignShift: (id, shiftId) => volunteerRegistryApi.update(id, { assignedShift: shiftId }),
  updateStatus: (id, status) => volunteerRegistryApi.update(id, { status }),
};

export const volunteerShiftsApi: CrudApi<VolunteerShift> & {
  startShift: (id: string) => Promise<void>;
  completeShift: (id: string) => Promise<void>;
  cancelShift: (id: string) => Promise<void>;
} = {
  ...createCrud<VolunteerShift>('volunteer_shifts'),
  startShift: (id) => volunteerShiftsApi.setStatus(id, 'En Curso'),
  completeShift: (id) => volunteerShiftsApi.setStatus(id, 'Completado'),
  cancelShift: (id) => volunteerShiftsApi.setStatus(id, 'Cancelado'),
};

export const donationsApi: CrudApi<Donation> = createCrud<Donation>('donations');
