import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lms_token');
    if (token) {
      authAPI.getMe()
        .then((res) => setAdmin(res.data.admin))
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('lms_token');
            localStorage.removeItem('lms_admin');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (data) => {
    const res = await authAPI.signup(data);
    const { token, admin } = res.data;
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_admin', JSON.stringify(admin));
    setAdmin(admin);
    return admin;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, admin } = res.data;
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_admin', JSON.stringify(admin));
    setAdmin(admin);
    return admin;
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_admin');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, signup, login, logout, loading, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
