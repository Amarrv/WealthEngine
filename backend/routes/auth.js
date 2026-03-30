const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

const rpName = 'Obsidian Wealth Engine';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helpers
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, phoneNumber: user.phoneNumber, username: user.username },
    process.env.JWT_SECRET || 'fallback_secret_for_local_dev',
    { expiresIn: '1d' }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-origin Vercel deployment
    maxAge: 86400000, // 1 day
  });
};

// ---------------------------------------------------------
// 1. Password/Phone Based Routes
// ---------------------------------------------------------

router.post('/register', async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;
    
    const existing = await User.findOne({ phoneNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      username: username?.trim() || "CFO",
      phoneNumber,
      passwordHash
    });

    await user.save();

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json({ success: true, message: 'Account created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(200).json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out' });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------------------------------------------------------
// 2. WebAuthn Registration (Adding a Passkey to an existing account)
// ---------------------------------------------------------

router.get('/generate-registration-options', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user._id.toString())),
      userName: user.phoneNumber,
      userDisplayName: user.username,
      // Don't prompt users for their authenticator if they've already registered it
      excludeCredentials: user.passkeys.map(key => ({
        id: key.credentialID,
        type: 'public-key',
        transports: key.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Enforce FaceID/TouchID/Windows Hello
      },
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.status(200).json({ success: true, options });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error generating options' });
  }
});

router.post('/verify-registration', requireAuth, async (req, res) => {
  try {
    const response = req.body;
    const user = await User.findById(req.user.id);

    const expectedChallenge = user.currentChallenge;

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      const newPasskey = {
        credentialID,
        credentialPublicKey,
        counter,
        transports: response.response.transports,
      };

      user.passkeys.push(newPasskey);
      user.currentChallenge = null;
      await user.save();

      return res.status(200).json({ success: true, message: 'Passkey registered' });
    }

    res.status(400).json({ success: false, message: 'Verification failed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error verifying registration' });
  }
});

// ---------------------------------------------------------
// 3. WebAuthn Authentication (Logging in via Passkey)
// ---------------------------------------------------------

router.post('/generate-authentication-options', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      // Return 404 so frontend knows to show standard password fallback
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map(key => ({
        id: key.credentialID,
        type: 'public-key',
        transports: key.transports,
      })),
      userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    await user.save();

    res.status(200).json({ success: true, options });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error generating authentication options' });
  }
});

router.post('/verify-authentication', async (req, res) => {
  try {
    const { phoneNumber, body } = req.body; // body is the response from the browser
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const expectedChallenge = user.currentChallenge;
    const authenticator = user.passkeys.find(key => key.credentialID === body.id);

    if (!authenticator) {
      return res.status(400).json({ success: false, message: 'Authenticator not registered' });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: authenticator.credentialPublicKey,
        credentialID: authenticator.credentialID,
        counter: authenticator.counter,
      },
      requireUserVerification: false,
    });

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the counter
      authenticator.counter = authenticationInfo.newCounter;
      user.currentChallenge = null;
      await user.save();

      const token = generateToken(user);
      setAuthCookie(res, token);

      return res.status(200).json({ success: true, message: 'Logged in successfully' });
    }

    res.status(400).json({ success: false, message: 'Authentication failed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error verifying authentication' });
  }
});

module.exports = router;
