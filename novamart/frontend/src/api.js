import axios from 'axios';

// Base URLs — read from .env (dev) or .env.production (Docker build)
const AUTH_URL      = import.meta.env.VITE_AUTH_URL      || 'http://localhost:8001';
const INVENTORY_URL = import.meta.env.VITE_INVENTORY_URL || 'http://localhost:8002';
const SALES_URL     = import.meta.env.VITE_SALES_URL     || 'http://localhost:8003';
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8004';
const AI_URL        = import.meta.env.VITE_AI_URL        || 'http://localhost:8005';

// Create separate axios instances for each service
function createClient(baseURL) {
  const client = axios.create({ baseURL });

  // Automatically attach JWT token to every request
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

export const authAPI = createClient(AUTH_URL);
export const inventoryAPI = createClient(INVENTORY_URL);
export const salesAPI = createClient(SALES_URL);
export const analyticsAPI = createClient(ANALYTICS_URL);
export const aiAPI = createClient(AI_URL);
