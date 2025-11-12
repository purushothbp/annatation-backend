import { FormEvent, useEffect, useState } from 'react';

interface Props {
  selection: {
    start: number;
    end: number;
    exact: string;
    prefix: string;
    suffix: string;
  } | null;
  onSubmit: (body: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const AnnotationComposer = ({ selection, onSubmit, onCancel, disabled }: Props) => {
  const [body, setBody] = useState('');

  useEffect(() => {
    if (selection) {
      setBody('');
    }
  }, [selection]);

  if (!selection) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) return;
    onSubmit(body.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ position: 'sticky', top: 0, display: 'grid', gap: '0.75rem', zIndex: 2 }}
    >
      <div>
        <h3 style={{ margin: 0 }}>Add annotation</h3>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.8)' }}>
          “{selection.exact.slice(0, 120)}
          {selection.exact.length > 120 ? '…' : ''}”
        </p>
      </div>

      <textarea
        className="input"
        style={{ minHeight: '6rem', resize: 'vertical' }}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What would you like to say about this selection?"
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button" type="submit" disabled={disabled}>
          {disabled ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default AnnotationComposer;
