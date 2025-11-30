import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../store/useChatStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { formatMessageTime } from '../lib/utils';
import MessageReactions from './MessageReactions';
import { VoicePlayer } from './VoiceMessage';
import './Chat.css';

const GroupChatContainer = ({ showSidebar, setShowSidebar }) => {
  const {
    users,
    isUsersLoading,
    setSelectedGroup,
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    addGroupMembers,
    removeGroupMembers,
    leaveGroup,
    addGroupAdmin,
    removeGroupAdmin,
    getGroups,
    removeGroupLocally,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [memberIds, setMemberIds] = useState(new Set(selectedGroup.members.map((m) => m._id)));
  const [adminIds, setAdminIds] = useState(new Set(selectedGroup.admin.map((a) => a)));

  useEffect(() => {
    if (!selectedGroup?._id) return;
    getGroupMessages(selectedGroup._id);
    subscribeToGroupMessages(selectedGroup._id);
    setAdminIds(new Set(selectedGroup.admin.map((a) => a)));
    setMemberIds(new Set(selectedGroup.members.map((m) => m._id)));
    return () => {
      unsubscribeFromGroupMessages(selectedGroup._id);
    };
  }, [selectedGroup?._id]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages]);

  const handleAddMembers = async (userId) => {
    try {
      if (!userId) {
        alert('Please select the user.');
        return;
      }
      const data = await addGroupMembers(selectedGroup._id, userId);
      setMemberIds(new Set(data.members.map((m) => m)));
      alert('Members added successfully!');
      await getGroups();
      const { groups } = useChatStore.getState();
      const updatedGroup = groups.find((g) => g._id === selectedGroup?._id) || null;
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members');
    }
  };

  const handleRemoveMembers = async (userId) => {
    try {
      if (!userId) {
        alert('Please select the user.');
        return;
      }
      const data = await removeGroupMembers(selectedGroup._id, userId);
      setMemberIds(new Set(data.members.map((m) => m)));
      alert('Members removed successfully!');
      await getGroups();
      const { groups } = useChatStore.getState();
      const updatedGroup = groups.find((g) => g._id === selectedGroup?._id) || null;
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members');
    }
  };

  const handleAddAdmin = async (userId) => {
    try {
      if (!userId) {
        alert('Please select the user.');
        return;
      }
      const data = await addGroupAdmin(selectedGroup._id, userId);
      setAdminIds(new Set(data.admin.map((a) => a)));
      alert('Admin added successfully!');
      await getGroups();
      const { groups } = useChatStore.getState();
      const updatedGroup = groups.find((g) => g._id === selectedGroup?._id) || null;
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      if (!userId) {
        alert('Please select the user.');
        return;
      }
      const data = await removeGroupAdmin(selectedGroup._id, userId);
      setAdminIds(new Set(data.admin.map((a) => a)));
      alert('Admin removed successfully!');
      await getGroups();
      const { groups } = useChatStore.getState();
      const updatedGroup = groups.find((g) => g._id === selectedGroup?._id) || null;
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to add admin');
    }
  };
  const nonMembers = users.filter((user) => !memberIds.has(user._id));
  const memberUsers = users.filter((user) => !nonMembers.some((non) => non._id === user._id));

  const isAdmin = selectedGroup.admin.includes(authUser._id);

  if (isGroupMessagesLoading || isUsersLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader isGroup showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
        <MessageSkeleton />
        <MessageInput isGroup />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader
        isGroup
        groupName={selectedGroup?.name}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />

      {isAdmin ? (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={() => setShowManageMembers(true)}
            className="px-3 py-1.5 rounded-md btn btn-outline border bg-base-100 border-gray-300 hover:bg-base-300 text-sm font-medium"
          >
            Manage Members/Admins
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            leaveGroup(selectedGroup._id);
            removeGroupLocally(selectedGroup._id);
            setSelectedGroup(null);
          }}
          className="px-3 py-1.5 rounded-md btn btn-outline border text-red-400 bg-base-100 border-gray-300 hover:bg-base-300 text-sm font-medium"
        >
          Leave Group
        </button>
      )}

      {showManageMembers && (
        <div className="fixed inset-0 flex items-center justify-center bg-base-300 z-50">
          <div className="bg-base-100 p-5 rounded-2xl shadow-xl w-[400px]">
            <h2 className="text-lg font-semibold mb-3">Manage Members</h2>

            <div className="flex gap-2 mb-4 border-b pb-2">
              <button
                className={`flex-1 py-1 text-sm font-medium border-b-2 ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
                onClick={() => setActiveTab('add')}
              >
                Add
              </button>
              <button
                className={`flex-1 py-1 text-sm font-medium border-b-2 ${
                  activeTab === 'remove'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500'
                }`}
                onClick={() => setActiveTab('remove')}
              >
                Remove
              </button>
              <button
                className={`flex-1 py-1 text-sm font-medium border-b-2 ${
                  activeTab === 'admin'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500'
                }`}
                onClick={() => setActiveTab('admin')}
              >
                Manage Admins
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
              {activeTab === 'add' &&
                (nonMembers.length > 0 ? (
                  nonMembers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between py-1 px-2 hover:bg-base-300 rounded-md"
                    >
                      <span>{user.fullName}</span>
                      <button
                        onClick={() => handleAddMembers(user._id)}
                        className="text-blue-600 text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))
                ) : (
                  <div>All contacts are added</div>
                ))}
              {activeTab === 'remove' &&
                memberUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between py-1 px-2 hover:bg-base-300 rounded-md"
                  >
                    <span>{user.fullName}</span>
                    <button
                      onClick={() => handleRemoveMembers(user._id)}
                      className="text-red-600 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}

              {activeTab === 'admin' &&
                memberUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between py-1 px-2 hover:bg-base-300 rounded-md"
                  >
                    <span>{user.fullName}</span>
                    {adminIds.has(user._id) ? (
                      <button
                        onClick={() => handleRemoveAdmin(user._id)}
                        className="text-red-600 text-sm font-medium"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddAdmin(user._id)}
                        className="text-green-600 text-sm font-medium"
                      >
                        Promote
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <button
              onClick={() => setShowManageMembers(false)}
              className="w-full py-1.5 rounded-md btn btn-outline bg-base-100 hover:bg-base-300 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {groupMessages.map((msg) => {
          const isOwnMessage = msg.senderId._id === authUser._id;
          return (
            <div key={msg._id} className="message-container">
              <div className={`flex ${isOwnMessage ? 'message-right' : 'message-left'}`}>
                {/* Profile picture */}
                {!isOwnMessage && (
                  <div className="avatar-container">
                    <div className="avatar-image">
                      <img src={msg.senderId.profilePic || '/avatar.png'} alt="user" />
                    </div>
                  </div>
                )}

                <div className="message-content">
                  {/* Message header with name and time */}
                  <div className="message-header">
                    <span className="font-semibold">
                      {isOwnMessage ? 'You' : msg.senderId.fullName}
                    </span>
                    <time className="ml-2">
                      {formatMessageTime(msg.createdAt)}
                      {isOwnMessage && (
                        <span className="message-status" aria-hidden>
                          {(() => {
                            if (msg.read) {
                              return (
                                <>
                                  <svg className="tick read" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 13l4 4L11 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <svg className="tick read" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 13l4 4L21 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </>
                              );
                            }
                            if (msg.delivered) {
                              return (
                                <>
                                  <svg className="tick" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 13l4 4L11 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <svg className="tick" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 13l4 4L21 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </>
                              );
                            }
                            return (
                              <svg className="tick" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 13l4 4L11 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            );
                          })()}
                        </span>
                      )}
                    </time>
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`message-bubble ${isOwnMessage ? 'sender-bubble' : 'receiver-bubble'}`}
                  >
                    {msg.image && (
                      <img src={msg.image} alt="Attachment" className="message-image" />
                    )}
                    {msg.text && <p>{msg.text}</p>}
                    {msg.voiceMessage && (
                      <VoicePlayer
                        url={msg.voiceMessage}
                        duration={msg.voiceDuration}
                        waveform={msg.voiceWaveform}
                      />
                    )}
                  </div>

                  {/* Reactions */}
                  <div className="message-actions">
                    <MessageReactions message={msg} isOwnMessage={isOwnMessage} />
                  </div>
                </div>

                {isOwnMessage && (
                  <div className="avatar-container">
                    <div className="avatar-image">
                      <img src={authUser?.profilePic || '/avatar.png'} alt="user" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      <MessageInput isGroup />
    </div>
  );
};

export default GroupChatContainer;
