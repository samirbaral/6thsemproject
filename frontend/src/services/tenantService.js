import api from './api';

export async function getAllRooms(filters) {
  console.log('[tenantService] getAllRooms()', filters);
  try {
    const res = await api.get('/tenant/rooms', { params: filters });
    console.log('[tenantService] getAllRooms -> response', res);
    return res;
  } catch (err) {
    console.error('[tenantService] getAllRooms -> error', err.response || err);
    throw err;
  }
}

export async function getRoom(roomId) {
  console.log('[tenantService] getRoom()', roomId);
  try {
    const res = await api.get(`/tenant/rooms/${roomId}`);
    console.log('[tenantService] getRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[tenantService] getRoom -> error', err.response || err);
    throw err;
  }
}

export async function bookRoom(data) {
  console.log('[tenantService] bookRoom()', data);
  try {
    const res = await api.post('/tenant/bookings', data);
    console.log('[tenantService] bookRoom -> response', res);
    return res;
  } catch (err) {
    console.error('[tenantService] bookRoom -> error', err.response || err);
    throw err;
  }
}

export async function getMyBookings() {
  console.log('[tenantService] getMyBookings()');
  try {
    const res = await api.get('/tenant/bookings');
    console.log('[tenantService] getMyBookings -> response', res);
    return res;
  } catch (err) {
    console.error('[tenantService] getMyBookings -> error', err.response || err);
    throw err;
  }
}

export async function cancelBooking(bookingId) {
  console.log('[tenantService] cancelBooking()', bookingId);
  try {
    const res = await api.post(`/tenant/bookings/${bookingId}/cancel`);
    console.log('[tenantService] cancelBooking -> response', res);
    return res;
  } catch (err) {
    console.error('[tenantService] cancelBooking -> error', err.response || err);
    throw err;
  }
}
