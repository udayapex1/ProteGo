
const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://10.207.80.50:8000';

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

export const API_BASE_URL = `${trimTrailingSlashes(SERVER_URL)}/api`;
export const SOCKET_URL = trimTrailingSlashes(SERVER_URL);

