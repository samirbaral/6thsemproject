import {prisma} from '../lib/prisma.js';

export async function getAllRooms(req, res, next) {
  try {
    const { city, minPrice, maxPrice, bedrooms } = req.query;

    const where = {
      isAvailable: true,
      status: 'APPROVED',
      owner: {
        ownerStatus: 'APPROVED',
      },
    };

    if (city) where.city = { contains: city };
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (bedrooms) where.bedrooms = parseInt(bedrooms);

    const rooms = await prisma.room.findMany({
      where,
      include: {
        owner: {
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
        owner: {
          ownerStatus: 'APPROVED',
        },
      },
      include: {
        owner: {
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
    const { roomId, checkIn, checkOut } = req.body;

    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    const room = await prisma.room.findFirst({
      where: {
        id: parseInt(roomId),
        isAvailable: true,
        owner: {
          ownerStatus: 'APPROVED',
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or not available' });
    }

    // Check for overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        roomId: parseInt(roomId),
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          },
        ],
      },
    });

    if (overlappingBooking) {
      return res.status(400).json({ error: 'Room is already booked for these dates' });
    }

    // Calculate total amount
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = days * room.price;

    const booking = await prisma.booking.create({
      data: {
        roomId: parseInt(roomId),
        tenantId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalAmount,
        status: 'PENDING',
      },
      include: {
        room: {
          include: {
            owner: {
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
            owner: {
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

    return res.json(bookings);
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

