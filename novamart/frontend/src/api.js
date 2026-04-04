import axios from 'axios';

// Base URLs for each microservice
const AUTH_URL = 'http://localhost:8001';
const INVENTORY_URL = 'http://localhost:8002';
const SALES_URL = 'http://localhost:8003';
const ANALYTICS_URL = 'http://localhost:8004';

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
