import {prisma} from '../lib/prisma.js';

export async function getPendingOwners(req, res, next) {
  try {
    const owners = await prisma.user.findMany({
      where: {
        role: 'OWNER',
        ownerStatus: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
    return res.json(owners);
  } catch (err) {
    console.error('[adminController] getPendingOwners error', err);
    return next(err);
  }
}

export async function approveOwner(req, res, next) {
  try {
    const { ownerId } = req.params;
    const owner = await prisma.user.update({
      where: { id: parseInt(ownerId) },
      data: { ownerStatus: 'APPROVED' },
    });
    return res.json({ message: 'Owner approved successfully', owner });
  } catch (err) {
    console.error('[adminController] approveOwner error', err);
    return next(err);
  }
}

export async function rejectOwner(req, res, next) {
  try {
    const { ownerId } = req.params;
    const owner = await prisma.user.update({
      where: { id: parseInt(ownerId) },
      data: { ownerStatus: 'REJECTED' },
    });
    return res.json({ message: 'Owner rejected', owner });
  } catch (err) {
    console.error('[adminController] rejectOwner error', err);
    return next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const [totalUsers, totalRooms, totalBookings, pendingOwners] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.user.count({ where: { role: 'OWNER', ownerStatus: 'PENDING' } }),
    ]);

    return res.json({
      totalUsers,
      totalRooms,
      totalBookings,
      pendingOwners,
    });
  } catch (err) {
    console.error('[adminController] getStats error', err);
    return next(err);
  }
}

export async function getPendingRooms(req, res, next) {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'PENDING' },
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
    console.error('[adminController] getPendingRooms error', err);
    return next(err);
  }
}

export async function approveRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const room = await prisma.room.update({
      where: { id: parseInt(roomId) },
      data: { status: 'APPROVED' },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = {
      ...room,
      images: Array.isArray(room.images) ? room.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    };

    return res.json({ message: 'Room approved', room: transformed });
  } catch (err) {
    console.error('[adminController] approveRoom error', err);
    return next(err);
  }
}

export async function rejectRoom(req, res, next) {
  try {
    const { roomId } = req.params;
    const room = await prisma.room.update({
      where: { id: parseInt(roomId) },
      data: { status: 'REJECTED' },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const transformed = {
      ...room,
      images: Array.isArray(room.images) ? room.images.map(f => `${baseUrl}/uploads/${f}`) : [],
    };

    return res.json({ message: 'Room rejected', room: transformed });
  } catch (err) {
    console.error('[adminController] rejectRoom error', err);
    return next(err);
  }
}

