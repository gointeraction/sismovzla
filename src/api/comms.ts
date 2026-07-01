import { createCrud, CrudApi } from './crud';
import { EmergencyComm } from '../types';

export const emergencyCommsApi: CrudApi<EmergencyComm> & {
  setOnline: (id: string) => Promise<void>;
  setOffline: (id: string) => Promise<void>;
  setStandby: (id: string) => Promise<void>;
} = {
  ...createCrud<EmergencyComm>('emergency_comms'),
  setOnline: (id) => emergencyCommsApi.setStatus(id, 'Activo'),
  setOffline: (id) => emergencyCommsApi.setStatus(id, 'Fuera de Servicio'),
  setStandby: (id) => emergencyCommsApi.setStatus(id, 'Standby'),
};
