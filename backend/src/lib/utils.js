import jwt from 'jsonwebtoken';

/**
 * Generate JWT token and set it in HTTP-only cookie
 * @param {string} userId - MongoDB User ID
 * @param {object} res - Express response object
 * @returns {string} token - JWT token
 */
export const generateToken = (userId, res) => {
  // Generate JWT token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // token valid 7 দিন
  });

  // Set token in cookie
  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 দিন
    httpOnly: true,                  // JS থেকে access restricted
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
    secure: process.env.NODE_ENV !== 'development', // HTTPS only prod
  });

  return token;
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} decoded - decoded payload { userId }
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
};
