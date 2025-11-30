import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getUserGroups,
  createGroup,
  addMembers,
  removeMembers,
  leaveGroup,
  addAdmin,
  removeAdmin,
  updateGroupDescription,
} from '../controllers/group.controller.js';

const router = express.Router();
router.post('/create', protectRoute, createGroup);
router.post('/:groupId/add-members', protectRoute, addMembers);
router.post('/:groupId/remove-members', protectRoute, removeMembers);
router.get('/my-groups', protectRoute, getUserGroups);
router.post('/:groupId/leave-group', protectRoute, leaveGroup);
router.post('/:groupId/add-admin', protectRoute, addAdmin);
router.post('/:groupId/remove-admin', protectRoute, removeAdmin);
router.put('/:groupId/description', protectRoute, updateGroupDescription);

export default router;
