const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Rate limiting for OTP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { error: 'Too many OTP requests. Try again in 10 minutes.' }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (phone, code) => {
  // In production: use Twilio
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await client.messages.create({ body: `TakeSend: ${code}`, from: process.env.TWILIO_PHONE, to: phone });
  
  // Development: just log
  console.log(`📱 OTP for ${phone}: ${code}`);
};

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, [
  body('phone').matches(/^\+994[0-9]{9}$/).withMessage('Invalid phone format (+994XXXXXXXXX)')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone } = req.body;

  try {
    // Invalidate previous OTPs
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true }
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await prisma.otpCode.create({
      data: { phone, code, expiresAt }
    });

    await sendOTP(phone, code);

    res.json({ 
      message: 'OTP sent successfully',
      // Only in dev - remove in production!
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', [
  body('phone').matches(/^\+994[0-9]{9}$/).withMessage('Invalid phone'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP code'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short'),
  body('surname').optional().trim().isLength({ min: 2 }).withMessage('Surname too short'),
  body('role').optional().isIn(['SENDER', 'COURIER']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, code, name, surname, role } = req.body;

  try {
    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } }
    });

    if (!otp) {
      // Increment attempts tracking
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      if (!name || !surname) {
        return res.status(400).json({ 
          error: 'New user registration required',
          requiresRegistration: true 
        });
      }
      user = await prisma.user.create({
        data: {
          phone,
          name,
          surname,
          role: role || 'SENDER',
          isVerified: true
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        surname: user.surname,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        rating: user.rating
      },
      isNewUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.isBanned) return res.status(401).json({ error: 'Unauthorized' });
    
    const newToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
