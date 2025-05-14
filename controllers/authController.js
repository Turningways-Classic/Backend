const {
    findUserByMobile,
    findUserById,
    comparePin,
    updateSignInStatus,
    updateSignOutStatus
  } = require('../models/userModel');
  
  const { generateToken } = require('../utils/jwt');
  
  //  Sign-in via Mobile + PIN
  async function loginWithPin(req, res) {
    const { mobile, pin } = req.body;
  
    const { data: user, error } = await findUserByMobile(mobile);
    if (error || !user) {
      return res.status(401).json({ message: 'INVALID ID or UNKNOWN CREDENTIALS' });
    }
  
    const isMatch = await comparePin(pin, user.pin);
    if (!isMatch) {
      return res.status(401).json({ message: 'INVALID ID or UNKNOWN CREDENTIALS' });
    }
  
    if (user.has_signed_in) {
      return res.status(400).json({ message: 'USER ALREADY SIGNED IN' });
    }
  
    await updateSignInStatus(user.id, true);
  
    //Send email here if needed
  
    const token = generateToken({ id: user.id, email: user.email });
    res.status(200).json({
      message: 'CONGRATULATIONS. YOU HAVE SUCCESSFULLY SIGNED IN',
      token
    });
  }
  
  // Sign-in via QR/Camera
  async function loginWithQR(req, res) {
    const { userId } = req.body;
  
    const { data: user, error } = await findUserById(userId);
    if (error || !user) {
      return res.status(404).json({ message: 'USER HAS NO RECORD, KINDLY SIGN UP' });
    }
  
    if (user.has_signed_in) {
      return res.status(400).json({ message: 'USER ALREADY SIGNED IN' });
    }
  
    await updateSignInStatus(user.id, true);
  
    const token = generateToken({ id: user.id, email: user.email });
    res.status(200).json({
      message: 'CONGRATULATIONS. YOU HAVE SUCCESSFULLY SIGNED IN',
      token
    });
  }
  
  // Sign out
  async function signOut(req, res) {
    const userId = req.user.id;
  
    const { data: user, error } = await findUserById(userId);
    if (error || !user) {
      return res.status(404).json({ message: 'USER NOT FOUND' });
    }
  
    if (!user.has_signed_in) {
      return res.status(400).json({ message: 'USER NOT CURRENTLY SIGNED IN, PLEASE CHECK AGAIN' });
    }
  
    await updateSignOutStatus(userId);
    res.status(200).json({ message: 'SIGNED OUT SUCCESSFUL' });
  }
  
  module.exports = { loginWithPin, loginWithQR, signOut };
  
  