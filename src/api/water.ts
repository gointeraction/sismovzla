import { createCrud, CrudApi } from './crud';
import { WaterPoint, SanitationPoint } from '../types';

export const waterPointsApi: CrudApi<WaterPoint> & {
  setPotable: (id: string) => Promise<void>;
  setNonPotable: (id: string) => Promise<void>;
  setTesting: (id: string) => Promise<void>;
  setDepleted: (id: string) => Promise<void>;
} = {
  ...createCrud<WaterPoint>('water_points'),
  setPotable: (id) => waterPointsApi.setField(id, 'waterStatus', 'Potable'),
  setNonPotable: (id) => waterPointsApi.setField(id, 'waterStatus', 'No Potable'),
  setTesting: (id) => waterPointsApi.setField(id, 'waterStatus', 'En Prueba'),
  setDepleted: (id) => waterPointsApi.setField(id, 'waterStatus', 'Agotado'),
};

export const sanitationPointsApi: CrudApi<SanitationPoint> = createCrud<SanitationPoint>('sanitation_points');
