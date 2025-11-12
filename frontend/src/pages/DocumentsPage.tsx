import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DocumentUploadForm from '../components/DocumentUploadForm';
import { listDocuments } from '../services/documentService';
import { DocumentModel } from '../types';

const statusColors: Record<DocumentModel['extractionStatus'], string> = {
  pending: '#fbbf24',
  processing: '#38bdf8',
  complete: '#34d399',
  failed: '#f87171',
};

const DocumentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: () => listDocuments(),
  });

  const documents = data?.data ?? [];

  const handleUploaded = (document: DocumentModel) => {
    queryClient.setQueryData(['documents'], (prev: any) => {
      if (!prev) return { data: [document], pagination: { total: 1 } };
      return { ...prev, data: [document, ...prev.data] };
    });
  };

  return (
    <div style={{ width: '100%', display: 'grid', gap: '1.5rem' }}>
      <DocumentUploadForm
        onUploaded={(doc) => {
          handleUploaded(doc);
          setTimeout(() => refetch(), 1000);
        }}
      />

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Your documents</h2>
          <button className="button secondary" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p>Loading documents…</p>
        ) : documents.length === 0 ? (
          <p style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Upload a PDF to get started.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {documents.map((doc) => (
              <div
                key={doc._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{doc.title}</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'rgba(148, 163, 184, 0.8)' }}>
                    Uploaded {new Date(doc.createdAt).toLocaleString()}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span
                      className="tag"
                      style={{
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        color: statusColors[doc.extractionStatus],
                      }}
                    >
                      ● {doc.extractionStatus}
                    </span>
                    {doc.extractionError ? (
                      <span style={{ fontSize: '0.85rem', color: '#f87171' }}>{doc.extractionError}</span>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <a
                    className="button secondary"
                    href={`/files/${doc.storageLocation}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View PDF
                  </a>
                  <button className="button" onClick={() => navigate(`/documents/${doc._id}`)}>
                    Annotate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DocumentsPage;
