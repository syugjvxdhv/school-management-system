import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// Set your base URL once
const API_BASE_URL = 'http://127.0.0.1:8000/api/';
axios.defaults.baseURL = API_BASE_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Clear all auth data from storage and state
     */
    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    }, []);

    /**
     * Fetch current user profile from backend
     */
    const fetchUserData = async () => {
        try {
            const res = await axios.get('users/me/');
            setUser(res.data);
            return res.data;
        } catch (error) {
            // If we get a 401 here, the session is likely dead
            if (error.response?.status === 401) logout();
            throw error;
        }
    };

    /**
     * Refresh JWT logic
     */
    const refreshToken = useCallback(async () => {
        try {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) throw new Error('No refresh token available');
            
            // Note: Using a fresh axios instance or specific config to avoid 
            // infinite loops if the refresh call itself fails
            const response = await axios.post('token/refresh/', { refresh });
            const newAccess = response.data.access;
            
            localStorage.setItem('access_token', newAccess);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
            return newAccess;
        } catch (error) {
            logout();
            return null;
        }
    }, [logout]);

    /**
     * Interceptor Logic
     * Handles 401 errors by attempting to refresh the token and retrying the request
     */
    useEffect(() => {
        // Request Interceptor: Ensure latest token is always attached
        const reqInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('access_token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response Interceptor: Handle Token Expiry
        const resInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                // If 401 and we haven't retried yet, and it's not a login/refresh call
                if (
                    error.response?.status === 401 && 
                    !originalRequest._retry && 
                    !originalRequest.url.includes('token/')
                ) {
                    originalRequest._retry = true;
                    const newToken = await refreshToken();
                    
                    if (newToken) {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    }
                }
                return Promise.reject(error);
            }
        );

        // Clean up interceptors on unmount
        return () => {
            axios.interceptors.request.eject(reqInterceptor);
            axios.interceptors.response.eject(resInterceptor);
        };
    }, [refreshToken]);

    /**
     * App Initialization
     */
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                // Set default for the initial fetch
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    await fetchUserData();
                } catch (e) {
                    console.warn("Session expired on init");
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    /**
     * Login Function
     */
    const login = async (username, password) => {
        try {
            const res = await axios.post('token/', { username, password });
            const { access, refresh } = res.data;
            
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            
            // Apply header immediately
            axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            
            return await fetchUserData();
        } catch (error) {
            throw error;
        }
    };

    // Memoize value to prevent unnecessary re-renders of the entire app
    const contextValue = useMemo(() => ({ 
        user, 
        login, 
        logout, 
        loading 
    }), [user, loading, logout]);

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};