export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setAuth = (token, user) => {
  console.log('[auth] setAuth()', { token: !!token, user });
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  console.log('[auth] clearAuth()');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'ADMIN';
};

export const isOwner = () => {
  const user = getUser();
  return user?.role === 'OWNER';
};

export const isTenant = () => {
  const user = getUser();
  return user?.role === 'TENANT';
};

