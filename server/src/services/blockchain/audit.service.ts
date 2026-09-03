import crypto from 'crypto';
import prisma from '../../lib/prisma';
import logger from '../../lib/logger';

export class AuditService {
  async log(params: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userName: string;
    userRole: string;
    details: object;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const latest = await this.getLatestHash();
    const blockIndex = latest.index + 1;
    const previousHash = latest.hash;
    
    const detailsStr = JSON.stringify(params.details);
    
    const dataToHash = {
      blockIndex,
      action: params.action,
      entityId: params.entityId,
      userId: params.userId,
      previousHash,
      details: detailsStr
    };
    
    const blockHash = this.computeBlockHash(dataToHash);
    
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        details: detailsStr,
        ipAddress: params.ipAddress || '',
        userAgent: params.userAgent || '',
        blockHash,
        previousHash,
        blockIndex
      }
    });
  }

  async getLogs(filters: any) {
    // Basic implementation for getLogs
    return prisma.auditLog.findMany({ where: filters, orderBy: { createdAt: 'desc' } });
  }

  async verifyChain(): Promise<{ isValid: boolean; brokenAt?: number; totalBlocks: number }> {
    const logs = await prisma.auditLog.findMany({ orderBy: { blockIndex: 'asc' } });
    if (logs.length === 0) return { isValid: true, totalBlocks: 0 };

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (i > 0 && log.previousHash !== logs[i - 1].blockHash) {
        return { isValid: false, brokenAt: log.blockIndex, totalBlocks: logs.length };
      }
      const dataToHash = {
        blockIndex: log.blockIndex,
        action: log.action,
        entityId: log.entityId,
        userId: log.userId,
        previousHash: log.previousHash,
        details: log.details
      };
      const expectedHash = this.computeBlockHash(dataToHash);
      if (log.blockHash !== expectedHash) {
        return { isValid: false, brokenAt: log.blockIndex, totalBlocks: logs.length };
      }
    }
    return { isValid: true, totalBlocks: logs.length };
  }

  private async getLatestHash(): Promise<{ hash: string; index: number }> {
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { blockIndex: 'desc' }
    });
    if (!lastLog) return { hash: '0'.repeat(64), index: 0 };
    return { hash: lastLog.blockHash, index: lastLog.blockIndex };
  }

  private computeBlockHash(data: object): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

export const auditService = new AuditService();
