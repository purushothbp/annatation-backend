export type Role = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentModel {
  _id: string;
  title: string;
  ownerId: string;
  storageLocation: string;
  mimeType: string;
  textLocation?: string;
  textMetadataLocation?: string;
  version: number;
  uploadedAt: string;
  textExtractedAt?: string;
  extractionStatus: 'pending' | 'processing' | 'complete' | 'failed';
  extractionError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TextSelector {
  start: number;
  end: number;
  page?: number;
}

export interface QuoteSelector {
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface AnnotationModel {
  _id: string;
  documentId: string;
  userId: string;
  selector: TextSelector;
  quoteSelector: QuoteSelector;
  body: string;
  orphaned: boolean;
  rangeHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
    cursor?: string | null;
    hasMore?: boolean;
  };
}
