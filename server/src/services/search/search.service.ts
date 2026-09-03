import prisma from '../../lib/prisma';
import { SearchResult } from '../../types';

interface TfIdfDocument {
  id: string;
  type: 'document' | 'case';
  title: string;
  description: string;
  content: string;
  tokens: string[];
}

export class SearchService {
  async search(query: string, userId: string, userRole: string): Promise<SearchResult[]> {
    const documents = await this.buildIndex(userId, userRole);
    const queryTokens = this.tokenize(query);
    
    const results = documents.map(doc => ({
      documentId: doc.type === 'document' ? doc.id : undefined,
      caseId: doc.type === 'case' ? doc.id : undefined,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      score: this.computeScore(queryTokens, doc, documents)
    })).filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

    return results;
  }

  private async buildIndex(userId: string, userRole: string): Promise<TfIdfDocument[]> {
    // simplified RBAC filter
    const cases = await prisma.case.findMany({
      where: userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' ? {} : { OR: [{ createdById: userId }, { assignedToId: userId }] }
    });
    
    const docs = await prisma.document.findMany({
      where: userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' ? {} : { uploadedById: userId }
    });

    const index: TfIdfDocument[] = [];
    
    for (const c of cases) {
      const content = `${c.title} ${c.description || ''} ${c.caseNumber}`;
      index.push({ id: c.id, type: 'case', title: c.title, description: c.description || '', content, tokens: this.tokenize(content) });
    }
    
    for (const d of docs) {
      const content = `${d.title} ${d.description || ''} ${d.tags || ''}`;
      index.push({ id: d.id, type: 'document', title: d.title, description: d.description || '', content, tokens: this.tokenize(content) });
    }
    
    return index;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2);
  }

  private computeScore(queryTokens: string[], document: TfIdfDocument, allDocs: TfIdfDocument[]): number {
    let score = 0;
    const totalDocs = allDocs.length;
    
    for (const token of queryTokens) {
      const tf = document.tokens.filter(t => t === token).length / (document.tokens.length || 1);
      const docsWithToken = allDocs.filter(d => d.tokens.includes(token)).length;
      const idf = docsWithToken > 0 ? Math.log(totalDocs / docsWithToken) : 0;
      score += tf * idf;
    }
    return score;
  }
}

export const searchService = new SearchService();
