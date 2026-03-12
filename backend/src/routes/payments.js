const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/payments/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        order: {
          select: {
            id: true, pickupAddress: true, dropoffAddress: true,
            destinationCountry: true, status: true, createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/payments/:orderId/confirm - confirm cash payment
router.post('/:orderId/confirm', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { orderId: req.params.orderId },
      data: { status: 'PAID' }
    });
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

module.exports = router;
