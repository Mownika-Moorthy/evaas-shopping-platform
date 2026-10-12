import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendAdminOtpEmail } from '../utils/emailService.js';

// Generate JWT token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'evaas_womenswear_jwt_secret_key_2026_xyz', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, phone, password, address } = req.body;

  try {
    if (!name || !email || !phone || !password || !address) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Public registration always creates a customer — admin accounts are pre-seeded
    const user = await User.create({
      name,
      email,
      phone,
      password, // pre-save hook will hash this
      address,
      role: 'customer'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email });

    // Block admin accounts from using the public login endpoint
    if (user && user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts must use the Admin Portal.' });
    }

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin-only login step 1: Validate password & send 2FA OTP
// @route   POST /api/auth/admin-login
// @access  Public (admin portal only)
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    // Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    await user.save();

    // Dispatch email
    await sendAdminOtpEmail(user.email, otp);

    // Return 2FA requirement (NO token issued yet)
    res.json({
      success: true,
      requireOtp: true,
      email: user.email,
      message: `A 6-digit verification code has been sent to ${user.email}.`,
      // For developer testing convenience when SMTP is not configured in .env:
      devOtp: process.env.NODE_ENV !== 'production' && !process.env.EMAIL_USER ? otp : undefined
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin-only login step 2: Verify OTP & issue JWT token
// @route   POST /api/auth/admin-verify-otp
// @access  Public (admin portal only)
export const verifyAdminOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide both email and the 6-digit verification code.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedOtp = otp.toString().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized administrator access.' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No pending OTP verification request found. Please sign in again.' });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: 'Your verification code has expired. Please click Resend Code.' });
    }

    if (user.otp !== trimmedOtp) {
      return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
    }

    // OTP Verified! Invalidate the used OTP immediately
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log(`✅ Admin 2FA verified successfully for: ${user.email}`);

    // Issue JWT token
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Admin verify OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend Admin OTP
// @route   POST /api/auth/admin-resend-otp
// @access  Public (admin portal only)
export const resendAdminOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user || user.role !== 'admin') {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    await user.save();

    await sendAdminOtpEmail(user.email, otp);

    res.json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched to ${user.email}.`,
      devOtp: process.env.NODE_ENV !== 'production' && !process.env.EMAIL_USER ? otp : undefined
    });
  } catch (error) {
    console.error('Admin resend OTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        user.password = req.body.password; // pre-save hook will hash
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth sign-in / sign-up (access token + userInfo flow)
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  const { accessToken, userInfo } = req.body;

  if (!accessToken || !userInfo) {
    return res.status(400).json({ message: 'Google access token and user info are required.' });
  }

  try {
    // Verify the access token by calling Google's userinfo endpoint server-side
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Invalid Google access token.' });
    }

    const googleUser = await googleRes.json();
    const { sub: googleId, email, name, picture } = googleUser;

    // Ensure the client-supplied userInfo matches the server-verified data
    if (email !== userInfo.email) {
      return res.status(401).json({ message: 'Google user info mismatch.' });
    }

    // Find existing user or create new one
    let user = await User.findOne({ email });

    if (user) {
      // Link Google ID if signing in for the first time via Google
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
      // Block admin accounts from customer app
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts cannot sign in via Google.' });
      }
    } else {
      // New user — auto-register from Google profile
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'customer'
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
};
