const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users, orders, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } })
    ]);

    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    res.json({
      users,
      orders,
      revenue: revenue._sum.amount || 0,
      ordersByStatus: statusCounts.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const skip = (page - 1) * limit;

  try {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      }),
      ...(role && { role })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: Number(skip), take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where })
    ]);

    res.json({ users, pagination: { page: Number(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/ban
router.patch('/users/:id/ban', async (req, res) => {
  const { isBanned, reason } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned }
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
        targetId: req.params.id,
        details: { reason }
      }
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /api/admin/users/:id/verify-id
router.patch('/users/:id/verify-id', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { idVerified: true }
    });

    await prisma.adminLog.create({
      data: { adminId: req.user.id, action: 'VERIFY_COURIER_ID', targetId: req.params.id }
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  const { page = 1, limit = 20, status, country } = req.query;
  const skip = (page - 1) * limit;
  const where = {
    ...(status && { status }),
    ...(country && { destinationCountry: country })
  };

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          sender: { select: { name: true, phone: true } },
          courier: { select: { name: true, phone: true } },
          payment: true
        },
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    res.json({ orders, pagination: { page: Number(page), total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/admin/pricing
router.get('/pricing', async (req, res) => {
  const configs = await prisma.pricingConfig.findMany();
  res.json({ configs });
});

// POST /api/admin/pricing
router.post('/pricing', async (req, res) => {
  const { countryCode, countryName, baseFee, perKmFee, urgentMultiplier, platformFeePercent } = req.body;
  try {
    const config = await prisma.pricingConfig.upsert({
      where: { countryCode },
      create: { countryCode, countryName, baseFee, perKmFee, urgentMultiplier, platformFeePercent },
      update: { baseFee, perKmFee, urgentMultiplier, platformFeePercent }
    });

    await prisma.adminLog.create({
      data: { adminId: req.user.id, action: 'UPDATE_PRICING', details: { countryCode } }
    });

    res.json({ config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  const logs = await prisma.adminLog.findMany({
    include: { admin: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ logs });
});

module.exports = router;
