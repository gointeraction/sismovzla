import { createCrud, CrudApi } from './crud';
import { PsychosocialCase } from '../types';

export const psychosocialCasesApi: CrudApi<PsychosocialCase> & {
  open: (id: string) => Promise<void>;
  followUp: (id: string) => Promise<void>;
  close: (id: string) => Promise<void>;
  refer: (id: string) => Promise<void>;
} = {
  ...createCrud<PsychosocialCase>('psychosocial_cases'),
  open: (id) => psychosocialCasesApi.setStatus(id, 'Abierto'),
  followUp: (id) => psychosocialCasesApi.setStatus(id, 'En Seguimiento'),
  close: (id) => psychosocialCasesApi.setStatus(id, 'Cerrado'),
  refer: (id) => psychosocialCasesApi.setStatus(id, 'Derivado'),
};
