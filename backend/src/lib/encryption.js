import crypto from 'crypto';

// AES-256-GCM encryption for message content
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits

/**
 * Generate a random encryption key
 * @returns {string} Base64 encoded key
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {object} Encrypted data with iv, tag, and encrypted content
 */
export function encryptMessage(text, keyBase64) {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
}

/**
 * Decrypt text using AES-256-GCM
 * @param {object} encryptedData - Object containing encrypted, iv, and tag
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {string} Decrypted text
 */
export function decryptMessage(encryptedData, keyBase64) {
  try {
    const { encrypted, iv, tag } = encryptedData;
    const key = Buffer.from(keyBase64, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipherGCM(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}

/**
 * Generate RSA key pair for key exchange
 * @returns {object} Public and private key pair
 */
// export function generateKeyPair() {
//   return crypto.generateKeyPairSync('rsa', {
//     modulusLength: 2048,
//     publicKeyEncoding: {
//       type: 'spki',
//       format: 'pem',
//     },
//     privateKeyEncoding: {
//       type: 'pkcs8',
//       format: 'pem',
//     },
//   });
// }

/**
 * Encrypt data using RSA public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {string} Base64 encoded encrypted data
 */
export function encryptWithPublicKey(data, publicKey) {
  try {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(data)
    );
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error('RSA encryption failed: ' + error.message);
  }
}

/**
 * Decrypt data using RSA private key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} Decrypted data
 */
export function decryptWithPrivateKey(encryptedData, privateKey) {
  try {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedData, 'base64')
    );
    return decrypted.toString();
  } catch (error) {
    throw new Error('RSA decryption failed: ' + error.message);
  }
}
