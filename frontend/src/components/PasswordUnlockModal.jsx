import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, X } from 'lucide-react';

function PasswordUnlockModal() {
  const { needsPasswordUnlock, unlockEncryptionKeys } = useAuthStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(true);

  if (!needsPasswordUnlock || !showModal) return null;

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      alert('Please enter your password');
      return;
    }

    setLoading(true);
    const success = await unlockEncryptionKeys(password);
    setLoading(false);
    
    if (success) {
      setPassword('');
      setShowModal(false);
    }
  };

  const handleSkip = () => {
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Unlock Encryption</h3>
              <p className="text-sm text-gray-600">Enter password to decrypt messages</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border text-gray-900 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-900 mt-4">
          💡 Your messages are encrypted. Enter your password to read them.
        </p>
      </div>
    </div>
  );
}

export default PasswordUnlockModal;
