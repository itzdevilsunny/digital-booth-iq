import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try to load user from localStorage on init
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse saved user', e);
            }
        }
        setLoading(false);
    }, []);

    const login = async (userData) => {
        try {
            const response = await api.login(userData);
            setUser(response.user);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            return response;
        } catch (e) {
            console.error('Login failed', e);
            throw e;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
        api.logout();
    };

    return (
        <UserContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
