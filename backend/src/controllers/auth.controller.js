import User from '../models/user.model.js';
import OTP from '../models/otp.model.js';
import { generateToken } from '../lib/utils.js';
import { generateOTP } from '../lib/otp.js';
import { sendOTPEmail } from '../lib/emailService.js';
import { verifyGoogleToken } from '../lib/google.js';
import bcryptjs from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';

// SIGNUP - Send OTP
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
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    // Generate OTP
    const otp = generateOTP();



    // Save OTP to database
    await OTP.findOneAndUpdate({ email }, { email, otp }, { upsert: true });

    // Send OTP email
    console.log("OTP Send")
    await sendOTPEmail(email, otp);
    console.log("OTP Sending Done")


    // Create unverified user with hashed password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    console.log("new user")

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      publicKey: publicKey || null, 
      isVerified: false,
      provider: 'email',
    });

    await newUser.save();
    console.log("User Add")

    res.status(200).json({
      message: 'OTP sent to email',
      email,
    });
  } catch (error) {
    console.log('Error in signup controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// VERIFY OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Delete OTP
    await OTP.deleteOne({ email });

    // Generate JWT
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
    console.log('Error in verifyOTP controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// RESEND OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return res.status(400).json({ message: 'Invalid email or already verified' });
    }

    const otp = generateOTP();
    await OTP.findOneAndUpdate({ email }, { email, otp }, { upsert: true });

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP resent' });
  } catch (error) {
    console.log('Error in resendOTP controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const googleCheck = async (req,res) => {
  const { token } = req.body;
  try {
    const payload = await verifyGoogleToken(token);
    const { email } = payload;

    let user = await User.findOne({ email });
    if(!user) res.status(200).json({found: false});
    else res.status(200).json({found: true});
  }
  catch(err){
   res.status(500).json({ message: 'Internal Server Error' }); 
  }
}

// GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const payload = await verifyGoogleToken(token);
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      const {publicKey} = req.body;
      user = await User.create({
        fullName: name,
        email,
        profilePic: picture,
        googleId: payload.sub,
        isVerified: true,
        provider: 'google',
        publicKey, 
      });
    } else {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          googleId: payload.sub,
          isVerified: true,
          provider: 'google',
        },
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
    console.log('Error in googleLogin controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// LOGIN - Check if user is verified
export const login = async (req, res) => {
  const { email, password} = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify your email first.',
        requiresOTP: true,
      });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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
    console.log('Error in login controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      secure: process.env.NODE_ENV !== 'development',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Error in logout controller', error.message);
    res.status(500).json({ message: 'Internal server Error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    if (!profilePic) {
      return res.status(400).json({ message: 'Profile pic is required' });
    }
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log('Error In update profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log('Error in checkAuth controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// BLOCK USER
export const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: toBlockId } = req.params;
    if (userId.toString() === toBlockId.toString()) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const toBlock = await User.findById(toBlockId);
    if (!toBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: toBlockId } });

    res.status(200).json({ message: 'User blocked' });
  } catch (error) {
    console.log('Error in blockUser:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// UNBLOCK USER
export const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: toUnblockId } = req.params;

    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: toUnblockId } });

    res.status(200).json({ message: 'User unblocked' });
  } catch (error) {
    console.log('Error in unblockUser:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET BLOCKED USERS
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      'blockedUsers',
      '-password -lastSeen' 
    );
    res.status(200).json(user.blockedUsers || []);
  } catch (error) {
    console.log('Error in getBlockedUsers:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};