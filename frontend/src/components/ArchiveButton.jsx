import { Archive, CornerDownLeft } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const ArchiveButton = ({ userId, isArchived }) => {
  const { archiveChat, unarchiveChat } = useChatStore();

  const handleClick = (e) => {
    e.stopPropagation(); // prevent selecting the chat
    if (isArchived) {
      unarchiveChat(userId);
    } else {
      archiveChat(userId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="btn btn-sm btn-ghost flex items-center gap-1"
      title={isArchived ? 'Unarchive Chat' : 'Archive Chat'}
    >
      {isArchived ? <CornerDownLeft size={16} /> : <Archive size={16} />}
    </button>
  );
};

export default ArchiveButton;
