import { Shield, ShieldOff } from 'lucide-react';
import { useEncryptionStore } from '../store/useEncryptionStore';

const EncryptionToggle = () => {
  const { isEncryptionEnabled, setEncryptionEnabled } = useEncryptionStore();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEncryptionEnabled(!isEncryptionEnabled)}
        className={`btn btn-sm ${
          isEncryptionEnabled ? 'btn-success text-white' : 'btn-ghost text-base-content/70'
        }`}
        title={
          isEncryptionEnabled ? 'End-to-End Encryption Enabled' : 'End-to-End Encryption Disabled'
        }
      >
        {isEncryptionEnabled ? <Shield className="size-4" /> : <ShieldOff className="size-4" />}
        <span className="hidden sm:inline">
          {isEncryptionEnabled ? 'Encrypted' : 'Not Encrypted'}
        </span>
      </button>
    </div>
  );
};

export default EncryptionToggle;
