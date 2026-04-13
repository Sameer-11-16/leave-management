import axios from 'axios';

const API = axios.create({ 
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5001/api' 
    : 'https://leave-management-8xqz.onrender.com/api' 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Artificial delay for loading states (only runs locally!)
API.interceptors.response.use(async (response) => {
  if (window.location.hostname === 'localhost') {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return response;
}, async (error) => {
  if (window.location.hostname === 'localhost') {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return Promise.reject(error);
});

export default API;