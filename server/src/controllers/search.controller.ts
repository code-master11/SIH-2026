import { Response, NextFunction } from 'express';
import { successResponse } from '../utils/api-response';
import { searchService } from '../services/search/search.service';
import { AuthRequest } from '../types';

export class SearchController {
  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return successResponse(res, 200, 'No query', []);
      
      const results = await searchService.search(q, req.user!.userId, req.user!.role);
      return successResponse(res, 200, 'Search results', results);
    } catch (e) {
      next(e);
    }
  }
}

export const searchController = new SearchController();
