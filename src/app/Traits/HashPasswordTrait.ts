import crypto from 'node:crypto';

export const HashPasswordTrait = {
  makeHash(password: string, salt: string): string {
    return crypto.createHash('md5').update(password + salt).digest('hex');
  },

  generateSalt(): string {
    return Math.random().toString(36).substring(2, 6);
  }
};