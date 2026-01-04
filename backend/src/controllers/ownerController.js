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
        images: imagesToStore,
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
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = rooms.map(r => ({
      ...r,
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

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = {
      ...room,
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
    if (price) updateData.price = parseFloat(price);
    if (bedrooms) updateData.bedrooms = parseInt(bedrooms);
    if (bathrooms) updateData.bathrooms = parseFloat(bathrooms);
    if (area !== undefined) updateData.area = area ? parseFloat(area) : null;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (imagesToStoreUpdate !== undefined) updateData.images = imagesToStoreUpdate;
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

