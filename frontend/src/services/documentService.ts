import { apiClient } from './apiClient';
import { AnnotationModel, DocumentModel, PaginatedResponse } from '../types';

export const listDocuments = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get<PaginatedResponse<DocumentModel>>('/api/documents', {
    params: { page, limit },
  });
  return data;
};

export const getDocument = async (id: string) => {
  const { data } = await apiClient.get<{ document: DocumentModel }>(`/api/documents/${id}`);
  return data.document;
};

export const uploadDocument = async (payload: { file: File; title?: string }) => {
  const formData = new FormData();
  formData.append('file', payload.file);
  if (payload.title) {
    formData.append('title', payload.title);
  }
  const { data } = await apiClient.post<{ document: DocumentModel }>('/api/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.document;
};

export const getDocumentText = async (id: string) => {
  const response = await apiClient.get<string>(`/api/documents/${id}/text`, {
    responseType: 'text',
    transformResponse: [(data) => data],
    validateStatus: (status) => status === 202 || (status >= 200 && status < 300),
  });

  if (response.status === 202) {
    try {
      const payload = JSON.parse(response.data);
      throw new Error(payload?.message || 'Text extraction pending');
    } catch {
      throw new Error('Text extraction pending');
    }
  }

  return response.data;
};

export const getDocumentTextMetadata = async (id: string) => {
  const { data } = await apiClient.get<{ metadata: unknown }>(`/api/documents/${id}/text-metadata`);
  return data.metadata;
};

export const listAnnotations = async (documentId: string, cursor?: string) => {
  const { data } = await apiClient.get<PaginatedResponse<AnnotationModel>>(
    `/api/documents/${documentId}/annotations`,
    {
      params: { cursor },
    }
  );
  return data;
};
