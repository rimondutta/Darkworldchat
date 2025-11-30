import { useChatStore } from '../store/useChatStore';
import { useEffect, useRef, useState } from 'react';

import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageSkeleton from './skeletons/MessageSkeleton';
import MessageReactions from './MessageReactions';
import MessageActions from './MessageActions';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime, formatMessageDate, shouldShowDateSeparator } from '../lib/utils';
import { VoicePlayer } from './VoiceMessage';
import './Chat.css';

const ChatContainer = ({ showSidebar, setShowSidebar }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    editMessage,
    deleteMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle message edit
  const handleEditMessage = async (message) => {
    try {
      await editMessage(message._id, message.text);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  // Handle message delete
  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden relative bg-base-100/50">
      {/* Chat header */}
      <ChatHeader user={selectedUser} setShowSidebar={setShowSidebar} />

      {/* Chat messages */}
      <div className="flex-1 w-full overflow-y-auto p-4">
        {isMessagesLoading ? (
          // RESPONSIVE: Show loading skeletons with proper sizing
          <div className="flex flex-col space-y-4">
            <MessageSkeleton />
            <MessageSkeleton isSender={false} />
            <MessageSkeleton />
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === authUser._id;
              // Check if we should show a date separator
              const showDateSeparator = shouldShowDateSeparator(messages, index);
              return (
                <div key={message._id}>
                  {/* Date separator */}
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span className="date-separator-text">
                        {formatMessageDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* RESPONSIVE: Message container with proper alignment and sizing */}
                  <div className="message-container">
                    <div className={`flex ${isOwnMessage ? 'message-right' : 'message-left'}`}>
                      {/* Profile picture */}
                      {!isOwnMessage && (
                        <div className="avatar-container">
                          <div className="avatar-image">
                            <img
                              alt="User avatar"
                              src={
                                selectedUser?.profilePic ||
                                'https://ui-avatars.com/api/?name=' +
                                  (selectedUser?.fullName || 'User')
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="message-content">
                        {/* Message header with name and time */}
                        <div className="message-header">
                          {isOwnMessage ? 'You' : selectedUser.fullName}
                          <time className="ml-2">
                            {formatMessageTime(message.createdAt)}
                            {/* Message status ticks for own messages (single/double/green double) */}
                            {isOwnMessage && (
                              <span className="message-status" aria-hidden>
                                {(() => {
                                  // Map delivered/read -> single/double/green double
                                  if (message.read) {
                                    // double green tick
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
                                  if (message.delivered) {
                                    // double grey tick
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
                                  // single grey tick (sent but not delivered yet)
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
                          {message.image && (
                            <img src={message.image} alt="Attachment" className="message-image" />
                          )}
                          {message.text && <p>{message.text}</p>}
                          {message.voiceMessage && (
                            <>
                              <VoicePlayer
                                url={message.voiceMessage}
                                duration={message.voiceDuration || 0}
                                waveform={message.voiceWaveform || []}
                              />
                              {/* For debugging */}
                              {console.log('Rendering voice message:', message.voiceMessage)}
                            </>
                          )}
                        </div>

                        <div className="message-actions">
                          <MessageReactions message={message} isOwnMessage={isOwnMessage} />
                          {isOwnMessage && (
                            <MessageActions
                              message={message}
                              onEdit={handleEditMessage}
                              onDelete={handleDeleteMessage}
                            />
                          )}
                        </div>
                      </div>

                      {isOwnMessage && (
                        <div className="avatar-container">
                          <div className="avatar-image">
                            <img
                              alt="User avatar"
                              src={
                                authUser?.profilePic ||
                                'https://ui-avatars.com/api/?name=' + (authUser?.fullName || 'User')
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ref element to scroll to bottom */}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-2 sm:p-3 bg-base-200">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
