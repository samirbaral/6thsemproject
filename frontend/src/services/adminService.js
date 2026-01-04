import api from './api';

export async function getPendingOwners() {
  console.log('[adminService] getPendingOwners()');
  try {
    const res = await api.get('/admin/pending-owners');
    console.log('[adminService] getPendingOwners -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] getPendingOwners -> error', err.response || err);
    throw err;
  }
}

export async function approveOwner(ownerId) {
  console.log('[adminService] approveOwner()', ownerId);
  try {
    const res = await api.post(`/admin/approve-owner/${ownerId}`);
    console.log('[adminService] approveOwner -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] approveOwner -> error', err.response || err);
    throw err;
  }
}

export async function rejectOwner(ownerId) {
  console.log('[adminService] rejectOwner()', ownerId);
  try {
    const res = await api.post(`/admin/reject-owner/${ownerId}`);
    console.log('[adminService] rejectOwner -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] rejectOwner -> error', err.response || err);
    throw err;
  }
}

export async function getStats() {
  console.log('[adminService] getStats()');
  try {
    const res = await api.get('/admin/stats');
    console.log('[adminService] getStats -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] getStats -> error', err.response || err);
    throw err;
  }
}

export async function getPendingRooms() {
  console.log('[adminService] getPendingRooms()');
  try {
    const res = await api.get('/admin/pending-rooms');
    console.log('[adminService] getPendingRooms -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] getPendingRooms -> error', err.response || err);
    throw err;
  }
}

export async function approveRoom(roomId) {
  console.log('[adminService] approveRoom()', roomId);
  try {
    const res = await api.post(`/admin/approve-room/${roomId}`);
    console.log('[adminService] approveRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] approveRoom -> error', err.response || err);
    throw err;
  }
}

export async function rejectRoom(roomId) {
  console.log('[adminService] rejectRoom()', roomId);
  try {
    const res = await api.post(`/admin/reject-room/${roomId}`);
    console.log('[adminService] rejectRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[adminService] rejectRoom -> error', err.response || err);
    throw err;
  }
}
