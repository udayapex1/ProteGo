
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'https://protego-oa3l.onrender.com';

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

export const API_BASE_URL = `${trimTrailingSlashes(SERVER_URL)}/api`;
export const SOCKET_URL = trimTrailingSlashes(SERVER_URL);

