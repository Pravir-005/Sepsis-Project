import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// Attach JWT token automatically
client.interceptors.request.use(config => {
    const token = localStorage.getItem('sepsis_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401: clear token and redirect to login
client.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sepsis_token');
            localStorage.removeItem('sepsis_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default client;
