'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext({ user: null, loading: true, error: '' });

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ user: null, loading: true, error: '' });

  useEffect(() => {
    let subscription;
    try {
      const supabase = createClient();
      // INITIAL_SESSION restores the saved session; later events keep all UI in sync.
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuth({ user: session?.user ?? null, loading: false, error: '' });
      });
      subscription = data.subscription;
    } catch {
      setAuth({ user: null, loading: false, error: '로그인 연결 설정을 확인해 주세요.' });
    }
    return () => subscription?.unsubscribe();
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}