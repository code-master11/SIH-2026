import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, FolderOpen, Loader2 } from 'lucide-react';
import { search } from '../../services/search.service';
import { Card, Badge, EmptyState, Spinner } from '../ui/index';
import type { SearchResult } from '../../types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('q') ?? '');
  const q = searchParams.get('q') ?? '';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () => search(q),
    enabled: q.length > 0,
  });

  const results: SearchResult[] = (data as any)?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Search</h1>
        <p className="text-sm text-slate-500">Full-text search across cases and documents</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search cases, documents, tags…"
            className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-2"
        >
          {(isLoading || isFetching) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {/* Results */}
      {!q ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Search className="h-14 w-14 mb-3" />
          <p className="text-base font-medium">Enter a query to search</p>
          <p className="text-sm mt-1">Search by title, description, case number, or tags</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No results found"
          description={`No cases or documents match "${q}". Try different keywords.`}
        />
      ) : (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            Found <span className="font-semibold text-slate-800">{results.length}</span> result{results.length !== 1 ? 's' : ''} for &ldquo;<span className="font-semibold">{q}</span>&rdquo;
          </p>
          <div className="space-y-3">
            {results.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    {r.type === 'case' ? (
                      <FolderOpen className="h-5 w-5 text-indigo-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className={r.type === 'case' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}>
                        {r.type === 'case' ? 'Case' : 'Document'}
                      </Badge>
                    </div>
                    <Link
                      to={r.type === 'case' ? `/cases/${r.id}` : `/documents/${r.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {r.title}
                    </Link>
                    {r.snippet && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.snippet}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex-shrink-0">
                    Score: {r.score.toFixed(3)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
