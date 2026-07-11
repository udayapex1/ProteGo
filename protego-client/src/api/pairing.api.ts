import apiClient from "./client";

export const pairingApi = {
  generateCode: async () => {
    const { data } = await apiClient.post('/pair/generate');
    return data as { code: string; expiresAt: string };
  },

  joinWithCode: async (code: string) => {
    const { data } = await apiClient.post('/pair/join', { code });
    return data as { message: string };
  },

  unpair: async () => {
    const { data } = await apiClient.delete('/pair/unpair');
    return data as { message: string };
  },

  getPairedUser: async () => {
    const { data } = await apiClient.get('/pair/paired-user');
    return data as { id: string; name: string; role: string };
  },
};