import crypto from 'crypto';

export class SignatureService {
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey };
  }

  /**
   * Signs a document checksum using a freshly generated RSA key pair.
   * Returns the public key, base64 signature, and algorithm so the caller
   * can persist all three in the Signature table for later verification.
   */
  signDocument(checksum: string, _userId: string): { publicKey: string; signature: string; algorithm: string } {
    const { publicKey, privateKey } = this.generateKeyPair();
    const sign = crypto.createSign('SHA256');
    sign.update(checksum);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');
    return { publicKey, signature, algorithm: 'RSA-SHA256' };
  }

  verifySignature(checksum: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(checksum);
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
    } catch {
      return false;
    }
  }
}

export const signatureService = new SignatureService();
