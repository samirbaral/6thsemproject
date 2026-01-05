import {prisma} from '../lib/prisma.js';
import { calculateMonths, monthsOverlap, isValidMonthFormat } from '../utils/monthUtils.js';

export async function getAllRooms(req, res, next) {
  try {
    const { city, minPrice, maxPrice, bedrooms } = req.query;

    const where = {
      isAvailable: true,
      status: 'APPROVED',
      user: {
        ownerStatus: 'APPROVED',
      },
    };

    if (city) where.city = { contains: city };
    if (minPrice) where.monthly_rent = { ...where.monthly_rent, gte: parseFloat(minPrice) };
    if (maxPrice) where.monthly_rent = { ...where.monthly_rent, lte: parseFloat(maxPrice) };
    if (bedrooms) where.bedrooms = parseInt(bedrooms);

    const rooms = await prisma.room.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = rooms.map(r => ({
      ...r,
      owner: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null,
      images: Array.isArray(r.images) ? r.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    }));

    return res.json(transformed);
  } catch (err) {
    console.error('[tenantController] getAllRooms error', err);
    return next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findFirst({
      where: {
        id: parseInt(roomId),
        isAvailable: true,
        status: 'APPROVED',
        user: {
          ownerStatus: 'APPROVED',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = {
      ...room,
      owner: room.user ? { id: room.user.id, name: room.user.name, email: room.user.email } : null,
      images: Array.isArray(room.images) ? room.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    };

    return res.json(transformed);
  } catch (err) {
    console.error('[tenantController] getRoom error', err);
    return next(err);
  }
}

export async function bookRoom(req, res, next) {
  try {
    const tenantId = req.user.id;
    // Changed: checkIn/checkOut → start_month/end_month (rent request)
    const { roomId, start_month, end_month } = req.body;

    if (!roomId || !start_month || !end_month) {
      return res.status(400).json({ error: 'Missing required fields: roomId, start_month, end_month' });
    }

    // Validate month format (YYYY-MM)
    if (!isValidMonthFormat(start_month) || !isValidMonthFormat(end_month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM format (e.g., 2024-01)' });
    }

    // Validate end_month is after start_month
    if (end_month <= start_month) {
      return res.status(400).json({ error: 'End month must be after start month' });
    }

    // Enforce minimum 1-month rental period (Nepal-style)
    const months = calculateMonths(start_month, end_month);
    if (months < 1) {
      return res.status(400).json({ error: 'Minimum rental period is 1 month' });
    }

    const room = await prisma.room.findFirst({
      where: {
        id: parseInt(roomId),
        isAvailable: true,
        status: 'APPROVED',
        user: {
          ownerStatus: 'APPROVED',
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or not available' });
    }

    // Check for overlapping rent requests (month-based)
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId: parseInt(roomId),
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    // Check if any existing booking overlaps with the requested months
    const hasOverlap = existingBookings.some(booking => 
      monthsOverlap(start_month, end_month, booking.start_month, booking.end_month)
    );

    if (hasOverlap) {
      return res.status(400).json({ error: 'Room is already rented for overlapping months' });
    }

    // Calculate total amount (monthly rent * number of months)
    const totalAmount = months * room.monthly_rent;

    // Create rent request (booking)
    const booking = await prisma.booking.create({
      data: {
        roomId: parseInt(roomId),
        tenantId,
        start_month,
        end_month,
        totalAmount,
        status: 'PENDING',
        updatedAt: new Date(),
      },
      include: {
        room: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // map room.user -> room.owner for API compatibility
    if (booking && booking.room) {
      booking.room.owner = booking.room.user ? { id: booking.room.user.id, name: booking.room.user.name, email: booking.room.user.email } : null;
    }

    return res.status(201).json(booking);
  } catch (err) {
    console.error('[tenantController] bookRoom error', err);
    return next(err);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const tenantId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: { tenantId },
      include: {
        room: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // map room.user -> room.owner and transform images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformedBookings = bookings.map(b => ({
      ...b,
      room: {
        ...b.room,
        owner: b.room.user ? { id: b.room.user.id, name: b.room.user.name, email: b.room.user.email } : null,
        images: Array.isArray(b.room.images) ? b.room.images.map(f => `${baseUrl}/uploads/${f}`) : [],
      },
    }));

    return res.json(transformedBookings);
  } catch (err) {
    console.error('[tenantController] getMyBookings error', err);
    return next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const tenantId = req.user.id;

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        tenantId,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status: 'CANCELLED' },
      include: {
        room: true,
      },
    });

    return res.json(updatedBooking);
  } catch (err) {
    console.error('[tenantController] cancelBooking error', err);
    return next(err);
  }
}

