import api from './api';
import type { ApiResponse, SearchResult } from '../types';

export const search = (query: string, type: 'all' | 'document' | 'case' = 'all') =>
  api.get<ApiResponse<SearchResult[]>>('/search', { params: { q: query, type } }).then((r) => r.data);
