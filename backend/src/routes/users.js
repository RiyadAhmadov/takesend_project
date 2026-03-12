const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: { select: { sentOrders: true, courierOrders: true } }
      }
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('surname').optional().trim().isLength({ min: 2 }),
  body('transportType').optional().isIn(['WALKING', 'MOTORCYCLE', 'CAR']),
  body('licensePlate').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, surname, avatarUrl, transportType, licensePlate } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(surname && { surname }),
        ...(avatarUrl && { avatarUrl }),
        ...(transportType && { transportType }),
        ...(licensePlate && { licensePlate })
      }
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/users/availability - courier online/offline toggle
router.patch('/availability', authenticate, async (req, res) => {
  const { isOnline } = req.body;
  if (req.user.role !== 'COURIER') return res.status(403).json({ error: 'Couriers only' });
  
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { isOnline } });
    res.json({ isOnline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// GET /api/users/:id/stats - courier earnings
router.get('/stats/earnings', authenticate, async (req, res) => {
  if (req.user.role !== 'COURIER') return res.status(403).json({ error: 'Couriers only' });
  
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [todayOrders, monthOrders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: { courierId: req.user.id, status: 'DELIVERED', updatedAt: { gte: startOfDay } },
        select: { price: true, platformFee: true }
      }),
      prisma.order.findMany({
        where: { courierId: req.user.id, status: 'DELIVERED', updatedAt: { gte: startOfMonth } },
        select: { price: true, platformFee: true }
      }),
      prisma.order.count({ where: { courierId: req.user.id, status: 'DELIVERED' } })
    ]);

    const calcEarnings = (orders) => orders.reduce((sum, o) => sum + (o.price - o.platformFee), 0);

    res.json({
      today: { orders: todayOrders.length, earnings: Math.round(calcEarnings(todayOrders) * 100) / 100 },
      month: { orders: monthOrders.length, earnings: Math.round(calcEarnings(monthOrders) * 100) / 100 },
      total: { orders: totalOrders }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
