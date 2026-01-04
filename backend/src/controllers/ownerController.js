import {prisma} from '../lib/prisma.js';

export async function createRoom(req, res, next) {
  try {
    const ownerId = req.user.id;
    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      price,
      bedrooms,
      bathrooms,
      area,
      amenities,
      images,
    } = req.body;

    if (!title || !description || !address || !city || !state || !zipCode || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const room = await prisma.room.create({
      data: {
        title,
        description,
        address,
        city,
        state,
        zipCode,
        price: parseFloat(price),
        bedrooms: parseInt(bedrooms) || 1,
        bathrooms: parseFloat(bathrooms) || 1,
        area: area ? parseFloat(area) : null,
        amenities: amenities || '',
        images: images || '',
        ownerId,
      },
    });

    return res.status(201).json(room);
  } catch (err) {
    console.error('[ownerController] createRoom error', err);
    return next(err);
  }
}

export async function getMyRooms(req, res, next) {
  try {
    const ownerId = req.user.id;
    const rooms = await prisma.room.findMany({
      where: { ownerId },
      include: {
        bookings: {
          include: {
            tenant: {
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
    return res.json(rooms);
  } catch (err) {
    console.error('[ownerController] getMyRooms error', err);
    return next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const ownerId = req.user.id;

    const room = await prisma.room.findFirst({
      where: {
        id: parseInt(roomId),
        ownerId,
      },
      include: {
        bookings: {
          include: {
            tenant: {
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

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.json(room);
  } catch (err) {
    console.error('[ownerController] getRoom error', err);
    return next(err);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const ownerId = req.user.id;
    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      price,
      bedrooms,
      bathrooms,
      area,
      amenities,
      images,
      isAvailable,
    } = req.body;

    const existingRoom = await prisma.room.findFirst({
      where: {
        id: parseInt(roomId),
        ownerId,
      },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    if (price) updateData.price = parseFloat(price);
    if (bedrooms) updateData.bedrooms = parseInt(bedrooms);
    if (bathrooms) updateData.bathrooms = parseFloat(bathrooms);
    if (area !== undefined) updateData.area = area ? parseFloat(area) : null;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (images !== undefined) updateData.images = images;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const room = await prisma.room.update({
      where: { id: parseInt(roomId) },
      data: updateData,
    });

    return res.json(room);
  } catch (err) {
    console.error('[ownerController] updateRoom error', err);
    return next(err);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const ownerId = req.user.id;

    const existingRoom = await prisma.room.findFirst({
      where: {
        id: parseInt(roomId),
        ownerId,
      },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await prisma.room.delete({
      where: { id: parseInt(roomId) },
    });

    return res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error('[ownerController] deleteRoom error', err);
    return next(err);
  }
}

export async function updateBookingStatus(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const ownerId = req.user.id;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        room: {
          ownerId,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: true,
      },
    });

    return res.json(updatedBooking);
  } catch (err) {
    console.error('[ownerController] updateBookingStatus error', err);
    return next(err);
  }
}

