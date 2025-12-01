import jwt from 'jsonwebtoken';

/**
 * Generate JWT token and set it in HTTP-only cookie
 */
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
    secure: process.env.NODE_ENV !== 'development', // HTTPS only
    domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
  });

  return token;
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
};

/**
 * Express middleware to protect routes
 */
export const protect = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ message: "Unauthorized - No Token" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid Token" });

  req.user = { _id: decoded.userId };
  next();
};
