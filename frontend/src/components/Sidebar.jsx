import { useEffect, useMemo, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import ContactListSkeleton from './skeletons/ContactListSkeleton';
import { Users, Pin, UsersRound, X } from 'lucide-react';
import PinButton from './PinButton';
import ArchiveButton from './ArchiveButton';
import GroupSidebarIcon from './groupsSidebarIcon';

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return '';
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffInMs = now - lastSeenDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return lastSeenDate.toLocaleDateString();
};

const Sidebar = ({ setShowSidebar }) => {
  const {
    getUsers,
    users,
    getGroups,
    groups,
    addGroup,
    pinnedChats,
    selectedUser,
    setSelectedUser,
    selectedGroup,
    setSelectedGroup,
    isUsersLoading,
    isGroupsLoading,
    isChatArchived,
    isChatPinned,
    isGroupCreating,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [createGroup, setCreateGroup] = useState(false);

  const [query, setQuery] = useState('');

  // Debounce query
  const debouncedQuery = useMemo(() => query, [query]);

  useEffect(() => {
    const id = setTimeout(() => {
      getUsers(debouncedQuery || undefined);
    }, 300);
    return () => clearTimeout(id);
  }, [getUsers, debouncedQuery]);

  useEffect(() => {
    getGroups();
  }, []);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Separate pinned , archived and unpinned , unarchived users

  //for archived users
  const archivedUsers = filteredUsers.filter((user) => isChatArchived(user._id));
  //for pinned users but not archived one
  const pinnedUsers = filteredUsers.filter(
    (user) => isChatPinned(user._id) && !isChatArchived(user._id)
  );
  //for users with not pinned and archived
  const unpinnedUsers = filteredUsers.filter(
    (user) => !isChatPinned(user._id) && !isChatArchived(user._id)
  );

  // Combine with pinned users first
  const sortedUsers = [...pinnedUsers, ...unpinnedUsers];
  const [groupName, setGroupName] = useState('');

  const handleCreateGroup = () => {
    if (!groupName.trim()) return alert('Please enter a group name.');
    addGroup(JSON.stringify({ name: groupName }));

    setCreateGroup(false);
    setGroupName('');
  };

  useEffect(() => {}, [selectedGroup]);

  if (isUsersLoading || isGroupsLoading || isGroupCreating) return <ContactListSkeleton />;

  return (
    /* RESPONSIVE: Sidebar - full width on mobile when visible, fixed width on desktop */
    <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* RESPONSIVE: Header with mobile-friendly layout */}
      <div className="border-b border-base-300 w-full p-4 lg:p-5 relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium">Contacts</span>
          </div>
          {/* RESPONSIVE: Create Group button - visible on all screens */}
          <button
            className="flex items-center gap-1 btn-success text-white btn btn-sm"
            onClick={() => setCreateGroup(true)}
          >
            <UsersRound size={18} />
            <span>Create Group</span>
          </button>

          {selectedUser || selectedGroup ? (
            <button
              onClick={() => setShowSidebar(false)}
              className=" lg:hidden btn btn-circle btn-sm btn-ghost"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          ) : (
            <></>
          )}
        </div>

        {/* RESPONSIVE: Modal with mobile-friendly sizing */}
        {createGroup && (
          <div
            onClick={() => setCreateGroup(false)}
            className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4"
          >
            {/* Modal Box */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-base-200 w-full max-w-[320px] sm:max-w-[380px] rounded-2xl shadow-lg p-4 sm:p-5 relative animate-fadeIn"
            >
              {/* Cancel (X) Button */}
              <button
                onClick={() => setCreateGroup(false)}
                className="absolute top-3 right-3 text-white hover:text-gray-300"
              >
                <X size={18} />
              </button>

              <h2 className="text-base sm:text-lg font-semibold mb-3 text-white">
                Create New Group
              </h2>

              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />

              <div className="flex justify-end gap-2 mt-4 sm:mt-5">
                <button
                  onClick={() => setCreateGroup(false)}
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm btn   btn-success text-white"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESPONSIVE: Online filter - visible on all screens */}
        <div className="mt-3 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      {/* RESPONSIVE: Search bar - visible on all screens */}
      <div className="border-b border-base-300 w-full p-3">
        <input
          type="text"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input input-sm input-bordered w-full"
        />
      </div>

      {/* RESPONSIVE: Scrollable contacts list */}
      <div className="overflow-y-auto w-full py-3">
        {isUsersLoading ? (
          <ContactListSkeleton />
        ) : (
          <>
            {/* Pinned Chats Section */}
            {pinnedUsers.length > 0 && (
              <div className="mb-4">
                <div className="px-3 mb-2 flex items-center gap-2 text-xs font-medium text-base-content/70 uppercase tracking-wider">
                  <Pin className="size-3" />
                  <span>Pinned</span>
                </div>
                {pinnedUsers.map((user) => (
                  <div
                    key={`pinned-${user._id}`}
                    className={`
                      w-full p-3 flex items-center gap-3 group relative
                      hover:bg-base-300 transition-colors
                      ${selectedUser?._id === user._id ? 'bg-base-300 ring-1 ring-base-300' : ''}
                    `}
                  >
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedGroup(null);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {/* RESPONSIVE: Avatar sizing */}
                      <div className="relative">
                        <img
                          src={user.profilePic || '/avatar.png'}
                          alt={user.name}
                          className="size-12 object-cover rounded-full"
                        />
                        {onlineUsers.includes(user._id) && (
                          <span
                            className="absolute bottom-0 right-0 size-3 bg-green-500 
                            rounded-full ring-2 ring-zinc-900"
                          />
                        )}
                      </div>

                      {/* User info - visible on all screens */}
                      <div className="text-left min-w-0">
                        <div className="font-medium truncate text-sm">{user.fullName}</div>
                        <div className="text-xs text-zinc-400">
                          {onlineUsers.includes(user._id)
                            ? 'Online'
                            : formatLastSeen(user.lastSeen)}
                        </div>
                      </div>
                    </button>

                    {/* RESPONSIVE: Action buttons - visible on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <PinButton userId={user._id} />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      <ArchiveButton userId={user._id} isArchived={isChatArchived(user._id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Archived Chats Section */}
            {archivedUsers.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="px-3 mb-2 flex items-center gap-2 text-xs font-medium text-base-content/70 uppercase tracking-wider w-full text-left"
                >
                  <Pin className="size-3" />
                  <span>Archived Chats</span>
                  <span className="ml-auto text-base">{showArchived ? '▲' : '▼'}</span>
                </button>

                {showArchived &&
                  archivedUsers.map((user) => (
                    <div
                      key={`archived-${user._id}`}
                      className={`w-full p-3 flex items-center gap-3 group relative hover:bg-base-300 transition-colors
                      ${selectedUser?._id === user._id ? 'bg-base-300 ring-1 ring-base-300' : ''}`}
                    >
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedGroup(null);
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="relative">
                          <img
                            src={user.profilePic || '/avatar.png'}
                            alt={user.name}
                            className="size-12 object-cover rounded-full"
                          />
                        </div>

                        <div className="text-left min-w-0">
                          <div className="font-medium truncate text-sm">{user.fullName}</div>
                          <div className="text-xs text-zinc-400">
                            Archived {isChatPinned(user._id) && '• Pinned'}
                          </div>
                        </div>
                      </button>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                        <ArchiveButton userId={user._id} isArchived={true} />
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Regular Chats Section */}
            {unpinnedUsers.length > 0 && pinnedUsers.length > 0 && (
              <div className="px-3 mb-2 text-xs font-medium text-base-content/70 uppercase tracking-wider">
                <span>All Chats</span>
              </div>
            )}

            {unpinnedUsers.map((user) => (
              <div
                key={user._id}
                className={`
                  w-full p-3 flex items-center gap-3 group relative
                  hover:bg-base-300 transition-colors
                  ${selectedUser?._id === user._id ? 'bg-base-300 ring-1 ring-base-300' : ''}
                `}
              >
                <button
                  onClick={() => {
                    (setSelectedUser(user), setSelectedGroup(null));
                  }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="relative">
                    <img
                      src={user.profilePic || '/avatar.png'}
                      alt={user.name}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                        rounded-full ring-2 ring-zinc-900"
                      />
                    )}
                  </div>

                  {/* User info - visible on all screens */}
                  <div className="text-left min-w-0">
                    <div className="font-medium truncate text-sm">{user.fullName}</div>
                    <div className="text-xs text-zinc-400">
                      {onlineUsers.includes(user._id) ? 'Online' : formatLastSeen(user.lastSeen)}
                    </div>
                  </div>
                </button>

                {/* Pin button - visible on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <PinButton userId={user._id} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <ArchiveButton userId={user._id} isArchived={isChatArchived(user._id)} />
                </div>
              </div>
            ))}

            {/* RESPONSIVE: Groups display */}
            {groups.length > 0 &&
              groups.map((group) => {
                const isActive = group?._id == selectedGroup?._id;
                return (
                  <GroupSidebarIcon
                    key={group._id}
                    group={group}
                    isActive={isActive}
                    onClick={() => {
                      setSelectedGroup(group);
                      setSelectedUser(null);
                    }}
                  />
                );
              })}

            {sortedUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4 text-sm px-2">No online users</div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
