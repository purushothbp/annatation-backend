import { useMemo, CSSProperties } from 'react';
import { List as VirtualizedList } from 'react-window';
import { AnnotationModel, User } from '../types';
import { getUserColor } from '../utils/color';
import clsx from 'clsx';

interface Props {
  annotations: AnnotationModel[];
  onSelect?: (annotation: AnnotationModel) => void;
  onDelete?: (annotation: AnnotationModel) => void;
  activeAnnotationId?: string;
  usersById: Record<string, User | undefined>;
  currentUserId?: string;
  currentUserRole?: string;
}

const ITEM_HEIGHT = 132;

const formatRelativeTime = (dateString: string) => {
  const delta = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(delta / (60 * 1000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

type RowProps = {
  annotations: AnnotationModel[];
  onSelect?: (annotation: AnnotationModel) => void;
  onDelete?: (annotation: AnnotationModel) => void;
  activeAnnotationId?: string;
  usersById: Record<string, User | undefined>;
  currentUserId?: string;
  currentUserRole?: string;
};

const Row = ({
  index,
  style,
  annotations,
  onSelect,
  onDelete,
  activeAnnotationId,
  usersById,
  currentUserId,
  currentUserRole,
  ariaAttributes,
}: RowProps & { index: number; style: CSSProperties; ariaAttributes?: Record<string, string> }) => {
  const annotation = annotations[index];
  if (!annotation) return null;
  const user = usersById?.[annotation.userId];
  const color = getUserColor(annotation.userId);
  const isActive = activeAnnotationId === annotation._id;
  const canDelete = currentUserRole === 'owner' || currentUserId === annotation.userId;

  return (
    <div
      style={{
        ...style,
        padding: '0.75rem 1rem',
      }}
      {...ariaAttributes}
    >
      <div
        className={clsx('card')}
        style={{
          height: ITEM_HEIGHT - 24,
          border: isActive ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid rgba(148, 163, 184, 0.1)',
          display: 'grid',
          gap: '0.5rem',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
        }}
        onMouseEnter={() => onSelect?.(annotation)}
        onClick={() => onSelect?.(annotation)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="tag" style={{ backgroundColor: `${color}22`, color }}>
            {user?.name ?? 'Collaborator'}
          </div>
          <small style={{ color: 'rgba(148, 163, 184, 0.7)' }}>{formatRelativeTime(annotation.createdAt)}</small>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.85)' }}>
          “{annotation.quoteSelector.exact.slice(0, 120)}
          {annotation.quoteSelector.exact.length > 120 ? '…' : ''}”
        </p>
        <p style={{ margin: 0 }}>{annotation.body}</p>
        {canDelete ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              className="button secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(annotation);
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AnnotationList = (props: Props) => {
  const itemCount = props.annotations?.length ?? 0;
  const rowProps = useMemo(
    () => ({
      annotations: props.annotations ?? [],
      onSelect: props.onSelect,
      onDelete: props.onDelete,
      activeAnnotationId: props.activeAnnotationId,
      usersById: props.usersById ?? {},
      currentUserId: props.currentUserId,
      currentUserRole: props.currentUserRole,
    }),
    [
      props.annotations,
      props.onSelect,
      props.onDelete,
      props.activeAnnotationId,
      props.usersById,
      props.currentUserId,
      props.currentUserRole,
    ]
  );

  if (itemCount === 0) {
    return (
      <div className="card" style={{ padding: '1rem', color: 'rgba(148, 163, 184, 0.8)' }}>
        No annotations yet—select text to add the first note.
      </div>
    );
  }

  return (
    <VirtualizedList
      rowCount={itemCount}
      rowHeight={ITEM_HEIGHT}
      defaultHeight={Math.min(520, Math.max(ITEM_HEIGHT, itemCount * ITEM_HEIGHT))}
      style={{ height: Math.min(520, Math.max(ITEM_HEIGHT, itemCount * ITEM_HEIGHT)), width: '100%' }}
      rowComponent={Row}
      rowProps={rowProps}
    >
    </VirtualizedList>
  );
};

export default AnnotationList;
