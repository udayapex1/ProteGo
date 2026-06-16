import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTMwMjc4YzVlMGFlZGU5MDMzYTI3OGIiLCJyb2xlIjoicGFyZW50IiwiaWF0IjoxNzgxNTk2NTExLCJleHAiOjE3ODE1OTc0MTF9.Z4pS8-r129HUh-wTSBjqmGKhovpPxv-zLD0sbuTnzQA'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});
socket.on('geofence:breach', (data) => {
  console.log('🚧 Geofence Breach:', data);
});

socket.on('location:update', (data) => {
  console.log('📍 Location Update:', data);
});

socket.on('sos:alert', (data) => {
  console.log('🚨 SOS Alert:', data);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection Error:', err.message);
});