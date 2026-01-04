import api from './api';

export async function register(payload) {
  console.log('[authService] register()', payload);
  try {
    const res = await api.post('/auth/register', payload);
    console.log('[authService] register -> response', res);
    return res;
  } catch (err) {
    console.error('[authService] register -> error', err.response || err);
    throw err;
  }
}

export async function signin(payload) {
  console.log('[authService] signin()', payload);
  try {
    const res = await api.post('/auth/signin', payload);
    console.log('[authService] signin -> response', res);
    return res;
  } catch (err) {
    console.error('[authService] signin -> error', err.response || err);
    throw err;
  }
}

export async function signout() {
  console.log('[authService] signout()');
  try {
    const res = await api.post('/auth/signout');
    console.log('[authService] signout -> response', res);
    return res;
  } catch (err) {
    console.error('[authService] signout -> error', err.response || err);
    throw err;
  }
}
