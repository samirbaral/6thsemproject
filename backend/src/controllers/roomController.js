import {prisma} from '../lib/prisma.js';

export async function createRoom(req, res) {
  try {
    console.log('[createRoom] req.body:', req.body);
    console.log('[createRoom] req.files:', req.files);
    console.log('[createRoom] req.user:', req.user);
    
    const {
      title,
      description,
      address,
      city,
      monthly_rent,
      bedrooms,
      amenities,
      isAvailable,
    } = req.body;

    // Require only fields present on frontend form
    if (!title || !description || !address || !city || !monthly_rent) {
      console.log('[createRoom] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: title, description, address, city, monthly_rent' });
    }

    // Get ownerId from authenticated user
    const ownerId = req.user?.id;
    if (!ownerId) {
      console.log('[createRoom] Owner ID not found in request');
      return res.status(401).json({ error: 'Unauthorized: Owner ID not found' });
    }

    // Store uploaded filenames (not full URLs) as an array in DB
    let imageFilenames = [];
    if (req.files && req.files.length > 0) {
      imageFilenames = req.files.map(file => file.filename);
    }

    // Normalize amenities (string CSV -> array) and avoid storing empty string for JSON field
    let amenitiesToStore = null;
    if (amenities !== undefined && amenities !== null && amenities !== '') {
      if (typeof amenities === 'string') {
        try {
          amenitiesToStore = JSON.parse(amenities);
        } catch (e) {
          amenitiesToStore = amenities.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else {
        amenitiesToStore = amenities;
      }
    }

    const roomData = {
      title,
      description,
      address,
      city,
      monthly_rent: parseFloat(monthly_rent),
      bedrooms: parseInt(bedrooms) || 1,
      images: imageFilenames,
      ownerId: ownerId,
      isAvailable: isAvailable === undefined ? true : (isAvailable === 'true' || isAvailable === true),
      updatedAt: new Date(),
    };
    if (amenitiesToStore !== null) roomData.amenities = amenitiesToStore;

    console.log('[createRoom] Creating room with data:', roomData);

    const room = await prisma.room.create({
      data: roomData,
    });

    console.log('[createRoom] Room created successfully:', room.id);
    return res.status(201).json(room);
  } catch (err) {
    console.error('[createRoom] Error:', err);
    console.error('[createRoom] Error message:', err.message);
    console.error('[createRoom] Error stack:', err.stack);
    return res.status(500).json({ error: err.message || 'Internal server error', details: err.message });
  }
}

export async function getAllRooms(req, res) {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Convert stored filenames to full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = rooms.map(r => ({
      ...r,
      images: Array.isArray(r.images) ? r.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    }));

    return res.json(transformed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
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
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      address,
      city,
      monthly_rent,
      bedrooms,
      amenities,
      isAvailable,
    } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (monthly_rent) {
      updateData.monthly_rent = parseFloat(monthly_rent);
      updateData.updatedAt = new Date();
    }
    if (bedrooms) updateData.bedrooms = parseInt(bedrooms);
    if (amenities !== undefined) updateData.amenities = amenities;
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    if (req.files && req.files.length > 0) {
      // Save filenames only
      updateData.images = req.files.map(file => file.filename);
    }

    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return res.json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;

    const existingRoom = await prisma.room.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await prisma.room.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

