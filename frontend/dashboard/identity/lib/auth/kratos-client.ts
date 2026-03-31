import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { AuthFlowType, KratosFlow } from './kratos-types';

const KRATOS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_KRATOS_PUBLIC_URL ?? 'http://localhost:4433';

const FLOW_PATH_BY_TYPE: Record<AuthFlowType, string> = {
  login: 'login',
  registration: 'registration',
  verification: 'verification',
  recovery: 'recovery',
};

type FlowCopy = {
  title: string;
  description: string;
  submitLabel: string;
  secondaryAction?: {
    href: string;
    label: string;
  };
};

const FLOW_COPY: Record<AuthFlowType, FlowCopy> = {
  login: {
    title: 'Вход',
    description: 'Войдите в аккаунт, чтобы продолжить работу в CodeMind.',
    submitLabel: 'Войти',
    secondaryAction: {
      href: '/auth/registration',
      label: 'Нет аккаунта? Зарегистрироваться',
    },
  },
  registration: {
    title: 'Регистрация',
    description: 'Создайте аккаунт, чтобы получить доступ к совместной работе над кодом.',
    submitLabel: 'Создать аккаунт',
    secondaryAction: {
      href: '/auth/login',
      label: 'Уже есть аккаунт? Войти',
    },
  },
  verification: {
    title: 'Подтверждение почты',
    description: 'Введите код подтверждения из письма, чтобы завершить регистрацию.',
    submitLabel: 'Подтвердить',
  },
  recovery: {
    title: 'Восстановление доступа',
    description: 'Укажите email, и мы отправим письмо для восстановления доступа.',
    submitLabel: 'Отправить письмо',
    secondaryAction: {
      href: '/auth/login',
      label: 'Вернуться ко входу',
    },
  },
};

export function createBrowserFlowUrl(flowType: AuthFlowType) {
  return `${KRATOS_PUBLIC_URL}/self-service/${FLOW_PATH_BY_TYPE[flowType]}/browser`;
}

export function createLogoutUrl() {
  return `${KRATOS_PUBLIC_URL}/self-service/logout/browser`;
}

type LogoutFlow = {
  logout_url: string;
  logout_token: string;
};

export async function createLogoutFlow(): Promise<LogoutFlow> {
  const response = await fetch(createLogoutUrl(), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Logout flow request failed with status ${response.status}`);
  }

  return response.json() as Promise<LogoutFlow>;
}

export async function getKratosFlow(
  flowType: AuthFlowType,
  flowId: string,
): Promise<KratosFlow> {
  const response = await fetch(
    `${KRATOS_PUBLIC_URL}/self-service/${FLOW_PATH_BY_TYPE[flowType]}/flows?id=${encodeURIComponent(flowId)}`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`Auth flow request failed with status ${response.status}`);
  }

  return response.json() as Promise<KratosFlow>;
}

export function getFlowIdFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
) {
  return searchParams.get('flow');
}

export function getFlowPageCopy(flowType: AuthFlowType) {
  return FLOW_COPY[flowType];
}
