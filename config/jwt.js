// JWT configuration and utility functions
// This module handles JWT generation, verification, and middleware for protecting routes.
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'trackar-super-secret-key';

// Generate JWT token
exports.generateJWT = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify JWT token
exports.verifyJWT = (token) => {
  try {
    console.log('Verifying token:', token.slice(0, 10) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);
    return decoded;
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
};

// Middleware to protect routes
exports.authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = exports.verifyJWT(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid/expired token' });
  }

  req.user = decoded; // Attach user data to request
  next();
};