import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DocumentTextViewer from '../components/DocumentTextViewer';
import AnnotationComposer from '../components/AnnotationComposer';
import AnnotationList from '../components/AnnotationList';
import { createAnnotation, deleteAnnotation } from '../services/annotationService';
import { getDocument, getDocumentText, listAnnotations } from '../services/documentService';
import { AnnotationModel, DocumentModel } from '../types';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../context/SocketProvider';

const DocumentWorkspacePage = () => {
  const { id = '' } = useParams();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const socket = useSocket();

  const [selectedRange, setSelectedRange] =
    useState<{ start: number; end: number; exact: string; prefix: string; suffix: string } | null>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | undefined>();

  const documentQuery = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: Boolean(id),
    refetchInterval: (data) => (data?.extractionStatus === 'complete' ? false : 4000),
  });

  const textQuery = useQuery({
    queryKey: ['document-text', id],
    queryFn: () => getDocumentText(id),
    enabled: Boolean(id),
    retry: (count, error) => {
      if (error instanceof Error && error.message.includes('pending')) {
        return count < 10;
      }
      return false;
    },
    refetchInterval: documentQuery.data?.extractionStatus === 'complete' ? false : 8000,
  });

  const annotationsQuery = useInfiniteQuery({
    queryKey: ['annotations', id],
    queryFn: ({ pageParam }) => listAnnotations(id, pageParam as string | undefined),
    enabled: Boolean(id),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.cursor ?? undefined : undefined),
  });

  const annotations = useMemo(
    () => annotationsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [annotationsQuery.data]
  );

  const usersById = useMemo(() => {
    if (!user) return {};
    return { [user.id]: user };
  }, [user]);

  const createMutation = useMutation({
    mutationFn: createAnnotation,
    onSuccess: (annotation) => {
      queryClient.setQueryData<any>(['annotations', id], (prev) => {
        if (!prev) return prev;
        const exists = prev.pages.some((page: any) => page.data.some((item: AnnotationModel) => item._id === annotation._id));
        if (exists) return prev;
        if (prev.pages.length === 0) {
          return {
            ...prev,
            pages: [{ data: [annotation], pagination: { cursor: null, hasMore: false } }],
            pageParams: [undefined],
          };
        }
        return {
          ...prev,
          pages: [
            { ...prev.pages[0], data: [annotation, ...prev.pages[0].data] },
            ...prev.pages.slice(1),
          ],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['annotations', id] });
      setSelectedRange(null);
      setActiveAnnotationId(annotation._id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (annotation: AnnotationModel) => deleteAnnotation(annotation._id),
    onSuccess: (_, annotation) => {
      queryClient.setQueryData<any>(['annotations', id], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((item: AnnotationModel) => item._id !== annotation._id),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['annotations', id] });
    },
  });

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('joinDocument', id);

    const handleCreated = (annotation: AnnotationModel) => {
      queryClient.setQueryData<any>(['annotations', id], (prev) => {
        if (!prev) return prev;
        const exists = prev.pages.some((page: any) => page.data.some((item: AnnotationModel) => item._id === annotation._id));
        if (exists) return prev;
        if (prev.pages.length === 0) {
          return {
            ...prev,
            pages: [{ data: [annotation], pagination: { cursor: null, hasMore: false } }],
            pageParams: [undefined],
          };
        }
        return {
          ...prev,
          pages: [
            { ...prev.pages[0], data: [annotation, ...prev.pages[0].data] },
            ...prev.pages.slice(1),
          ],
        };
      });
    };

    const handleUpdated = (annotation: AnnotationModel) => {
      queryClient.setQueryData<any>(['annotations', id], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page: any) => ({
            ...page,
            data: page.data.map((item: AnnotationModel) => (item._id === annotation._id ? annotation : item)),
          })),
        };
      });
    };

    const handleDeleted = ({ id: annotationId }: { id: string }) => {
      queryClient.setQueryData<any>(['annotations', id], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((item: AnnotationModel) => item._id !== annotationId),
          })),
        };
      });
    };

    socket.on('annotation.created', handleCreated);
    socket.on('annotation.updated', handleUpdated);
    socket.on('annotation.deleted', handleDeleted);

    return () => {
      socket.emit('leaveDocument', id);
      socket.off('annotation.created', handleCreated);
      socket.off('annotation.updated', handleUpdated);
      socket.off('annotation.deleted', handleDeleted);
    };
  }, [socket, id, queryClient]);

  const document = documentQuery.data as DocumentModel | undefined;
  const text = textQuery.data ?? '';
  const textStatusMessage =
    (textQuery.error instanceof Error && textQuery.error.message) ||
    (document?.extractionStatus !== 'complete'
      ? 'Text extraction in progress. This view refreshes automatically.'
      : undefined);

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
      <DocumentTextViewer
        text={text}
        annotations={annotations}
        activeAnnotationId={activeAnnotationId}
        onSelection={(selection) => {
          setSelectedRange(selection);
        }}
        isLoading={textQuery.isLoading || document?.extractionStatus !== 'complete'}
        statusMessage={textStatusMessage}
      />

      <div style={{ display: 'grid', gap: '1rem', alignSelf: 'start' }}>
        <div className="card" style={{ display: 'grid', gap: '0.5rem' }}>
          <h2 style={{ marginTop: 0 }}>{document?.title ?? 'Loading document…'}</h2>
          <p style={{ margin: 0, color: 'rgba(148, 163, 184, 0.8)', fontSize: '0.9rem' }}>
            Status:{' '}
            <strong style={{ color: '#38bdf8' }}>
              {document?.extractionStatus ?? 'pending'}
            </strong>
          </p>
          <a
            className="button secondary"
            href={document ? `/files/${document.storageLocation}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: 'fit-content' }}
          >
            Open PDF
          </a>
        </div>

        <AnnotationComposer
          selection={selectedRange}
          onSubmit={(body) => {
            if (!selectedRange || !user) return;
            createMutation.mutate({
              documentId: id,
              selector: { start: selectedRange.start, end: selectedRange.end },
              quoteSelector: {
                exact: selectedRange.exact,
                prefix: selectedRange.prefix,
                suffix: selectedRange.suffix,
              },
              body,
            });
          }}
          onCancel={() => setSelectedRange(null)}
          disabled={createMutation.isPending}
        />

        <AnnotationList
          annotations={annotations}
          onSelect={(annotation) => setActiveAnnotationId(annotation._id)}
          onDelete={(annotation) => deleteMutation.mutate(annotation)}
          activeAnnotationId={activeAnnotationId}
          usersById={usersById}
          currentUserId={user?.id}
          currentUserRole={user?.role}
        />

        {annotationsQuery.hasNextPage ? (
          <button className="button secondary" onClick={() => annotationsQuery.fetchNextPage()} disabled={annotationsQuery.isFetchingNextPage}>
            {annotationsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default DocumentWorkspacePage;
