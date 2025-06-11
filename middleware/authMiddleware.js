const isRole = (role) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (role === 'admin' && !['admin', 'superadmin'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (role === 'superadmin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  isAdmin: isRole('admin'),
  isSuperAdmin: isRole('superadmin'),
  isRole, // Dynamic role checker (e.g., isRole('report_admin'))
};