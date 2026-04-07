import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ROUTING_SECRET_KEY;

export const getHashedPath = (role, tabId = "home") => {
  if (!role) return '';
  const combined = role.toLowerCase() + tabId.toLowerCase() + SECRET_KEY;
  return CryptoJS.SHA256(combined).toString().substring(0, 8);
};

export const getHashedRole = (role) => getHashedPath(role, "home");