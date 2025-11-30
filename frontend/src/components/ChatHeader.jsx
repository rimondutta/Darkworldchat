import { X, Users, Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import EncryptionToggle from './EncryptionToggle';
import PinButton from './PinButton';
import GroupInfoPopup from '../components/GroupInfoPopup.jsx';
import { useEffect, useState } from 'react';

const ChatHeader = ({ isGroup = false, showSidebar, setShowSidebar }) => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup, userLastSeen } =
    useChatStore();

  const { onlineUsers, typingUsers } = useAuthStore();
  const { blockedUsers } = useAuthStore();
  const blockUser = useAuthStore((s) => s.blockUser);
  const unblockUser = useAuthStore((s) => s.unblockUser);
  const [isTyping, setIsTyping] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    setIsTyping(typingUsers[selectedUser?._id] || false);
  }, [typingUsers, selectedUser?._id]);

  const chatTarget = isGroup ? selectedGroup : selectedUser;
  if (!chatTarget) return null;

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* RESPONSIVE: Mobile menu button - only visible when chat is active and sidebar is hidden */}
            {(selectedUser || selectedGroup) && !showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className=" z-50 lg:hidden btn btn-circle btn-sm bg-base-300 border-none shadow-lg"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                {isGroup ? (
                  <div className="bg-primary text-white flex items-center justify-center size-10 rounded-full text-lg font-semibold uppercase">
                    {chatTarget.name?.charAt(0) || 'G'}
                  </div>
                ) : (
                  <img
                    src={chatTarget?.profilePic || '/avatar.png'}
                    alt={chatTarget?.fullName || chatTarget?.name || ''}
                  />
                )}
              </div>
            </div>

            {/* User info */}
            <div>
              <h3
                className="font-medium cursor-pointer hover:underline"
                onClick={() => isGroup && setShowGroupInfo(true)}
              >
                {isGroup ? chatTarget.name : chatTarget.fullName || chatTarget.name || ''}
              </h3>
              <p className="text-sm text-base-content/70">
                {isTyping
                  ? 'Typing...'
                  : onlineUsers.includes(selectedUser?._id)
                    ? 'Online'
                    : 'Offline'}
              </p>

              {isGroup ? (
                <p className="text-sm text-base-content/70 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {chatTarget.members?.length || 0} members
                </p>
              ) : (
                <p className="text-sm text-base-content/70">
                  {/* {onlineUsers.includes(chatTarget._id) ? "Online" : "Offline"} */}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isGroup && <PinButton userId={chatTarget._id} />}
            {!isGroup &&
              (() => {
                const blocked = blockedUsers.map((u) => (u._id ? u._id : u));
                const isBlocked = blocked.includes(chatTarget._id);
                return isBlocked ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => unblockUser(chatTarget._id)}
                  >
                    Unblock
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => blockUser(chatTarget._id)}
                  >
                    Block
                  </button>
                );
              })()}
            <EncryptionToggle />

            {/* Close */}
            <button onClick={() => (isGroup ? setSelectedGroup(null) : setSelectedUser(null))}>
              <X />
            </button>

            {showGroupInfo && (
              <GroupInfoPopup group={selectedGroup} onClose={() => setShowGroupInfo(false)} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
