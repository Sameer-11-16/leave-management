import axios from 'axios';

const API = axios.create({ 
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://leave-management-8xqz.onrender.com/api' 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;