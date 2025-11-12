import { apiClient } from './apiClient';
import { AnnotationModel, QuoteSelector, TextSelector } from '../types';

export const createAnnotation = async (payload: {
  documentId: string;
  selector: TextSelector;
  quoteSelector: QuoteSelector;
  body: string;
  orphaned?: boolean;
}) => {
  const { data } = await apiClient.post<{ annotation: AnnotationModel }>('/api/annotations', payload);
  return data.annotation;
};

export const updateAnnotation = async (
  id: string,
  payload: Partial<Pick<AnnotationModel, 'body' | 'selector' | 'quoteSelector' | 'orphaned'>>
) => {
  const { data } = await apiClient.patch<{ annotation: AnnotationModel }>(`/api/annotations/${id}`, payload);
  return data.annotation;
};

export const deleteAnnotation = async (id: string) => {
  await apiClient.delete(`/api/annotations/${id}`);
};
