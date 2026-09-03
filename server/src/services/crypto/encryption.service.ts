import crypto from 'crypto';
import { config } from '../../config';

export class EncryptionService {
  private masterKey: Buffer;

  constructor() {
    this.masterKey = Buffer.from(config.MASTER_ENCRYPTION_KEY, 'hex');
    if (this.masterKey.length !== 32) {
      throw new Error('Invalid MASTER_ENCRYPTION_KEY length, must be 32 bytes (64 hex characters)');
    }
  }

  encryptFile(buffer: Buffer): { encryptedBuffer: Buffer; iv: string; encryptedKey: string } {
    const fileKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final(), cipher.getAuthTag()]);

    const keyIv = crypto.randomBytes(12);
    const keyCipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, keyIv);
    const encryptedKeyBuffer = Buffer.concat([
      keyIv, 
      keyCipher.update(fileKey), 
      keyCipher.final(), 
      keyCipher.getAuthTag()
    ]);

    return {
      encryptedBuffer,
      iv: iv.toString('hex'),
      encryptedKey: encryptedKeyBuffer.toString('hex'),
    };
  }

  decryptFile(encryptedBuffer: Buffer, ivHex: string, encryptedKeyHex: string): Buffer {
    const encryptedKeyBuffer = Buffer.from(encryptedKeyHex, 'hex');
    const keyIv = encryptedKeyBuffer.subarray(0, 12);
    const authTagPos = encryptedKeyBuffer.length - 16;
    const encryptedFileKey = encryptedKeyBuffer.subarray(12, authTagPos);
    const keyAuthTag = encryptedKeyBuffer.subarray(authTagPos);
    
    const keyDecipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, keyIv);
    keyDecipher.setAuthTag(keyAuthTag);
    const fileKey = Buffer.concat([keyDecipher.update(encryptedFileKey), keyDecipher.final()]);

    const iv = Buffer.from(ivHex, 'hex');
    const fileAuthTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
    const cipherText = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', fileKey, iv);
    decipher.setAuthTag(fileAuthTag);
    
    return Buffer.concat([decipher.update(cipherText), decipher.final()]);
  }

  hashFile(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  verifyFileHash(buffer: Buffer, expectedHash: string): boolean {
    return this.hashFile(buffer) === expectedHash;
  }
}

export const encryptionService = new EncryptionService();
