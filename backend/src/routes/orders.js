const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireCourier } = require('../middleware/auth');
const { getIO } = require('../socket');

const prisma = new PrismaClient();

// Calculate distance (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Calculate price based on config
const calculatePrice = async (distanceKm, countryCode, isUrgent, packageSize) => {
  let config = await prisma.pricingConfig.findUnique({ where: { countryCode } });
  
  if (!config) {
    config = { baseFee: 5, perKmFee: 0.5, urgentMultiplier: 1.3, platformFeePercent: 10 };
  }

  const sizeMultiplier = { S: 1, M: 1.3, L: 1.6 };
  let price = (config.baseFee + distanceKm * config.perKmFee) * (sizeMultiplier[packageSize] || 1);
  if (isUrgent) price *= config.urgentMultiplier;

  const platformFee = price * (config.platformFeePercent / 100);
  return { price: Math.round(price * 100) / 100, platformFee: Math.round(platformFee * 100) / 100 };
};

// GET /api/orders - list orders (sender: own, courier: available nearby)
router.get('/', authenticate, async (req, res) => {
  const { status, lat, lng, radius = 50, country, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  try {
    let where = {};

    if (req.user.role === 'SENDER') {
      where.senderId = req.user.id;
      if (status) where.status = status;
    } else if (req.user.role === 'COURIER') {
      if (status === 'mine') {
        where.courierId = req.user.id;
      } else {
        where.status = 'CREATED';
        if (country) where.destinationCountry = country;
      }
    } else if (req.user.role === 'ADMIN') {
      if (status) where.status = status;
      if (country) where.destinationCountry = country;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, surname: true, avatarUrl: true, rating: true } },
          courier: { select: { id: true, name: true, surname: true, avatarUrl: true, rating: true, transportType: true } },
          payment: { select: { status: true, method: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - create order
router.post('/', authenticate, [
  body('pickupLat').isFloat().withMessage('Invalid pickup latitude'),
  body('pickupLng').isFloat().withMessage('Invalid pickup longitude'),
  body('pickupAddress').trim().notEmpty(),
  body('dropoffLat').isFloat().withMessage('Invalid dropoff latitude'),
  body('dropoffLng').isFloat().withMessage('Invalid dropoff longitude'),
  body('dropoffAddress').trim().notEmpty(),
  body('packageType').isIn(['DOCUMENT', 'BOX', 'FOOD', 'OTHER']),
  body('packageSize').isIn(['S', 'M', 'L']),
  body('weightKg').isFloat({ min: 0.1, max: 50 }),
  body('destinationCountry').trim().notEmpty(),
  body('isUrgent').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    pickupLat, pickupLng, pickupAddress,
    dropoffLat, dropoffLng, dropoffAddress,
    packageType, packageSize, weightKg,
    destinationCountry, description, photoUrl,
    scheduledAt, isUrgent = false, senderNote,
    paymentMethod = 'CASH'
  } = req.body;

  try {
    const distanceKm = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const { price, platformFee } = await calculatePrice(distanceKm, destinationCountry, isUrgent, packageSize);

    const order = await prisma.order.create({
      data: {
        senderId: req.user.id,
        pickupLat, pickupLng, pickupAddress,
        dropoffLat, dropoffLng, dropoffAddress,
        packageType, packageSize, weightKg,
        destinationCountry, description, photoUrl,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isUrgent, senderNote,
        distanceKm: Math.round(distanceKm * 10) / 10,
        price, platformFee,
        events: {
          create: { status: 'CREATED' }
        },
        payment: {
          create: {
            userId: req.user.id,
            method: paymentMethod,
            amount: price,
            currency: 'AZN',
            status: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING'
          }
        }
      },
      include: {
        sender: { select: { id: true, name: true, surname: true } },
        payment: true
      }
    });

    // Notify available couriers via socket (broadcast to courier room)
    try {
      const io = getIO();
      io.emit('order:new', {
        orderId: order.id,
        destinationCountry: order.destinationCountry,
        price: order.price,
        packageType: order.packageType,
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress
      });
    } catch (socketErr) {
      // Socket not critical
    }

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { select: { id: true, name: true, surname: true, phone: true, avatarUrl: true, rating: true } },
        courier: { select: { id: true, name: true, surname: true, phone: true, avatarUrl: true, rating: true, transportType: true } },
        events: { orderBy: { createdAt: 'asc' } },
        payment: true,
        review: true
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check access
    const canAccess = 
      req.user.id === order.senderId ||
      req.user.id === order.courierId ||
      req.user.role === 'ADMIN';

    if (!canAccess) return res.status(403).json({ error: 'Access denied' });

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders/:id/accept - courier accepts
router.post('/:id/accept', authenticate, requireCourier, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'CREATED') return res.status(400).json({ error: 'Order not available' });
    if (order.courierId) return res.status(400).json({ error: 'Order already accepted' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        courierId: req.user.id,
        status: 'ACCEPTED',
        events: { create: { status: 'ACCEPTED' } }
      },
      include: {
        sender: { select: { id: true, name: true, phone: true } },
        courier: { select: { id: true, name: true, phone: true } }
      }
    });

    // Notify sender
    try {
      const io = getIO();
      io.to(`user:${order.senderId}`).emit('order:statusUpdated', {
        orderId: order.id,
        status: 'ACCEPTED',
        courier: { id: req.user.id, name: req.user.name }
      });
    } catch (socketErr) {}

    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// PATCH /api/orders/:id/status - update status
router.patch('/:id/status', authenticate, [
  body('status').isIn(['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { status, note } = req.body;

  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Permission check
    const isCourier = req.user.id === order.courierId;
    const isSender = req.user.id === order.senderId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCourier && !isSender && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only courier can update to PICKED_UP, IN_TRANSIT, DELIVERED
    if (['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status) && !isCourier && !isAdmin) {
      return res.status(403).json({ error: 'Only courier can update delivery status' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        events: { create: { status, note } }
      }
    });

    // Notify both parties
    try {
      const io = getIO();
      io.to(`user:${order.senderId}`).emit('order:statusUpdated', { orderId: order.id, status });
      if (order.courierId) {
        io.to(`user:${order.courierId}`).emit('order:statusUpdated', { orderId: order.id, status });
      }
    } catch (socketErr) {}

    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/orders/:id/review
router.post('/:id/review', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { review: true }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'DELIVERED') return res.status(400).json({ error: 'Can only review delivered orders' });
    if (order.review) return res.status(400).json({ error: 'Already reviewed' });

    const isSender = req.user.id === order.senderId;
    const targetId = isSender ? order.courierId : order.senderId;

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        authorId: req.user.id,
        targetId,
        rating: req.body.rating,
        comment: req.body.comment
      }
    });

    // Update target user's average rating
    const reviews = await prisma.review.findMany({ where: { targetId } });
    const avgRating = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await prisma.user.update({
      where: { id: targetId },
      data: { rating: Math.round(avgRating * 10) / 10 }
    });

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// GET /api/orders/price/estimate
router.get('/price/estimate', authenticate, async (req, res) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, countryCode, isUrgent, packageSize } = req.query;
  
  try {
    const distanceKm = calculateDistance(
      parseFloat(pickupLat), parseFloat(pickupLng),
      parseFloat(dropoffLat), parseFloat(dropoffLng)
    );
    
    const { price, platformFee } = await calculatePrice(
      distanceKm, countryCode, isUrgent === 'true', packageSize
    );

    res.json({ distanceKm: Math.round(distanceKm * 10) / 10, price, platformFee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

module.exports = router;
