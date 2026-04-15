import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

interface UserInfo {
  user_id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  login: (password: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string; requires_2fa?: boolean; tmp_token?: string; redirect_telegram?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, name: string, referralCode?: string) => Promise<{ ok: boolean; error?: string; registered?: boolean; redirect_telegram?: string }>;
  verify2fa: (tmp_token: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    fetch('/api/me', { credentials: 'include', signal: controller.signal })
      .then((r) => {
        if (!r.ok) return { authenticated: false };
        return r.json();
      })
      .then((data) => {
        if (!mountedRef.current) return;
        setIsAuthenticated(data.authenticated === true);
        if (data.authenticated) {
          setUser({ user_id: data.user_id ?? 0, name: data.name ?? '', email: data.email ?? '', is_admin: data.is_admin ?? false });
        }
      })
      .catch(() => { if (mountedRef.current) setIsAuthenticated(false); })
      .finally(() => { if (mountedRef.current) setIsLoading(false); });
    return () => { mountedRef.current = false; controller.abort(); };
  }, []);

  const _setAuthed = (data: { name?: string; email?: string; user_id?: number; is_admin?: boolean }) => {
    setIsAuthenticated(true);
    setUser({ user_id: data.user_id ?? 0, name: data.name ?? '', email: data.email ?? '', is_admin: data.is_admin ?? false });
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.ok) { _setAuthed(data); return true; }
      return false;
    } catch { return false; }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!res.ok) return { ok: false, error: 'Ошибка сервера' };
      const data = await res.json();
      if (data.ok) _setAuthed(data);
      return { ok: data.ok, error: data.error, requires_2fa: data.requires_2fa, tmp_token: data.tmp_token, redirect_telegram: data.redirect_telegram };
    } catch { return { ok: false, error: 'Ошибка соединения' }; }
  };

  const verify2fa = async (tmp_token: string, code: string) => {
    try {
      const res = await fetch('/api/login/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmp_token, code }),
        credentials: 'include',
      });
      if (!res.ok) return { ok: false, error: 'Ошибка сервера' };
      const data = await res.json();
      if (data.ok) _setAuthed(data);
      return { ok: data.ok, error: data.error || data.detail };
    } catch { return { ok: false, error: 'Ошибка соединения' }; }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
        credentials: 'include',
      });
      if (!res.ok) return { ok: false, error: 'Ошибка сервера' };
      const data = await res.json();
      if (data.ok) _setAuthed(data);
      return { ok: data.ok, error: data.error };
    } catch { return { ok: false, error: 'Ошибка соединения' }; }
  };

  const register = async (email: string, password: string, name: string, referralCode?: string) => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, ...(referralCode ? { referral_code: referralCode } : {}) }),
        credentials: 'include',
      });
      if (!res.ok) return { ok: false, error: 'Ошибка сервера' };
      const data = await res.json();
      if (data.ok) _setAuthed(data);
      return { ok: data.ok, error: data.error, registered: data.registered, redirect_telegram: data.redirect_telegram };
    } catch { return { ok: false, error: 'Ошибка соединения' }; }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, loginWithEmail, loginWithGoogle, register, verify2fa, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
