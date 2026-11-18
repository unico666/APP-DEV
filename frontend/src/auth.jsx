import { createContext, useContext, useState } from 'react';
import { authApi, tokens } from './api.js';

const AuthContext = createContext(null);

function decode(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { id: Number(payload.sub), username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (tokens.access ? decode(tokens.access) : null));

  const login = async (username, password) => {
    const { accessToken, refreshToken } = await authApi.login({ username, password });
    tokens.set(accessToken, refreshToken);
    setUser(decode(accessToken));
  };

  const logout = async () => {
    try { if (tokens.refresh) await authApi.logout(tokens.refresh); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
