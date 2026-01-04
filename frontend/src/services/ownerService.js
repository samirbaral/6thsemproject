import api from './api';

export async function createRoom(data) {
  console.log('[ownerService] createRoom()', data);
  try {
    const res = await api.post('/owner/rooms', data);
    console.log('[ownerService] createRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[ownerService] createRoom -> error', err.response || err);
    throw err;
  }
}

export async function getMyRooms() {
  console.log('[ownerService] getMyRooms()');
  try {
    const res = await api.get('/owner/rooms');
    console.log('[ownerService] getMyRooms -> response', res);
    return res;
  } catch (err) {
    console.error('[ownerService] getMyRooms -> error', err.response || err);
    throw err;
  }
}

export async function getRoom(roomId) {
  console.log('[ownerService] getRoom()', roomId);
  try {
    const res = await api.get(`/owner/rooms/${roomId}`);
    console.log('[ownerService] getRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[ownerService] getRoom -> error', err.response || err);
    throw err;
  }
}

export async function updateRoom(roomId, data) {
  console.log('[ownerService] updateRoom()', roomId, data);
  try {
    const res = await api.put(`/owner/rooms/${roomId}`, data);
    console.log('[ownerService] updateRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[ownerService] updateRoom -> error', err.response || err);
    throw err;
  }
}

export async function deleteRoom(roomId) {
  console.log('[ownerService] deleteRoom()', roomId);
  try {
    const res = await api.delete(`/owner/rooms/${roomId}`);
    console.log('[ownerService] deleteRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[ownerService] deleteRoom -> error', err.response || err);
    throw err;
  }
}

export async function updateBookingStatus(bookingId, status) {
  console.log('[ownerService] updateBookingStatus()', bookingId, status);
  try {
    const res = await api.put(`/owner/bookings/${bookingId}/status`, { status });
    console.log('[ownerService] updateBookingStatus -> response', res);
    return res;
  } catch (err) {
    console.error('[ownerService] updateBookingStatus -> error', err.response || err);
    throw err;
  }
}
