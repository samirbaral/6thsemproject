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
