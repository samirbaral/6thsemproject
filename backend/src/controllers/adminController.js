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

