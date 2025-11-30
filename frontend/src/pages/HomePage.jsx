import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore.js';

import Sidebar from '../components/Sidebar';
import NoChatSelected from '../components/NoChatSelected';
import ChatContainer from '../components/ChatContainer';
import GroupChatContainer from '../components/GroupChatContainer.jsx';
import { Menu, X } from 'lucide-react';

const HomePage = () => {
  const { selectedUser, selectedGroup } = useChatStore();

  /* RESPONSIVE: State to control sidebar visibility on mobile */
  const [showSidebar, setShowSidebar] = useState(true);

  /* RESPONSIVE: Automatically hide sidebar when a chat is selected on mobile */
  React.useEffect(() => {
    if (selectedUser || selectedGroup) {
      // On mobile, hide sidebar when chat is selected
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    }
  }, [selectedUser, selectedGroup]);

  return (
    <div className="h-screen bg-base-200 overflow-hidden">
      <div className="flex items-center justify-center h-full px-4  pt-20">
        <div className="bg-base-100 rounded-lg shadow-cl w-full h-full sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)] max-w-7xl relative">
          <div className="flex h-full rounded-lg overflow-hidden relative">
            {/* RESPONSIVE: Sidebar with mobile overlay behavior */}
            <div
              className={`
                ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                transition-transform duration-300 ease-in-out
                absolute lg:relative
                inset-y-0 left-0
                z-40 lg:z-auto
                w-full sm:w-80 lg:w-72
                bg-base-100
                lg:bg-transparent
              `}
            >
              {/* RESPONSIVE: Close button for mobile sidebar */}

              <Sidebar setShowSidebar={setShowSidebar} />
            </div>

            {/* RESPONSIVE: Backdrop overlay for mobile when sidebar is open */}
            {showSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* RESPONSIVE: Main chat area */}
            <div className="flex-1 flex overflow-hidden w-full lg:w-auto">
              {!selectedUser ? (
                !selectedGroup ? (
                  <NoChatSelected setShowSidebar={setShowSidebar} />
                ) : (
                  <GroupChatContainer showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
                )
              ) : (
                <ChatContainer showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
