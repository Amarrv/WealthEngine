import axios from 'axios';

// Create a centralized Axios instance for all API calls
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // This is the most critical line for the JWT Pipeline:
  // It forces Axios to attach the HttpOnly cookie (`auth_token`) to every request naturally.
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
