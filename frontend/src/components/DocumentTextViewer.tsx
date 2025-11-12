import { useMemo, useRef } from 'react';
import { AnnotationModel } from '../types';
import { getUserColor, buildGradient } from '../utils/color';
import { getSelectionOffsets } from '../utils/selection';

interface Props {
  text: string;
  annotations: AnnotationModel[];
  onSelection: (payload: {
    start: number;
    end: number;
    exact: string;
    prefix: string;
    suffix: string;
  }) => void;
  activeAnnotationId?: string;
  isLoading?: boolean;
  statusMessage?: string;
}

interface Segment {
  start: number;
  end: number;
  annotations: AnnotationModel[];
}

const buildSegments = (text: string, annotations: AnnotationModel[]): Segment[] => {
  if (!text) return [];
  if (annotations.length === 0) {
    return [{ start: 0, end: text.length, annotations: [] }];
  }

  const events: Array<{ offset: number; type: 'start' | 'end'; annotation: AnnotationModel }> = [];
  annotations.forEach((annotation) => {
    events.push({ offset: annotation.selector.start, type: 'start', annotation });
    events.push({ offset: annotation.selector.end, type: 'end', annotation });
  });

  events.sort((a, b) => {
    if (a.offset === b.offset) {
      if (a.type === b.type) return 0;
      return a.type === 'start' ? -1 : 1;
    }
    return a.offset - b.offset;
  });

  const segments: Segment[] = [];
  const active = new Set<AnnotationModel>();
  let pointer = 0;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (event.offset > pointer) {
      segments.push({
        start: pointer,
        end: event.offset,
        annotations: Array.from(active),
      });
      pointer = event.offset;
    }

    if (event.type === 'start') {
      active.add(event.annotation);
    } else {
      active.delete(event.annotation);
    }
  }

  if (pointer < text.length) {
    segments.push({
      start: pointer,
      end: text.length,
      annotations: Array.from(active),
    });
  }

  return segments;
};

const DocumentTextViewer = ({ text, annotations, onSelection, activeAnnotationId, isLoading, statusMessage }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);

  const handleMouseUp = () => {
    if (!containerRef.current) return;
    const selection = getSelectionOffsets(containerRef.current, text);
    if (!selection || selection.exact.trim().length === 0) return;
    onSelection(selection);
    const windowSelection = window.getSelection();
    windowSelection?.removeAllRanges();
  };

  return (
    <div
      className="card"
      style={{
        flex: 2,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 180px)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Document text</h2>
      {statusMessage ? (
        <div
          style={{
            marginBottom: '0.75rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#bae6fd',
            fontSize: '0.9rem',
          }}
        >
          {statusMessage}
        </div>
      ) : null}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        style={{
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
          fontFamily: 'Menlo, Consolas, monospace',
          fontSize: '0.95rem',
          cursor: 'text',
        }}
      >
        {isLoading && !text ? (
          <p style={{ color: 'rgba(148, 163, 184, 0.8)' }}>Waiting for text extraction…</p>
        ) : null}
        {segments.map((segment) => {
          const key = `${segment.start}-${segment.end}`;
          if (segment.annotations.length === 0) {
            return text.slice(segment.start, segment.end);
          }

          const colors = segment.annotations.map((annotation) => getUserColor(annotation.userId));
          const active = segment.annotations.some((annotation) => annotation._id === activeAnnotationId);
          return (
            <span
              key={key}
              style={{
                background: buildGradient(colors),
                borderRadius: '0.2rem',
                padding: '0 0.15rem',
                boxShadow: active ? '0 0 0 2px rgba(56, 189, 248, 0.6)' : undefined,
                color: '#0f172a',
              }}
            >
              {text.slice(segment.start, segment.end)}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentTextViewer;
