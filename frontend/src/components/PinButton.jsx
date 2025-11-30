import { Pin, PinOff } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const PinButton = ({ userId, className = '' }) => {
  const { pinChat, unpinChat, isChatPinned } = useChatStore();
  const isPinned = isChatPinned(userId);

  const handleTogglePin = (e) => {
    e.stopPropagation(); // Prevent triggering chat selection
    if (isPinned) {
      unpinChat(userId);
    } else {
      pinChat(userId);
    }
  };

  return (
    <button
      onClick={handleTogglePin}
      className={`btn btn-ghost btn-sm ${className} ${
        isPinned ? 'text-primary' : 'text-base-content/50 hover:text-base-content'
      }`}
      title={isPinned ? 'Unpin chat' : 'Pin chat'}
    >
      {isPinned ? <Pin className="size-4 fill-current" /> : <PinOff className="size-4" />}
    </button>
  );
};

export default PinButton;
