import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  PenLine,
  ShieldCheck,
  Trash2,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';
import {
  getDocumentById,
  downloadDocument,
  signDocument,
  verifySignature,
  deleteDocument,
  getVersionHistory,
  getComments,
  addComment,
} from '../../services/document.service';
import { useAuthStore } from '../../store/auth.store';
import { Card, Badge, Spinner, EmptyState } from '../ui/index';
import { Button } from '../ui/Button';
import {
  formatDate,
  formatFileSize,
  getAccessLevelColor,
  getFileIcon,
} from '../../utils/helpers';
import type { Document } from '../../types';
import toast from 'react-hot-toast';

type Tab = 'details' | 'versions' | 'comments';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR', 'OFFICER'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('details');
  const [comment, setComment] = useState('');

  const { data: docRes, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocumentById(id!),
    enabled: !!id,
  });

  const { data: versionsRes } = useQuery({
    queryKey: ['doc-versions', id],
    queryFn: () => getVersionHistory(id!),
    enabled: !!id && tab === 'versions',
  });

  const { data: commentsRes } = useQuery({
    queryKey: ['doc-comments', id],
    queryFn: () => getComments(id!),
    enabled: !!id && tab === 'comments',
  });

  const signMutation = useMutation({
    mutationFn: () => signDocument(id!),
    onSuccess: () => {
      toast.success('Document signed successfully');
      queryClient.invalidateQueries({ queryKey: ['document', id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Signing failed'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifySignature(id!),
    onSuccess: (res) => {
      const { isValid } = (res as any).data;
      if (isValid) toast.success('Signature is valid ✓');
      else toast.error('Signature verification FAILED');
    },
    onError: () => toast.error('Verification failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDocument(id!),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate('/documents');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Delete failed'),
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment(id!, comment),
    onSuccess: () => {
      toast.success('Comment added');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['doc-comments', id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to add comment'),
  });

  const doc: Document | undefined = (docRes as any)?.data;
  const versions: Document[] = (versionsRes as any)?.data ?? [];
  const comments: any[] = (commentsRes as any)?.data ?? [];

  const canWrite = WRITE_ROLES.includes(user?.role ?? '');
  const canDelete = ADMIN_ROLES.includes(user?.role ?? '') || doc?.uploadedById === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doc) {
    return (
      <EmptyState
        title="Document not found"
        description="This document may have been deleted or you don't have access."
        action={<Button onClick={() => navigate('/documents')}>Back to Documents</Button>}
      />
    );
  }

  const Icon = getFileIcon(doc.mimeType);

  return (
    <div className="space-y-5">
      <Link to="/documents" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to Documents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{doc.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {doc.fileName} · {formatFileSize(doc.fileSize)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <Button
            onClick={() => downloadDocument(doc.id, doc.fileName)}
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          {canWrite && !doc.isSigned && (
            <Button
              onClick={() => signMutation.mutate()}
              isLoading={signMutation.isPending}
              className="flex items-center gap-1.5"
            >
              <PenLine className="h-3.5 w-3.5" /> Sign
            </Button>
          )}
          {doc.isSigned && (
            <Button
              variant="outline"
              onClick={() => verifyMutation.mutate()}
              isLoading={verifyMutation.isPending}
              className="flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Verify
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Permanently delete this document?')) deleteMutation.mutate();
              }}
              isLoading={deleteMutation.isPending}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getAccessLevelColor(doc.accessLevel)}>{doc.accessLevel}</Badge>
        {doc.isSigned ? (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-3 w-3 inline mr-0.5" /> Digitally Signed
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600">Not Signed</Badge>
        )}
        {doc.isRedacted && <Badge className="bg-red-100 text-red-800">Redacted</Badge>}
        <Badge className="bg-slate-100 text-slate-600">v{doc.version}</Badge>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-0">
        {(['details', 'versions', 'comments'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
            {t === 'comments' && comments.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                {comments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card header={<h3 className="text-sm font-semibold text-slate-800">File Information</h3>}>
            <dl className="space-y-3">
              {[
                { label: 'File Name', value: doc.fileName },
                { label: 'MIME Type', value: doc.mimeType },
                { label: 'File Size', value: formatFileSize(doc.fileSize) },
                { label: 'Checksum (SHA-256)', value: <span className="font-mono text-xs break-all">{doc.checksum}</span> },
                { label: 'Uploaded', value: formatDate(doc.createdAt) },
                { label: 'Uploaded By', value: (doc as any).uploadedBy?.name ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">{label}</dt>
                  <dd className="text-xs font-medium text-slate-800 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card header={<h3 className="text-sm font-semibold text-slate-800">Case & Tags</h3>}>
            <dl className="space-y-3">
              {[
                { label: 'Linked Case', value: (doc as any).case ? `${(doc as any).case.caseNumber} – ${(doc as any).case.title}` : '—' },
                { label: 'Tags', value: doc.tags ?? '—' },
                { label: 'Description', value: doc.description ?? '—' },
                { label: 'Signed At', value: doc.signedAt ? formatDate(doc.signedAt) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-xs text-slate-500 flex-shrink-0">{label}</dt>
                  <dd className="text-xs font-medium text-slate-800 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {/* Versions Tab */}
      {tab === 'versions' && (
        <Card padding={false}>
          {versions.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-10 w-10" />}
              title="No version history"
              description="This document has no previous versions."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    v{v.version}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{v.fileName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(v.createdAt)} · {formatFileSize(v.fileSize)}</p>
                  </div>
                  {v.isLatest && <Badge className="bg-indigo-100 text-indigo-800">Latest</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Comments Tab */}
      {tab === 'comments' && (
        <div className="space-y-4">
          {/* Add comment */}
          <Card>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => {
                      if (!comment.trim()) return;
                      commentMutation.mutate();
                    }}
                    isLoading={commentMutation.isPending}
                    disabled={!comment.trim()}
                    className="flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Post
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Comments list */}
          {comments.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-10 w-10" />}
              title="No comments yet"
              description="Be the first to leave a comment on this document."
            />
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <Card key={c.id}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {c.author?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800">{c.author?.name ?? 'Unknown'}</span>
                        <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{c.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
