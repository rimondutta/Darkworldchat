import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { generateRSAKeyPair, encryptPrivateKey, decryptPrivateKey } from '../lib/keyGeneration';
import { saveEncryptedPrivateKey, getEncryptedPrivateKey, clearAllKeys } from '../lib/keyStorage';
import { useEncryptionStore } from './useEncryptionStore';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  typingUsers: {},
  blockedUsers: [],

  // OTP-related state
  pendingEmail: null,
  isVerifyingOTP: false,
  otpSent: false,
  otpResendTimer: 0,

  // E2EE related state
  tempPassword: null,
  needsPasswordUnlock: false, 

  // Helper to extract error message safely
  _getErrorMessage: (error, fallback = 'An error occurred') => {
    if (!error) return fallback;
    if (error.response && error.response.data) {
      return (
        error.response.data.message ||
        error.response.data.error ||
        JSON.stringify(error.response.data) ||
        fallback
      );
    }
    if (error.message) return error.message;
    return String(error);
  },

  // checkAuth with password unlock detection
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get('/auth/check');
      const user = res.data;
      set({ authUser: user });
      
      console.log('Checking for encryption keys...');
      
      try {
        const encryptedKeyData = await getEncryptedPrivateKey(user._id) || 
                                 await getEncryptedPrivateKey(user.email);
        
        if (encryptedKeyData) {
          console.log('Encryption keys found - need password to unlock');
          set({ needsPasswordUnlock: true });
        } else {
          console.log('ℹ️ No encryption keys found');
          set({ needsPasswordUnlock: false });
        }
      } catch (keyError) {
        console.error('Error checking encryption keys:', keyError);
      }
      
      get().connectSocket();
      
      try {
        const blockedRes = await axiosInstance.get('/auth/blocked');
        set({ blockedUsers: blockedRes.data });
      } catch (e) {
        // ignore
      }
    } catch (error) {
      set({ authUser: null });
      if (error.response?.status !== 404 && error.response?.status !== 401) {
        console.log('Error in checkAuth: ', error);
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Unlock encryption keys with password
  unlockEncryptionKeys: async (password) => {
    const user = get().authUser;
    if (!user) {
      toast.error('Please log in first');
      return false;
    }

    try {
      console.log('Unlocking encryption keys with password...');
      
      const encryptedKeyData = await getEncryptedPrivateKey(user._id) || 
                               await getEncryptedPrivateKey(user.email);
      
      if (!encryptedKeyData) {
        toast.error('Encryption keys not found');
        return false;
      }
      
      // Decrypt private key with password
      const privateKey = await decryptPrivateKey(encryptedKeyData, password);
      
      // Load into memory
      const encStore = useEncryptionStore.getState();
      encStore.setMyPrivateKey(privateKey);
      
      set({ needsPasswordUnlock: false });
      
      console.log(' Encryption keys unlocked');
      toast.success('Encryption unlocked! You can now read encrypted messages.');
      return true;
    } catch (error) {
      console.error('Failed to unlock encryption keys:', error);
      toast.error('Wrong password or corrupted keys');
      return false;
    }
  },

  // Block/unblock APIs
  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/auth/block/${userId}`);
      const res = await axiosInstance.get('/auth/blocked');
      set({ blockedUsers: res.data });
    } catch (err) {
      console.warn('Failed to block user', err);
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.post(`/auth/unblock/${userId}`);
      const res = await axiosInstance.get('/auth/blocked');
      set({ blockedUsers: res.data });
    } catch (err) {
      console.warn('Failed to unblock user', err);
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      console.log('Generating encryption keys on client...');
      
      const { publicKeyPem, privateKeyArrayBuffer } = await generateRSAKeyPair();
      
      console.log('Encrypting private key with password...');
      
      const encryptedPrivateKeyData = await encryptPrivateKey(
        privateKeyArrayBuffer,
        data.password
      );
      
      console.log('Storing encrypted private key in IndexedDB...');
      
      await saveEncryptedPrivateKey(data.email, encryptedPrivateKeyData);
      
      console.log('Sending public key to server...');
      
      const res = await axiosInstance.post('/auth/signup', {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        publicKey: publicKeyPem,
      });
  
      set({ 
        pendingEmail: res.data.email, 
        otpSent: true,
        tempPassword: data.password
      });
      
      toast.success('OTP sent to your email!');
      
      console.log(' E2EE signup complete - private key never left your device');
    } catch (error) {
      const msg = get()._getErrorMessage(error, 'Signup failed');
      toast.error(msg);
      console.error('Signup error:', error);
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyOTP: async (otp) => {
    set({ isVerifyingOTP: true });
    try {
      const res = await axiosInstance.post('/auth/verify-otp', {
        email: get().pendingEmail,
        otp,
      });
      
      const user = res.data;
      const tempPassword = get().tempPassword;
      
      set({ authUser: user, pendingEmail: null, otpSent: false });
      
      if (tempPassword) {
        try {
          console.log('Loading encryption keys...');
          
          let encryptedKeyData = await getEncryptedPrivateKey(user.email);
          
          if (encryptedKeyData) {
            await saveEncryptedPrivateKey(user._id, {
              encryptedPrivateKey: encryptedKeyData.encryptedPrivateKey,
              salt: encryptedKeyData.salt,
              iv: encryptedKeyData.iv,
            });
            
            console.log('Decrypting private key...');
            
            const privateKey = await decryptPrivateKey(encryptedKeyData, tempPassword);
            const encStore = useEncryptionStore.getState();
            encStore.setMyPrivateKey(privateKey);
            
            set({ needsPasswordUnlock: false }); //  Keys unlocked, no prompt needed
            
            console.log(' E2EE enabled automatically');
            toast.success('Email verified! Encrypted messaging enabled.');
          } else {
            console.warn('Encryption keys not found in IndexedDB');
            toast.warn('Encryption keys not found. Please sign up again.');
          }
        } catch (err) {
          console.error('Failed to load encryption keys:', err);
          toast.error('Failed to load encryption keys. Please log in again.');
        }
        
        set({ tempPassword: null });
      } else {
        console.warn('No temporary password available');
      }
      
      get().connectSocket();
      toast.success('Logged in successfully');
    } catch (error) {
      const msg = get()._getErrorMessage(error, 'OTP verification failed');
      toast.error(msg);
      console.log('Error in verifyOTP: ', error);
    } finally {
      set({ isVerifyingOTP: false });
    }
  },

  resendOTP: async () => {
    try {
      await axiosInstance.post('/auth/resend-otp', {
        email: get().pendingEmail,
      });
      set({ otpResendTimer: 60 });
      toast.success('OTP resent to your email');

      const interval = setInterval(() => {
        set((state) => {
          const newTimer = state.otpResendTimer - 1;
          if (newTimer <= 0) clearInterval(interval);
          return { otpResendTimer: newTimer };
        });
      }, 1000);
    } catch (error) {
      const msg = get()._getErrorMessage(error, 'Failed to resend OTP');
      toast.error(msg);
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log('Logging in...');
      
      const res = await axiosInstance.post('/auth/login', data);
      const user = res.data;
      
      set({ authUser: user });
      
      console.log('Looking for encrypted private key in IndexedDB...');
      
      const encryptedKeyData = await getEncryptedPrivateKey(user._id);
      
      if (!encryptedKeyData) {
        console.warn('No encryption keys found in IndexedDB for user:', user._id);
        
        const fallbackKeyData = await getEncryptedPrivateKey(user.email);
        if (fallbackKeyData) {
          console.log(' Found keys with email, updating to use userId...');
          await saveEncryptedPrivateKey(user._id, {
            encryptedPrivateKey: fallbackKeyData.encryptedPrivateKey,
            salt: fallbackKeyData.salt,
            iv: fallbackKeyData.iv,
          });
        } else {
          toast.error('Encryption keys not found. Please sign up again.');
          get().connectSocket();
          return;
        }
      }
      
      console.log('Decrypting private key with password...');
      
      try {
        const finalKeyData = encryptedKeyData || await getEncryptedPrivateKey(user._id);
        const privateKey = await decryptPrivateKey(finalKeyData, data.password);
        
        console.log('Loading private key into memory...');
        
        const encStore = useEncryptionStore.getState();
        encStore.setMyPrivateKey(privateKey);
        
        set({ needsPasswordUnlock: false }); //  Keys unlocked, no prompt needed
        
        console.log(' E2EE login complete - private key loaded in memory');
        toast.success('Logged in successfully');
      } catch (decryptError) {
        console.error('Failed to decrypt private key:', decryptError);
        toast.error('Failed to decrypt encryption keys. Wrong password?');
      }
      
      get().connectSocket();
    } catch (error) {
      const msg = get()._getErrorMessage(error, 'Login failed');
      toast.error(msg);
      console.error('Login error:', error);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async (googleToken) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post('/auth/google-check',{token: googleToken});
      let found = res.data.found;
      console.log(found);
      let user;
      if(found){
        console.log('Logging in...');
      
        const res = await axiosInstance.post('/auth/google-login', {
          token: googleToken,
        });
        user = res.data;
        set({ authUser: res.data });
        // toast.success('Logged in successfully!');
        // get().connectSocket();
      }
      else{
        console.log('Generating encryption keys on client...');
      
        const { publicKeyPem, privateKeyArrayBuffer } = await generateRSAKeyPair();
        
        console.log('Encrypting private key with password...');

        const res = await axiosInstance.post('/auth/google-login', {
          publicKey: publicKeyPem,
          token: googleToken,
        });

        // password is required but google oAuth does not store any passowrd
        // so we can explicitly demand a password a user freshly registers.. and then use that password to encrpyt the
        // private key
        
        const encryptedPrivateKeyData = await encryptPrivateKey(
          privateKeyArrayBuffer,
          res.data.password
        );
        
        console.log('Storing encrypted private key in IndexedDB...');
        
        await saveEncryptedPrivateKey(res.data.email, encryptedPrivateKeyData);

        console.log('Logging in...');
        user = res.data;
        set({ authUser: res.data });

        // toast.success('Logged in successfully!');
        // get().connectSocket();
      }
      console.log('Looking for encrypted private key in IndexedDB...');
      
      const encryptedKeyData = await getEncryptedPrivateKey(user._id);
      
      if (!encryptedKeyData) {
        console.warn('No encryption keys found in IndexedDB for user:', user._id);
        
        const fallbackKeyData = await getEncryptedPrivateKey(user.email);
        if (fallbackKeyData) {
          console.log(' Found keys with email, updating to use userId...');
          await saveEncryptedPrivateKey(user._id, {
            encryptedPrivateKey: fallbackKeyData.encryptedPrivateKey,
            salt: fallbackKeyData.salt,
            iv: fallbackKeyData.iv,
          });
        } else {
          toast.error('Encryption keys not found. Please sign up again.');
          get().connectSocket();
          return;
        }
      }
      
      console.log('Decrypting private key with password...');
      
      try {
        const finalKeyData = encryptedKeyData || await getEncryptedPrivateKey(user._id);
        const privateKey = await decryptPrivateKey(finalKeyData, data.password);
        
        console.log('Loading private key into memory...');
        
        const encStore = useEncryptionStore.getState();
        encStore.setMyPrivateKey(privateKey);
        
        set({ needsPasswordUnlock: false }); //  Keys unlocked, no prompt needed
        
        console.log(' E2EE login complete - private key loaded in memory');
        toast.success('Logged in successfully');

      } catch (decryptError) {
        console.error('Failed to decrypt private key:', decryptError);
        toast.error('Failed to decrypt encryption keys. Wrong password?');
      }
      get().connectSocket();

    }catch (error) {
      const msg = get()._getErrorMessage(error, 'Google login failed');
      toast.error(msg);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      set({ authUser: null, needsPasswordUnlock: false }); //  Reset unlock flag
      set({ blockedUsers: [] });
      toast.success('Logged out successfully');
      get().disconnectSocket();
  
      try {
        const encStore = useEncryptionStore.getState();
        if (encStore && typeof encStore.clearEncryptionData === 'function') {
          encStore.clearEncryptionData();
          console.log('🧹 Cleared encryption keys from memory');
        }
      } catch (err) {
        console.warn('Unable to clear encryption data on logout:', err);
      }
    } catch (error) {
      const msg = get()._getErrorMessage(error, 'Logout failed');
      toast.error(msg);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put('/auth/update-profile', data);
      set({ authUser: res.data });
      toast.success('Profile updated successfully');
    } catch (error) {
      const msg = get()._getErrorMessage(error, 'Failed to update profile');
      toast.error(msg);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
    });
    socket.connect();
    set({ socket: socket });

    socket.on('getOnlineUsers', (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on('userTyping', ({ userId }) => {
      const blocked = get().blockedUsers.map((u) => (u._id ? u._id : u));
      const currentUser = get().authUser;
      if (blocked.includes(userId)) return;
      set((state) => ({
        typingUsers: { ...state.typingUsers, [userId]: true },
      }));
    });

    socket.on('userStopTyping', ({ userId }) => {
      const blocked = get().blockedUsers.map((u) => (u._id ? u._id : u));
      if (blocked.includes(userId)) return;
      set((state) => {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[userId];
        return { typingUsers: newTypingUsers };
      });
    });

    socket.on('newMessage', async (message) => {
      try {
        const mod = await import('./useChatStore');
        const chatStore = mod.useChatStore;
        if (chatStore && typeof chatStore.getState === 'function') {
          const { selectedUser } = chatStore.getState();
          const currentUser = get().authUser;
          const blocked = get().blockedUsers.map((u) => (u._id ? u._id : u));
          if (blocked.includes(message.senderId)) return;
          
          if (message.isEncrypted && message.encryptedText) {
            try {
              const modEnc = await import('./useEncryptionStore');
              const decrypt = modEnc.useEncryptionStore.getState().decryptReceivedMessage;
              message.text = await decrypt(message.encryptedText, message.senderId);
            } catch (error) {
              message.text = '[Encrypted message - unable to decrypt]';
            }
          }
          
          const appendMessage = () => chatStore.setState((s) => ({ messages: [...s.messages, message] }));
          if (selectedUser && message.senderId === selectedUser._id) {
            appendMessage();
            try {
              if (!message.groupId && currentUser && message.receiverId === currentUser._id) {
                const s = get().socket;
                if (s && s.connected) s.emit('messageRead', { messageId: message._id });
              }
            } catch (err) {
              console.warn('Failed to emit messageRead:', err);
            }
          } else {
            appendMessage();
            if (currentUser && message.senderId !== currentUser._id) {
              chatStore.getState().notifyNewMessage(message, { isGroup: false });
            }
            try {
              if (!message.groupId && currentUser && message.receiverId === currentUser._id) {
                const s = get().socket;
                if (s && s.connected) s.emit('messageDelivered', { messageId: message._id });
              }
            } catch (err) {
              console.warn('Failed to emit messageDelivered:', err);
            }
          }
        }
      } catch (err) {
        console.warn('global newMessage handler error', err);
      }
    });

    socket.on('newGroupMessage', async (message) => {
      try {
        console.debug('[socket] newGroupMessage received', message);
        const mod = await import('./useChatStore');
        const chatStore = mod.useChatStore;
        const currentUser = get().authUser;
        const blocked = get().blockedUsers.map((u) => (u._id ? u._id : u));
        if (blocked.includes(message.senderId)) return;
        if (!chatStore || !currentUser) return;

        const selectedGroup = chatStore.getState().selectedGroup;
        chatStore.setState((s) => ({
          groupMessages: [...s.groupMessages, message],
        }));

        if (!selectedGroup || message.groupId !== selectedGroup._id) {
          if (message.senderId !== currentUser._id) {
            chatStore.getState().notifyNewMessage(message, { isGroup: true });
          }
        }
      } catch (err) {
        console.warn('global newGroupMessage handler error', err);
      }
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
