import { api } from '../services/api';
import type { ApiResponse } from '../types/api.types';
import type { TypeMachine } from '../types/maintenance.types';

export interface CreateTypeMachineDto {
  Type_machine: string;
}

export interface UpdateTypeMachineDto extends CreateTypeMachineDto {}

export const typesMachineApi = {
  getList: () =>
    api.get<ApiResponse<TypeMachine[]>>('/types-machine'),

  create: (payload: CreateTypeMachineDto) =>
    api.post<ApiResponse<TypeMachine>>('/types-machine', payload),

  update: (id: number, payload: UpdateTypeMachineDto) =>
    api.put<ApiResponse<TypeMachine>>(`/types-machine/${id}`, payload),

  delete: (id: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/types-machine/${id}`),

  exportXlsx: () =>
    api.get<Blob>('/types-machine/export/xlsx', {
      responseType: 'blob'
    } as any),

  getTemplateImport: () =>
    api.get<Blob>('/import/template/types-machine', {
      responseType: 'blob'
    } as any),

  importTypesMachine: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/import/types-machine', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default typesMachineApi;
