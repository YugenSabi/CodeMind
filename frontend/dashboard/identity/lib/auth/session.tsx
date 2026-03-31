'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
};

type SessionState = {
  user: SessionUser | null;
  isLoading: boolean;
};

const AuthSessionContext = createContext<SessionState>({
  user: null,
  isLoading: true,
});

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({
  children,
}: AuthSessionProviderProps): ReactNode {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setState({
              user: null,
              isLoading: false,
            });
          }
          return;
        }

        const payload = (await response.json()) as SessionUser;

        if (!cancelled) {
          setState({
            user: payload,
            isLoading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            user: null,
            isLoading: false,
          });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}

export function getDisplayName(user: SessionUser) {
  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();

  return fullName || user.email;
}
