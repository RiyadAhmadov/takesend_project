const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Pricing configs
  const countries = [
    { countryCode: 'TR', countryName: 'Türkiyə', baseFee: 8, perKmFee: 0.3, urgentMultiplier: 1.4 },
    { countryCode: 'RU', countryName: 'Rusiya', baseFee: 12, perKmFee: 0.5, urgentMultiplier: 1.5 },
    { countryCode: 'DE', countryName: 'Almaniya', baseFee: 20, perKmFee: 1.0, urgentMultiplier: 1.5 },
    { countryCode: 'AE', countryName: 'BƏƏ', baseFee: 15, perKmFee: 0.8, urgentMultiplier: 1.4 },
    { countryCode: 'US', countryName: 'ABŞ', baseFee: 25, perKmFee: 1.5, urgentMultiplier: 1.6 },
    { countryCode: 'GB', countryName: 'Böyük Britaniya', baseFee: 22, perKmFee: 1.2, urgentMultiplier: 1.5 },
    { countryCode: 'UA', countryName: 'Ukrayna', baseFee: 10, perKmFee: 0.4, urgentMultiplier: 1.3 },
    { countryCode: 'GE', countryName: 'Gürcüstan', baseFee: 5, perKmFee: 0.2, urgentMultiplier: 1.3 }
  ];

  for (const country of countries) {
    await prisma.pricingConfig.upsert({
      where: { countryCode: country.countryCode },
      create: { ...country, platformFeePercent: 10 },
      update: { ...country }
    });
  }

  // Admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+994501234567' },
    create: {
      phone: '+994501234567',
      name: 'Admin',
      surname: 'TakeSend',
      role: 'ADMIN',
      isVerified: true
    },
    update: {}
  });

  // Test sender
  const sender = await prisma.user.upsert({
    where: { phone: '+994551234567' },
    create: {
      phone: '+994551234567',
      name: 'Əli',
      surname: 'Hüseynov',
      role: 'SENDER',
      isVerified: true
    },
    update: {}
  });

  // Test courier
  const courier = await prisma.user.upsert({
    where: { phone: '+994701234567' },
    create: {
      phone: '+994701234567',
      name: 'Nicat',
      surname: 'Mammadov',
      role: 'COURIER',
      isVerified: true,
      idVerified: true,
      transportType: 'CAR',
      isOnline: true,
      rating: 4.8
    },
    update: {}
  });

  // Test orders
  await prisma.order.create({
    data: {
      senderId: sender.id,
      packageType: 'DOCUMENT',
      packageSize: 'S',
      weightKg: 0.5,
      pickupLat: 40.4093, pickupLng: 49.8671, pickupAddress: 'Neftçilər pr., Bakı',
      dropoffLat: 41.0082, dropoffLng: 28.9784, dropoffAddress: 'İstanbul, Türkiyə',
      destinationCountry: 'TR',
      distanceKm: 1200,
      price: 15.00, platformFee: 1.50,
      status: 'CREATED',
      events: { create: { status: 'CREATED' } },
      payment: { create: { userId: sender.id, method: 'CASH', amount: 15.00, currency: 'AZN', status: 'PENDING' } }
    }
  });

  console.log('✅ Seed complete!');
  console.log('👤 Admin: +994501234567');
  console.log('📦 Sender: +994551234567');
  console.log('🚗 Courier: +994701234567');
  console.log('💡 OTP codes logged to console in dev mode');
}

main().catch(console.error).finally(() => prisma.$disconnect());
