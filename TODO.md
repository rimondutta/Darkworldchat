# TODO: Implement Typing Indicator and Last Seen Status

## Backend Changes

- [x] Update User model to include `lastSeen` field
- [x] Modify socket.js to update `lastSeen` on disconnect
- [x] Add socket event handlers for "startTyping" and "stopTyping"
- [x] Update message controller to include `lastSeen` in user data

## Frontend Changes

- [x] Update useAuthStore to handle typing indicators
- [x] Update useChatStore to fetch and display last seen status
- [x] Modify MessageInput to emit typing events
- [x] Update ChatHeader to show typing indicator and last seen status
- [x] Update Sidebar to display last seen in user info
