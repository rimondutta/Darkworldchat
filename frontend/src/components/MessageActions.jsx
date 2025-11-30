import { useState } from 'react';
import { Edit, Trash2, Info } from 'lucide-react';
import './Chat.css';

const MessageActions = ({ message, onEdit, onDelete }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate if message is still editable (within 2 minutes)
  const twoMinutesMs = 2 * 60 * 1000;
  const messageTime = new Date(message.createdAt).getTime();
  const isEditable = Date.now() - messageTime <= twoMinutesMs;

  const handleEditClick = () => {
    if (isEditable) {
      onEdit(message);
    } else {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
  };

  return (
    <div className="flex ml-2 gap-1">
      <button
        className="reaction-button"
        onClick={handleEditClick}
        title={isEditable ? 'Edit message' : 'Can only edit within 2 minutes'}
      >
        <Edit size={14} color={isEditable ? 'currentColor' : '#888'} />
      </button>

      <button
        className="reaction-button text-error"
        onClick={() => onDelete(message._id)}
        title="Delete message"
      >
        <Trash2 size={14} />
      </button>

      {/* Info button with tooltip */}
      <div className="relative">
        <button
          className="reaction-button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title="Message edit rules"
        >
          <Info size={14} />
        </button>

        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-base-300 text-xs rounded-md shadow-lg w-48 z-10">
            Messages can only be edited:
            <ul className="list-disc pl-4 mt-1">
              <li>Within 2 minutes</li>
              <li>If it's your last message</li>
              <li>If it's a text message (not media)</li>
              <li>If it's not encrypted</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageActions;
