import { createCrud, CrudApi } from './crud';
import { WeatherAlert, PublicAlert, AerialOperation, FuelEnergyPoint } from '../types';

export const weatherAlertsApi: CrudApi<WeatherAlert> & {
  activate: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
} = {
  ...createCrud<WeatherAlert>('weather_alerts'),
  activate: (id) => weatherAlertsApi.setField(id, 'active', true),
  deactivate: (id) => weatherAlertsApi.setField(id, 'active', false),
};

export const publicAlertsApi: CrudApi<PublicAlert> & {
  activate: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
} = {
  ...createCrud<PublicAlert>('public_alerts'),
  activate: (id) => publicAlertsApi.setField(id, 'active', true),
  deactivate: (id) => publicAlertsApi.setField(id, 'active', false),
};

export const aerialOpsApi: CrudApi<AerialOperation> & {
  start: (id: string) => Promise<void>;
  complete: (id: string) => Promise<void>;
  land: (id: string) => Promise<void>;
} = {
  ...createCrud<AerialOperation>('aerial_operations'),
  start: (id) => aerialOpsApi.setStatus(id, 'En Vuelo'),
  complete: (id) => aerialOpsApi.setStatus(id, 'Completado'),
  land: (id) => aerialOpsApi.setStatus(id, 'En Tierra'),
};

export const fuelEnergyApi: CrudApi<FuelEnergyPoint> = createCrud<FuelEnergyPoint>('fuel_energy_points');
