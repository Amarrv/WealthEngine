import React, { createContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Global Interceptor setup inside the provider so it can trigger state changes
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          setUser(null);
          setIsAuthenticated(false);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  // Check valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        if (res.data.success) {
          setUser(res.data.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const loginWithPassword = async (phoneNumber, password) => {
    const res = await apiClient.post("/auth/login", { phoneNumber, password });
    if (res.data.success) {
      await fetchUserData();
    }
    return res.data;
  };

  const registerUser = async (username, phoneNumber, password) => {
    const res = await apiClient.post("/auth/register", { username, phoneNumber, password });
    if (res.data.success) {
      await fetchUserData();
    }
    return res.data;
  };

  const loginWithBiometrics = async (phoneNumber) => {
    // 1. Get options from server
    const optionsRes = await apiClient.post("/auth/generate-authentication-options", { phoneNumber });
    
    // 2. Pass options to authenticator
    const asseResp = await startAuthentication(optionsRes.data.options);
    
    // 3. Verify response with server
    const verificationRes = await apiClient.post("/auth/verify-authentication", {
      phoneNumber,
      body: asseResp
    });

    if (verificationRes.data.success) {
      await fetchUserData();
    }
    return verificationRes.data;
  };

  const registerPasskey = async () => {
    try {
      // 1. Get options from server
      const optionsRes = await apiClient.get("/auth/generate-registration-options");
      
      // 2. Pass options to authenticator
      const attResp = await startRegistration(optionsRes.data.options);
      
      // 3. Verify response with server
      const verificationRes = await apiClient.post("/auth/verify-registration", attResp);
      
      if (verificationRes.data.success) {
        alert("Passkey successfully registered!");
      } else {
        alert("Registration failed: " + verificationRes.data.message);
      }
      return verificationRes.data;
    } catch (err) {
      console.error(err);
      alert("Registration Error: " + (err.response?.data?.message || err.message));
    }
  };

  const logout = async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
    setIsAuthenticated(false);
  };

  const fetchUserData = async () => {
    const res = await apiClient.get("/auth/me");
    if (res.data.success) {
      setUser(res.data.data);
      setIsAuthenticated(true);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    loginWithPassword,
    registerUser,
    loginWithBiometrics,
    registerPasskey,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
