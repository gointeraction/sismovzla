import { createCrud, CrudApi } from './crud';
import { CascadeEvent, SearchSector, RescueTeam, EvacuationRoute, InteragencyTask } from '../types';

export const cascadeEventsApi: CrudApi<CascadeEvent> & {
  contain: (id: string) => Promise<void>;
  resolve: (id: string) => Promise<void>;
  monitor: (id: string) => Promise<void>;
} = {
  ...createCrud<CascadeEvent>('cascade_events'),
  contain: (id) => cascadeEventsApi.setStatus(id, 'Contenido'),
  resolve: (id) => cascadeEventsApi.setStatus(id, 'Resuelto'),
  monitor: (id) => cascadeEventsApi.setStatus(id, 'Monitoreando'),
};

export const searchSectorsApi: CrudApi<SearchSector> & {
  start: (id: string) => Promise<void>;
  complete: (id: string) => Promise<void>;
  verify: (id: string) => Promise<void>;
} = {
  ...createCrud<SearchSector>('search_sectors'),
  start: (id) => searchSectorsApi.setStatus(id, 'En Progreso'),
  complete: (id) => searchSectorsApi.setStatus(id, 'Completado'),
  verify: (id) => searchSectorsApi.setStatus(id, 'Verificado'),
};

export const rescueTeamsApi: CrudApi<RescueTeam> = createCrud<RescueTeam>('rescue_teams');
export const evacuationRoutesApi: CrudApi<EvacuationRoute> = createCrud<EvacuationRoute>('evacuation_routes');

export const interagencyTasksApi: CrudApi<InteragencyTask> & {
  complete: (id: string) => Promise<void>;
  block: (id: string) => Promise<void>;
} = {
  ...createCrud<InteragencyTask>('interagency_tasks'),
  complete: (id) => interagencyTasksApi.setStatus(id, 'Completada'),
  block: (id) => interagencyTasksApi.setStatus(id, 'Bloqueada'),
};
