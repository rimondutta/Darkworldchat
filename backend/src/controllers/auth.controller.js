import User from '../models/user.model.js';
import OTP from '../models/otp.model.js';
import { generateToken } from '../lib/utils.js';
import { generateOTP } from '../lib/otp.js';
import { sendOTPEmail } from '../lib/emailService.js';
import { verifyGoogleToken } from '../lib/google.js';
import bcryptjs from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  const { fullName, email, password, publicKey } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const otp = generateOTP();
    await OTP.findOneAndUpdate({ email }, { email, otp }, { upsert: true });
    await sendOTPEmail(email, otp);

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      publicKey: publicKey || null,
      isVerified: false,
      provider: 'email',
    });

    await newUser.save();
    res.status(200).json({ message: 'OTP sent to email', email });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- VERIFY OTP ----------------
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) return res.status(400).json({ message: 'OTP expired or not found' });
    if (otpRecord.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
    if (!user) return res.status(400).json({ message: 'User not found' });

    await OTP.deleteOne({ email });
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      publicKey: user.publicKey,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error('VerifyOTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- RESEND OTP ----------------
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.isVerified) return res.status(400).json({ message: 'Invalid email or already verified' });

    const otp = generateOTP();
    await OTP.findOneAndUpdate({ email }, { email, otp }, { upsert: true });
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP resent' });
  } catch (error) {
    console.error('ResendOTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- GOOGLE CHECK ----------------
export const googleCheck = async (req, res) => {
  const { token } = req.body;
  try {
    const payload = await verifyGoogleToken(token);
    const { email } = payload;

    const user = await User.findOne({ email });
    res.status(200).json({ found: !!user });
  } catch (err) {
    console.error('GoogleCheck error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- GOOGLE LOGIN ----------------
export const googleLogin = async (req, res) => {
  const { token, publicKey } = req.body;

  try {
    const payload = await verifyGoogleToken(token);
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        profilePic: picture,
        googleId,
        isVerified: true,
        provider: 'google',
        publicKey,
      });
    } else {
      user = await User.findByIdAndUpdate(
        user._id,
        { googleId, isVerified: true, provider: 'google' },
        { new: true }
      );
    }

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      publicKey: user.publicKey,
      isVerified: user.isVerified,
      provider: user.provider,
    });
  } catch (error) {
    console.error('GoogleLogin error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified', requiresOTP: true });

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      publicKey: user.publicKey,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- LOGOUT ----------------
export const logout = (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      secure: process.env.NODE_ENV !== 'development',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: 'Profile pic is required' });

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { profilePic: uploadResponse.secure_url }, { new: true });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ---------------- CHECK AUTH ----------------
export const checkAuth = (req, res) => {
  res.status(200).json(req.user);
};

// ---------------- BLOCK/UNBLOCK USERS ----------------
export const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: toBlockId } = req.params;

    if (userId.toString() === toBlockId.toString())
      return res.status(400).json({ message: 'Cannot block yourself' });

    const toBlock = await User.findById(toBlockId);
    if (!toBlock) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: toBlockId } });
    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.error('BlockUser error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: toUnblockId } = req.params;

    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: toUnblockId } });
    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.error('UnblockUser error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', '-password -lastSeen');
    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    console.error('GetBlockedUsers error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
