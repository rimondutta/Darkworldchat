import express from 'express';
import {
  signup,
  verifyOTP,
  resendOTP,
  googleLogin,
  login,
  logout,
  updateProfile,
  checkAuth,
  blockUser,
  unblockUser,
  getBlockedUsers,
  googleCheck,
} from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google-login', googleLogin);
router.post('/google-check',googleCheck);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute, updateProfile);
router.get('/check', protectRoute, checkAuth);
router.post('/block/:id', protectRoute, blockUser);
router.post('/unblock/:id', protectRoute, unblockUser);
router.get('/blocked', protectRoute, getBlockedUsers);

export default router;
