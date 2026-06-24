import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://172.30.8.40:8000'; // same IP jo client.ts mein hai, bina /api ke

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket> => {
    if (socket?.connected) return socket;

    const token = await AsyncStorage.getItem('accessToken');

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
        console.log('❌ Socket connection error:', err.message);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
    });

    return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};