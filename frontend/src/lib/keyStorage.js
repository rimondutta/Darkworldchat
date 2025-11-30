//  IndexedDB storage for encrypted private keys and Keys are stored encrypted and never leave the device unencrypted

const DB_NAME = 'E2EEChatKeys';
const STORE_NAME = 'encryptedKeys';
const DB_VERSION = 1;

// Open or create IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(new Error('Failed to open key storage'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

/**
 * Save encrypted private key to IndexedDB
 * @param {string} userId - User ID or email
 * @param {Object} encryptedKeyData - Object containing encrypted private key, salt, and IV
 */
export async function saveEncryptedPrivateKey(userId, encryptedKeyData) {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        userId,
        ...encryptedKeyData,
        timestamp: Date.now(),
      });

      request.onsuccess = () => {
        console.log('Encrypted private key saved to IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Error saving key:', request.error);
        reject(new Error('Failed to save encryption key'));
      };
    });
  } catch (error) {
    console.error('Error in saveEncryptedPrivateKey:', error);
    throw error;
  }
}

/**
 * Get encrypted private key from IndexedDB
 * @param {string} userId - User ID or email
 * @returns {Promise<Object|null>} Encrypted key data or null if not found
 */
export async function getEncryptedPrivateKey(userId) {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(userId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Error retrieving key:', request.error);
        reject(new Error('Failed to retrieve encryption key'));
      };
    });
  } catch (error) {
    console.error('Error in getEncryptedPrivateKey:', error);
    return null;
  }
}

/**
 * Delete encrypted private key from IndexedDB
 * @param {string} userId - User ID or email
 */
export async function deleteEncryptedPrivateKey(userId) {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(userId);

      request.onsuccess = () => {
        console.log('Encrypted private key deleted from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting key:', request.error);
        reject(new Error('Failed to delete encryption key'));
      };
    });
  } catch (error) {
    console.error('Error in deleteEncryptedPrivateKey:', error);
    throw error;
  }
}

/**
 * Clear all encryption keys (for logout or reset)
 */
export async function clearAllKeys() {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All encryption keys cleared from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing keys:', request.error);
        reject(new Error('Failed to clear encryption keys'));
      };
    });
  } catch (error) {
    console.error('Error in clearAllKeys:', error);
    throw error;
  }
}

/**
 * Check if encrypted key exists for user
 * @param {string} userId - User ID or email
 * @returns {Promise<boolean>} True if key exists
 */
export async function hasEncryptedKey(userId) {
  try {
    const keyData = await getEncryptedPrivateKey(userId);
    return keyData !== null;
  } catch (error) {
    console.error('Error checking for key:', error);
    return false;
  }
}
