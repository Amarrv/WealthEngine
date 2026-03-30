import axios from "axios";

// Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // Vercel env or local
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // Drop the request if the server takes longer than 5 seconds
});

export default apiClient;
