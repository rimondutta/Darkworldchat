import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  getUserPublicKey,
  pinChat,
  unpinChat,
  getPinnedChats,
  archiveChat,
  unarchiveChat,
  getArchivedChats,
  editMessage,
  deleteMessage,
} from '../controllers/message.controller.js';
import { addReaction, getReactions, removeReaction } from '../controllers/reaction.controller.js';

const router = express.Router();

router.get('/users', protectRoute, getUsersForSidebar);
router.get('/:id', protectRoute, getMessages);
router.get('/publickey/:id', protectRoute, getUserPublicKey);
router.get('/pinned/chats', protectRoute, getPinnedChats);

router.post('/send/:id', protectRoute, sendMessage);
router.post('/pin/:id', protectRoute, pinChat);
router.post('/unpin/:id', protectRoute, unpinChat);
router.get('/archived/chats', protectRoute, getArchivedChats);
router.post('/archive/:id', protectRoute, archiveChat);
router.post('/unarchive/:id', protectRoute, unarchiveChat);
router.put('/edit/:messageId', protectRoute, editMessage);
router.delete('/delete/:messageId', protectRoute, deleteMessage);

// Message reactions routes
router.post('/reaction/:messageId', protectRoute, addReaction);
router.get('/reaction/:messageId', protectRoute, getReactions);
router.delete('/reaction/:messageId', protectRoute, removeReaction);

export default router;
