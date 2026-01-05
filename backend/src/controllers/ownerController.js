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
      monthly_rent,
      bedrooms,
      bathrooms,
      area,
      amenities,
      images,
    } = req.body;

    // If files were uploaded via multer, use their filenames; otherwise allow images from body
    const uploadedFilenames = req.files && req.files.length > 0 ? req.files.map(f => f.filename) : [];
    let bodyImages = [];
    if (!uploadedFilenames.length && images) {
      if (Array.isArray(images)) {
        bodyImages = images;
      } else if (typeof images === 'string' && images.trim() !== '') {
        try {
          bodyImages = JSON.parse(images);
        } catch (e) {
          bodyImages = images.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }
    const imagesToStore = uploadedFilenames.length > 0 ? uploadedFilenames : bodyImages;

    if (!title || !description || !address || !city || !state || !zipCode || !monthly_rent) {
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
        monthly_rent: parseFloat(monthly_rent),
        bedrooms: parseInt(bedrooms) || 1,
        bathrooms: parseFloat(bathrooms) || 1,
        area: area ? parseFloat(area) : null,
        amenities: amenities || '',
        images: imagesToStore,
        ownerId,
        updatedAt: new Date(),
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
        booking: {
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
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = rooms.map(r => ({
      ...r,
      bookings: Array.isArray(r.booking) ? r.booking.map(b => ({
        ...b,
        tenant: b.user ? { id: b.user.id, name: b.user.name, email: b.user.email } : null,
      })) : [],
      images: Array.isArray(r.images) ? r.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    }));
    return res.json(transformed);
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
        booking: {
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

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = {
      ...room,
      bookings: Array.isArray(room.booking) ? room.booking.map(b => ({
        ...b,
        tenant: b.user ? { id: b.user.id, name: b.user.name, email: b.user.email } : null,
      })) : [],
      images: Array.isArray(room.images) ? room.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    };

    return res.json(transformed);
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
      monthly_rent,
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

    // handle images from file upload or body
    const uploadedFilenamesUpdate = req.files && req.files.length > 0 ? req.files.map(f => f.filename) : [];
    let imagesToStoreUpdate;
    if (uploadedFilenamesUpdate.length > 0) {
      imagesToStoreUpdate = uploadedFilenamesUpdate;
    } else if (images !== undefined) {
      if (Array.isArray(images)) {
        imagesToStoreUpdate = images;
      } else if (typeof images === 'string' && images.trim() !== '') {
        try {
          imagesToStoreUpdate = JSON.parse(images);
        } catch (e) {
          imagesToStoreUpdate = images.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else {
        imagesToStoreUpdate = [];
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    if (monthly_rent) {
      updateData.monthly_rent = parseFloat(monthly_rent);
      updateData.updatedAt = new Date();
    }
    if (bedrooms) updateData.bedrooms = parseInt(bedrooms);
    if (bathrooms) updateData.bathrooms = parseFloat(bathrooms);
    if (area !== undefined) updateData.area = area ? parseFloat(area) : null;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (imagesToStoreUpdate !== undefined) updateData.images = imagesToStoreUpdate;
    if (isAvailable !== undefined) {
      if (typeof isAvailable === 'boolean') {
        updateData.isAvailable = isAvailable;
      } else if (typeof isAvailable === 'string') {
        const v = isAvailable.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes' || v === 'on') {
          updateData.isAvailable = true;
        } else if (v === 'false' || v === '0' || v === 'no' || v === 'off') {
          updateData.isAvailable = false;
        } else {
          try {
            const parsed = JSON.parse(isAvailable);
            updateData.isAvailable = Boolean(parsed);
          } catch (e) {
            updateData.isAvailable = false;
          }
        }
      } else {
        updateData.isAvailable = Boolean(isAvailable);
      }
    }

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
      include: {
        room: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Rent request not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: true,
      },
    });

    // map user -> tenant for API compatibility
    if (updatedBooking && updatedBooking.user) {
      updatedBooking.tenant = { id: updatedBooking.user.id, name: updatedBooking.user.name, email: updatedBooking.user.email };
    }

    // When owner confirms rent request, set room status to "occupied" (isAvailable = false)
    if (status === 'CONFIRMED') {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { isAvailable: false },
      });
    }
    // When rent request is cancelled or completed, room becomes available again
    else if (status === 'CANCELLED' || status === 'COMPLETED') {
      // Check if there are other active bookings for this room
      const activeBookings = await prisma.booking.findFirst({
        where: {
          roomId: booking.roomId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          id: {
            not: parseInt(bookingId),
          },
        },
      });

      // Only set available if no other active bookings exist
      if (!activeBookings) {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { isAvailable: true },
        });
      }
    }

    return res.json(updatedBooking);
  } catch (err) {
    console.error('[ownerController] updateBookingStatus error', err);
    return next(err);
  }
}

