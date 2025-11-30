//Client-side RSA key generation and password-based encryption

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
  
  // Helper: Convert SPKI to PEM format
  function spkiToPem(keydata) {
    const base64 = arrayBufferToBase64(keydata);
    let pem = '-----BEGIN PUBLIC KEY-----\n';
    for (let i = 0; i < base64.length; i += 64) {
      pem += base64.substring(i, i + 64) + '\n';
    }
    pem += '-----END PUBLIC KEY-----';
    return pem;
  }
  
  /**
   * Generate RSA-2048 key pair on client side using Web Crypto API
   * @returns {Promise<Object>} Object containing publicKey, privateKey, publicKeyPem, privateKeyArrayBuffer
   */
  export async function generateRSAKeyPair() {
    try {
      // Generate RSA-OAEP key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
  
      // Export public key to PEM format for server storage
      const publicKeySpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyPem = spkiToPem(publicKeySpki);
  
      // Export private key for password encryption
      const privateKeyPkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  
      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyPem,
        privateKeyArrayBuffer: privateKeyPkcs8,
      };
    } catch (error) {
      console.error('Error generating RSA key pair:', error);
      throw new Error('Failed to generate encryption keys');
    }
  }
  
  /**
   * Derive encryption key from user password using PBKDF2
   * @param {string} password - User's password
   * @param {Uint8Array} salt - Random salt
   * @returns {Promise<CryptoKey>} Derived AES key
   */
  export async function deriveKeyFromPassword(password, salt) {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
  
      // Import password as key material
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
  
      // Derive AES-256 key from password using PBKDF2
      return await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000, // OWASP recommended minimum
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error deriving key from password:', error);
      throw new Error('Failed to derive encryption key');
    }
  }
  
  /**
   * Encrypt private key with password-derived key
   * @param {ArrayBuffer} privateKeyBuffer - Raw private key data
   * @param {string} password - User's password
   * @returns {Promise<Object>} Object containing encrypted private key, salt, and IV
   */
  export async function encryptPrivateKey(privateKeyBuffer, password) {
    try {
      // Generate random salt for PBKDF2
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
  
      // Derive encryption key from password
      const derivedKey = await deriveKeyFromPassword(password, salt);
  
      // Generate random IV for AES-GCM
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
      // Encrypt private key
      const encryptedPrivateKey = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        privateKeyBuffer
      );
  
      return {
        encryptedPrivateKey: arrayBufferToBase64(encryptedPrivateKey),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
      };
    } catch (error) {
      console.error('Error encrypting private key:', error);
      throw new Error('Failed to encrypt private key');
    }
  }
  
  /**
   * Decrypt private key with password
   * @param {Object} encryptedData - Object containing encryptedPrivateKey, salt, and IV
   * @param {string} password - User's password
   * @returns {Promise<CryptoKey>} Decrypted private key as CryptoKey
   */
  export async function decryptPrivateKey(encryptedData, password) {
    try {
      const { encryptedPrivateKey, salt, iv } = encryptedData;
  
      const encryptedBuffer = base64ToArrayBuffer(encryptedPrivateKey);
      const saltBuffer = base64ToArrayBuffer(salt);
      const ivBuffer = base64ToArrayBuffer(iv);
  
      // Derive key from password
      const derivedKey = await deriveKeyFromPassword(password, saltBuffer);
  
      // Decrypt private key
      const decryptedPrivateKey = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        derivedKey,
        encryptedBuffer
      );
  
      // Import decrypted private key as CryptoKey
      return await window.crypto.subtle.importKey(
        'pkcs8',
        decryptedPrivateKey,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );
    } catch (error) {
      console.error('Error decrypting private key:', error);
      throw new Error('Incorrect password or corrupted key data');
    }
  }
  