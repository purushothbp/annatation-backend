import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadDocument } from '../services/documentService';
import { DocumentModel } from '../types';

interface Props {
  onUploaded: (document: DocumentModel) => void;
}

const DocumentUploadForm = ({ onUploaded }: Props) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (document) => {
      setTitle('');
      setFile(null);
      setError(null);
      onUploaded(document);
    },
    onError: (err: Error | any) => {
      setError(err?.response?.data?.message || err.message || 'Upload failed');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError('Please select a PDF file to upload');
      return;
    }
    mutation.mutate({ file, title: title || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '0.75rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>Upload document</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(148, 163, 184, 0.8)' }}>
          PDFs are stored locally on the backend. Text extraction runs asynchronously.
        </p>
      </div>

      <label>
        <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Title</span>
        <input className="input" value={title} placeholder="Optional title" onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label>
        <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>PDF</span>
        <input
          className="input"
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const nextFile = event.target.files?.[0];
            setFile(nextFile ?? null);
          }}
        />
      </label>

      {error ? (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      ) : null}

      <button className="button" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  );
};

export default DocumentUploadForm;
