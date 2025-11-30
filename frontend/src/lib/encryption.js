/**
 * Client-side encryption for messages using Web Crypto API
 * Hybrid encryption: RSA for key exchange, AES-GCM for message content
 */

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Convert PEM to CryptoKey
async function importPublicKeyFromPem(pem) {
  // Remove PEM header/footer and whitespace
  const pemContents = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Generate a random AES session key and encrypt it with recipient's RSA public key
 * @param {string} publicKeyPem - Recipient's RSA public key in PEM format
 * @returns {Promise<Object>} Object containing sessionKey (CryptoKey) and encryptedSessionKey (base64)
 */
export async function generateSessionKey(publicKeyPem) {
  try {
    // Generate random AES-256 session key
    const sessionKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Export session key to raw format
    const sessionKeyRaw = await window.crypto.subtle.exportKey('raw', sessionKey);

    // Import recipient's public key
    const publicKey = await importPublicKeyFromPem(publicKeyPem);

    // Encrypt session key with recipient's public key
    const encryptedSessionKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      sessionKeyRaw
    );

    return {
      sessionKey,
      encryptedSessionKey: arrayBufferToBase64(encryptedSessionKey),
    };
  } catch (error) {
    console.error('Error generating session key:', error);
    throw new Error('Failed to generate session key');
  }
}

/**
 * Decrypt session key using private key
 * @param {string} encryptedSessionKeyBase64 - Encrypted session key in base64
 * @param {CryptoKey} privateKey - RSA private key (CryptoKey object)
 * @returns {Promise<CryptoKey>} Decrypted AES session key
 */
export async function decryptSessionKey(encryptedSessionKeyBase64, privateKey) {
  try {
    const encryptedSessionKey = base64ToArrayBuffer(encryptedSessionKeyBase64);

    // Decrypt session key with private key
    const sessionKeyRaw = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedSessionKey
    );

    // Import as AES key
    const sessionKey = await window.crypto.subtle.importKey(
      'raw',
      sessionKeyRaw,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    return sessionKey;
  } catch (error) {
    console.error('Error decrypting session key:', error);
    throw new Error('Failed to decrypt session key');
  }
}

/**
 * Encrypt message with AES session key
 * @param {string} message - Plain text message
 * @param {CryptoKey} sessionKey - AES session key
 * @returns {Promise<Object>} Object containing encrypted, iv, and tag
 */
export async function encryptMessage(message, sessionKey) {
  try {
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    // Generate random IV (12 bytes for GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt message
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      sessionKey,
      messageBuffer
    );

    return {
      encrypted: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt message with AES session key
 * @param {Object} encryptedData - Object containing encrypted message and iv
 * @param {CryptoKey} sessionKey - AES session key
 * @returns {Promise<string>} Decrypted message
 */
export async function decryptMessage(encryptedData, sessionKey) {
  try {
    const { encrypted, iv } = encryptedData;

    const encryptedBuffer = base64ToArrayBuffer(encrypted);
    const ivBuffer = base64ToArrayBuffer(iv);

    // Decrypt message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      sessionKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Export AES key to base64 (for storage)
 * @param {CryptoKey} key - AES session key
 * @returns {Promise<string>} Base64 encoded key
 */
export async function exportAESKey(key) {
  try {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exported);
  } catch (error) {
    console.error('Error exporting AES key:', error);
    throw new Error('Failed to export key');
  }
}

/**
 * Import AES key from base64
 * @param {string} keyBase64 - Base64 encoded key
 * @returns {Promise<CryptoKey>} AES session key
 */
export async function importAESKey(keyBase64) {
  try {
    const keyBuffer = base64ToArrayBuffer(keyBase64);
    return await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error importing AES key:', error);
    throw new Error('Failed to import key');
  }
}
