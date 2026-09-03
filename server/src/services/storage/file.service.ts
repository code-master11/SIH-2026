import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { encryptionService } from '../crypto/encryption.service';
import { config } from '../../config';

export class FileService {
  async saveFile(tempPath: string, fileName: string): Promise<{ filePath: string; checksum: string; encryptedKey: string; iv: string; fileSize: number }> {
    const buffer = await fs.promises.readFile(tempPath);
    const checksum = encryptionService.hashFile(buffer);
    const { encryptedBuffer, iv, encryptedKey } = encryptionService.encryptFile(buffer);
    
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const filePath = path.join(config.UPLOAD_DIR, uniqueFileName);
    
    await fs.promises.writeFile(filePath, encryptedBuffer);
    await fs.promises.unlink(tempPath).catch(() => {});
    
    return { filePath, checksum, encryptedKey, iv, fileSize: buffer.length };
  }

  async getFile(filePath: string, encryptedKey: string, iv: string): Promise<Buffer> {
    const encryptedBuffer = await fs.promises.readFile(filePath);
    return encryptionService.decryptFile(encryptedBuffer, iv, encryptedKey);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.promises.unlink(filePath).catch(() => {});
  }

  generateDownloadToken(documentId: string, userId: string): string {
    return jwt.sign({ documentId, userId }, config.JWT_SECRET, { expiresIn: '1h' });
  }

  verifyDownloadToken(token: string): { documentId: string; userId: string } | null {
    try {
      return jwt.verify(token, config.JWT_SECRET) as { documentId: string; userId: string };
    } catch {
      return null;
    }
  }
}

export const fileService = new FileService();
