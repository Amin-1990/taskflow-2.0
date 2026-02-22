import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type { DefautParTypeMachine } from '../types/maintenance.types';

export interface DefautTypeMachine extends DefautParTypeMachine {
  Type_machine?: string;
}

export interface CreateDefautTypeMachineDto {
  ID_Type_machine: number;
  Code_defaut: string;
  Nom_defaut: string;
  Description_defaut?: string | null;
}

export interface UpdateDefautTypeMachineDto {
  Code_defaut: string;
  Nom_defaut: string;
  Description_defaut?: string | null;
}

export const defautsTypeMachineApi = {
  getList: () =>
    api.get<ApiResponse<DefautTypeMachine[]>>('/defauts-type-machine'),

  create: (payload: CreateDefautTypeMachineDto) =>
    api.post<ApiResponse<DefautTypeMachine>>('/defauts-type-machine', payload),

  update: (id: number, payload: UpdateDefautTypeMachineDto) =>
    api.put<ApiResponse<DefautTypeMachine>>(`/defauts-type-machine/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/defauts-type-machine/${id}`),

  exportXlsx: () =>
    api.get<Blob>('/defauts-type-machine/export/xlsx', {
      responseType: 'blob'
    } as any),

  getTemplateImport: () =>
    api.get<Blob>('/import/template/defauts-type-machine', {
      responseType: 'blob'
    } as any),

  importDefautsTypeMachine: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/defauts-type-machine', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default defautsTypeMachineApi;
