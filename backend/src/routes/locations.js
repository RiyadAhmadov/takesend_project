const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /api/locations/update
router.post('/update', authenticate, async (req, res) => {
  if (req.user.role !== 'COURIER') return res.status(403).json({ error: 'Couriers only' });
  
  const { lat, lng, heading, speed } = req.body;
  
  try {
    const location = await prisma.location.create({
      data: { courierId: req.user.id, lat, lng, heading, speed }
    });
    res.json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// GET /api/locations/courier/:courierId
router.get('/courier/:courierId', authenticate, async (req, res) => {
  try {
    const location = await prisma.location.findFirst({
      where: { courierId: req.params.courierId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ location });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

module.exports = router;
