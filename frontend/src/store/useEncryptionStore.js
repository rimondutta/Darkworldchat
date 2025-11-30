import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import {
  generateSessionKey,
  decryptSessionKey,
  encryptMessage,
  decryptMessage,
  importAESKey,
  exportAESKey,
} from '../lib/encryption';
import toast from 'react-hot-toast';

export const useEncryptionStore = create((set, get) => ({
  isEncryptionEnabled: true,
  sessionKeys: {}, 
  encryptedSessionKeys: {}, 
  userPublicKeys: {},
  myPrivateKey: null,

  setEncryptionEnabled: (enabled) => set({ isEncryptionEnabled: enabled }),

  // Get user's public key
  getUserPublicKey: async (userId) => {
    const { userPublicKeys } = get();

    if (userPublicKeys[userId]) {
      return userPublicKeys[userId];
    }

    try {
      const res = await axiosInstance.get(`/messages/publickey/${userId}`);
      const publicKey = res.data.publicKey;

      set({
        userPublicKeys: {
          ...userPublicKeys,
          [userId]: publicKey,
        },
      });

      return publicKey;
    } catch (error) {
      console.error('Failed to get user public key:', error);
      toast.error('Failed to get encryption key');
      return null;
    }
  },

  // Set private key in memory (called during login)
  setMyPrivateKey: (privateKey) => {
    if (!privateKey) {
      console.error('Attempting to set null private key');
      return;
    }
    console.log(' Private key loaded into memory');
    set({ myPrivateKey: privateKey });
  },

  getMyPrivateKey: () => {
    const myPrivateKey = get().myPrivateKey;
    if (!myPrivateKey) {
      toast.error('Encryption key not available. Please unlock with your password.');
      return null;
    }
    return myPrivateKey;
  },

  // Initialize session key for a user
  initializeSessionKey: async (userId) => {
    const { sessionKeys, encryptedSessionKeys } = get();

    if (sessionKeys[userId]) {
      return sessionKeys[userId];
    }

    try {
      const publicKey = await get().getUserPublicKey(userId);
      if (!publicKey) {
        throw new Error("Could not get user's public key");
      }

      const { sessionKey, encryptedSessionKey } = await generateSessionKey(publicKey);

      set({
        sessionKeys: {
          ...sessionKeys,
          [userId]: sessionKey,
        },
        encryptedSessionKeys: {
          ...encryptedSessionKeys,
          [userId]: encryptedSessionKey,
        },
      });

      return sessionKey;
    } catch (error) {
      console.error('Failed to initialize session key:', error);
      toast.error('Failed to initialize encryption');
      return null;
    }
  },

  decryptIncomingSessionKey: async (encryptedSessionKeyBase64) => {
    try {
      const privateKey = get().getMyPrivateKey(); // NOT async!
      if (!privateKey) throw new Error('Could not get private key from memory');
      return await decryptSessionKey(encryptedSessionKeyBase64, privateKey);
    } catch (error) {
      console.error('Failed to decrypt session key:', error);
      return null;
    }
  },
  

  // Encrypt message for sending
  encryptMessageForSending: async (message, userId) => {
    const { isEncryptionEnabled } = get();

    if (!isEncryptionEnabled) {
      return { text: message, isEncrypted: false };
    }

    try {
      const sessionKey = await get().initializeSessionKey(userId);
      if (!sessionKey) {
        throw new Error('Could not initialize session key');
      }

      const encryptedData = await encryptMessage(message, sessionKey);
      const { encryptedSessionKeys } = get();

      return {
        encryptedText: {
          ...encryptedData,
          encryptedSessionKey: encryptedSessionKeys[userId],
        },
        isEncrypted: true,
      };
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      toast.error('Failed to encrypt message, sending as plain text');
      return { text: message, isEncrypted: false };
    }
  },

  decryptReceivedMessage: async (encryptedData, senderId) => {
    try {
      if (!encryptedData.encryptedSessionKey) {
        // Only for plain/legacy messages
        return '[Not encrypted, or sent before E2EE was enabled]';
      }
      const privateKey = get().myPrivateKey;
      if (!privateKey) throw new Error("Private key is not loaded in memory");
      let sessionKey = await get().decryptIncomingSessionKey(encryptedData.encryptedSessionKey);
      if (!sessionKey) throw new Error("Failed to decrypt session key");
      return await decryptMessage(encryptedData, sessionKey);
    } catch (e) {
      console.error("Failed to decrypt message:", e);
      return '[Unable to decrypt - encryption error]';
    }
  },  

  // Clear encryption data on logout
  clearEncryptionData: () => {
    console.log('🧹 Clearing all encryption data from memory');
    set({
      sessionKeys: {},
      encryptedSessionKeys: {},
      userPublicKeys: {},
      myPrivateKey: null,
    });
  },
}));
