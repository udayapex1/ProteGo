const SERVER_URL = 'http://10.163.149.50:8000';

const trimTrailingSlashes = (url: string) => url.replace(/\/+$/, '');

export const API_BASE_URL = `${trimTrailingSlashes(SERVER_URL)}/api`;
export const SOCKET_URL = trimTrailingSlashes(SERVER_URL);
