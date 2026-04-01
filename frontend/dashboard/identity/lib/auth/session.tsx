'use client';

import {
  useCallback,
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
  avatarUrl?: string | null;
  isVerified: boolean;
  createdAt?: string;
};

type SessionState = {
  user: SessionUser | null;
  isLoading: boolean;
  requiresVerification: boolean;
  verificationMessage: string | null;
  refreshSession: () => Promise<void>;
  updateSessionUser: (user: SessionUser) => void;
};

const AuthSessionContext = createContext<SessionState>({
  user: null,
  isLoading: true,
  requiresVerification: false,
  verificationMessage: null,
  refreshSession: async () => {},
  updateSessionUser: () => {},
});

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({
  children,
}: AuthSessionProviderProps): ReactNode {
  const [state, setState] = useState({
    user: null as SessionUser | null,
    isLoading: true,
    requiresVerification: false,
    verificationMessage: null as string | null,
  });

  const updateSessionUser = useCallback((user: SessionUser) => {
    setState((current) => ({
      ...current,
      user,
    }));
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | {
              code?: string;
              message?: string | string[];
              user?: SessionUser;
            }
          | null;

        setState({
          user:
            payload?.code === 'ACCOUNT_NOT_VERIFIED' ? payload.user ?? null : null,
          isLoading: false,
          requiresVerification: payload?.code === 'ACCOUNT_NOT_VERIFIED',
          verificationMessage:
            typeof payload?.message === 'string'
              ? payload.message
              : 'Подтвердите аккаунт, чтобы продолжить работу.',
        });
        return;
      }

      const payload = (await response.json()) as SessionUser;

      setState({
        user: payload,
        isLoading: false,
        requiresVerification: false,
        verificationMessage: null,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        requiresVerification: false,
        verificationMessage: null,
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadSession().catch(() => {
      if (!cancelled) {
        setState({
          user: null,
          isLoading: false,
          requiresVerification: false,
          verificationMessage: null,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  const value = useMemo(
    () => ({
      ...state,
      refreshSession: loadSession,
      updateSessionUser,
    }),
    [loadSession, state, updateSessionUser],
  );

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
