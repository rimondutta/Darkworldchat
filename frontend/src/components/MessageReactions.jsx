import { useState, useEffect, useRef } from 'react';
import { SmilePlus } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from '../lib/toast';
import { useAuthStore } from '../store/useAuthStore';
import './Chat.css';

// Common emoji list for reactions
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions = ({ message, isOwnMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [existingReactions, setExistingReactions] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
  const { authUser } = useAuthStore();
  const emojiPickerRef = useRef(null);

  // Group reactions by emoji and count them
  useEffect(() => {
    if (message.reactions && message.reactions.length > 0) {
      const counts = {};
      const userReactions = [];

      message.reactions.forEach((reaction) => {
        if (!counts[reaction.emoji]) {
          counts[reaction.emoji] = {
            count: 0,
            users: [],
          };
        }

        counts[reaction.emoji].count += 1;
        counts[reaction.emoji].users.push({
          id: reaction.userId?._id || reaction.userId,
          name: reaction.userId?.fullName || 'User',
          profilePic: reaction.userId?.profilePic,
        });

        if (reaction.userId?._id === authUser?._id || reaction.userId === authUser?._id) {
          userReactions.push(reaction.emoji);
        }
      });

      setReactionCounts(counts);
      setExistingReactions(userReactions);
    } else {
      setReactionCounts({});
      setExistingReactions([]);
    }
  }, [message.reactions, authUser?._id]);

  // Close emoji picker when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle adding/removing reaction
  const handleReactionClick = async (emoji) => {
    try {
      // Optimistic UI update for better user experience
      const isRemoving = existingReactions.includes(emoji);

      if (isRemoving) {
        // Remove reaction locally
        setExistingReactions((prev) => prev.filter((e) => e !== emoji));

        // Update counts
        setReactionCounts((prev) => {
          const newCounts = { ...prev };
          if (newCounts[emoji]) {
            newCounts[emoji].count -= 1;
            newCounts[emoji].users = newCounts[emoji].users.filter((u) => u.id !== authUser._id);

            if (newCounts[emoji].count === 0) {
              delete newCounts[emoji];
            }
          }
          return newCounts;
        });
      } else {
        // Add reaction locally
        setExistingReactions((prev) => [...prev, emoji]);

        // Update counts
        setReactionCounts((prev) => {
          const newCounts = { ...prev };
          if (!newCounts[emoji]) {
            newCounts[emoji] = { count: 0, users: [] };
          }
          newCounts[emoji].count += 1;
          newCounts[emoji].users.push({
            id: authUser._id,
            name: authUser.fullName || 'You',
            profilePic: authUser.profilePic,
          });
          return newCounts;
        });
      }

      // Send to server
      await axiosInstance.post(`/messages/reaction/${message._id}`, { emoji });
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');

      // Revert optimistic update on error
      // Re-fetch reactions from the message object
      if (message.reactions && message.reactions.length > 0) {
        const counts = {};
        const userReactions = [];

        message.reactions.forEach((reaction) => {
          if (!counts[reaction.emoji]) {
            counts[reaction.emoji] = { count: 0, users: [] };
          }
          counts[reaction.emoji].count += 1;
          counts[reaction.emoji].users.push({
            id: reaction.userId?._id || reaction.userId,
            name: reaction.userId?.fullName || 'User',
            profilePic: reaction.userId?.profilePic,
          });

          if (reaction.userId?._id === authUser?._id || reaction.userId === authUser?._id) {
            userReactions.push(reaction.emoji);
          }
        });

        setReactionCounts(counts);
        setExistingReactions(userReactions);
      }
    }
  };

  // Render emoji reactions with counts
  const renderReactionCounts = () => {
    return Object.keys(reactionCounts).map((emoji) => {
      const reaction = reactionCounts[emoji];
      const isSelected = existingReactions.includes(emoji);
      const userNames = reaction.users.map((u) => u.name).join(', ');

      return (
        <button
          key={emoji}
          className={`btn btn-xs ${isSelected ? 'btn-accent' : 'btn-ghost'} rounded-full min-w-8 h-7`}
          onClick={() => handleReactionClick(emoji)}
          title={`${userNames} reacted with ${emoji}`}
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </button>
      );
    });
  };

  return (
    <div className="message-actions">
      {/* Display reaction counts */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex flex-wrap gap-1 mr-2">{renderReactionCounts()}</div>
      )}

      {/* Reaction button */}
      <div className="relative">
        <button
          className="reaction-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add reaction"
        >
          <SmilePlus size={14} />
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-6 bg-base-200 shadow-lg rounded-lg p-2 z-20`}
          >
            <div className="flex flex-wrap gap-1 max-w-48">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="btn btn-ghost btn-xs p-1 hover:bg-base-300"
                  onClick={() => handleReactionClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
