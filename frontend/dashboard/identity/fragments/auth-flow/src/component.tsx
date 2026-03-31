'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthSession } from '@lib/auth';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import {
  createBrowserFlowUrl,
  getFlowIdFromSearchParams,
  getFlowPageCopy,
  getKratosFlow,
  type AuthFlowType,
  type KratosFlow,
  type KratosUiNode,
} from '@lib/auth';

type AuthFlowComponentProps = {
  flowType: AuthFlowType;
};

export function AuthFlowComponent({
  flowType,
}: AuthFlowComponentProps): ReactNode {
  const searchParams = useSearchParams();
  const { user } = useAuthSession();
  const [flow, setFlow] = useState<KratosFlow | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(
    null,
  );

  const copy = useMemo(() => getFlowPageCopy(flowType), [flowType]);
  const isVerifiedRedirect = searchParams.get('verified') === '1';

  useEffect(() => {
    let cancelled = false;

    async function loadFlow() {
      const currentFlowId = getFlowIdFromSearchParams(searchParams);

      if (!currentFlowId) {
        window.location.assign(createBrowserFlowUrl(flowType));
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextFlow = await getKratosFlow(flowType, currentFlowId);

        if (!cancelled) {
          setFlow(nextFlow);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить форму. Попробуйте еще раз.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFlow();

    return () => {
      cancelled = true;
    };
  }, [flowType, searchParams]);

  const hiddenNodes = flow ? getHiddenNodes(flow.ui.nodes) : [];
  const fieldNodes = flow
    ? flow.ui.nodes.filter(
        (node) =>
          node.attributes.node_type === 'input' &&
          node.attributes.type !== 'hidden' &&
          node.attributes.type !== 'submit',
      )
    : [];
  const orderedFieldNodes =
    flowType === 'registration'
      ? orderRegistrationNodes(fieldNodes)
      : fieldNodes;
  const submitNode = flow
    ? flow.ui.nodes.find(
        (node) =>
          node.attributes.node_type === 'input' &&
          node.attributes.type === 'submit',
      )
    : null;
  const flowMessages = flow?.ui.messages ?? [];
  const passwordNode = fieldNodes.find((node) => node.attributes.name === 'password');

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    if (flowType !== 'registration' || !passwordNode) {
      return;
    }

    const passwordInput = (
      event.currentTarget.elements.namedItem('password') as HTMLInputElement | null
    )?.value;
    const currentPassword =
      passwordInput ?? toStringValue(passwordNode.attributes.value);

    if (confirmPassword.trim().length === 0) {
      event.preventDefault();
      setConfirmPasswordError('Повторите пароль.');
      return;
    }

    if (currentPassword !== confirmPassword) {
      event.preventDefault();
      setConfirmPasswordError('Пароли не совпадают.');
      return;
    }

    setConfirmPasswordError(null);
  };

  return (
    <Box width="$full" minHeight="$full" alignItems="center" justifyContent="center">
      <Box
        as="section"
        width="$full"
        maxWidth={560}
        flexDirection="column"
        gap={18}
        backgroundColor="$mainCards"
        border="1px solid"
        borderColor="$border"
        borderRadius={30}
        paddingTop={28}
        paddingRight={24}
        paddingBottom={24}
        paddingLeft={24}
      >
        <Box flexDirection="column" alignItems="center" gap={8}>
          <Text color="#FFFFFF" font="$rus" size={28} lineHeight="34px" textAlign="center">
            {copy.title}
          </Text>
          <Text
            color="$secondaryText"
            font="$footer"
            size={16}
            lineHeight="22px"
            textAlign="center"
          >
            {copy.description}
          </Text>
        </Box>

        {isLoading ? <StatusMessage text="Загрузка формы..." tone="muted" /> : null}
        {!isLoading && errorMessage ? (
          <StatusMessage text={errorMessage} tone="error" />
        ) : null}
        {!isLoading && isVerifiedRedirect ? (
          <StatusMessage
            text="Почта подтверждена. Теперь войдите в аккаунт."
            tone="muted"
          />
        ) : null}
        {!isLoading && verificationInfo ? (
          <StatusMessage text={verificationInfo} tone="muted" />
        ) : null}

        {!isLoading && flow ? (
          <form action={flow.ui.action} method={flow.ui.method} onSubmit={handleSubmit}>
            <Box flexDirection="column" gap={14}>
              {flowMessages.map((message) => (
                <StatusMessage
                  key={`${message.id}-${message.text}`}
                  text={message.text}
                  tone={message.type === 'error' ? 'error' : 'muted'}
                />
              ))}

              {hiddenNodes.map((node) => (
                <input
                  key={node.attributes.name}
                  type="hidden"
                  name={node.attributes.name}
                  value={toStringValue(node.attributes.value)}
                />
              ))}

              {orderedFieldNodes.map((node) => (
                <Box key={node.attributes.name} flexDirection="column" gap={14}>
                  <Field
                    node={node}
                    flowType={flowType}
                    isPasswordVisible={isPasswordVisible}
                    onTogglePasswordVisibility={() => {
                      setIsPasswordVisible((current) => !current);
                    }}
                  />

                  {flowType === 'registration' &&
                  node.attributes.name === 'password' &&
                  passwordNode ? (
                    <ConfirmPasswordField
                      value={confirmPassword}
                      error={confirmPasswordError}
                      isPasswordVisible={isConfirmPasswordVisible}
                      onTogglePasswordVisibility={() => {
                        setIsConfirmPasswordVisible((current) => !current);
                      }}
                      onChange={(value) => {
                        setConfirmPassword(value);
                        if (confirmPasswordError) {
                          setConfirmPasswordError(null);
                        }
                      }}
                    />
                  ) : null}
                </Box>
              ))}

              <Button
                type="submit"
                name={submitNode?.attributes.name ?? 'method'}
                value={toStringValue(submitNode?.attributes.value) || 'password'}
                variant="filled"
                height={56}
                borderRadius={18}
                bg="#43953D"
                textColor="#FFFFFF"
                font="$rus"
                fontSize={20}
                style={{ marginTop: 6 }}
              >
                {copy.submitLabel}
              </Button>

              {copy.secondaryAction ? (
                <Button
                  type="link"
                  href={copy.secondaryAction.href}
                  variant="ghost"
                  height={44}
                  borderRadius={15}
                  textColor="$secondaryText"
                  font="$footer"
                  fontSize={15}
                >
                  {copy.secondaryAction.label}
                </Button>
              ) : null}

              {flowType === 'verification' ? (
                <Button
                  type="button"
                  variant="ghost"
                  height={44}
                  borderRadius={15}
                  textColor="$secondaryText"
                  font="$footer"
                  fontSize={15}
                  disabled={isResendingVerification}
                  onClick={() => {
                    void handleResendVerificationCode({
                      onStart: () => {
                        setIsResendingVerification(true);
                        setErrorMessage(null);
                        setVerificationInfo(null);
                      },
                      onSuccess: (message) => {
                        setIsResendingVerification(false);
                        setVerificationInfo(message);
                      },
                      onError: (message) => {
                        setIsResendingVerification(false);
                        setErrorMessage(message);
                      },
                    });
                  }}
                >
                  {isResendingVerification
                    ? 'Отправка...'
                    : `Отправить код повторно${user?.email ? ` на ${user.email}` : ''}`}
                </Button>
              ) : null}
            </Box>
          </form>
        ) : null}

        {flowType === 'verification' || flowType === 'recovery' ? (
          <Text
            color="$secondaryText"
            font="$footer"
            size={13}
            lineHeight="18px"
            textAlign="center"
          >
            Проверьте письмо, отправленное на указанную почту.
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

function Field({
  node,
  flowType,
  isPasswordVisible,
  onTogglePasswordVisibility,
}: {
  node: KratosUiNode;
  flowType: AuthFlowType;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
}): ReactNode {
  const label = humanizeName(node.attributes.name);
  const isPasswordField = node.attributes.type === 'password';
  const inputType = isPasswordField
    ? isPasswordVisible
      ? 'text'
      : 'password'
    : 'text';
  const message = node.messages?.[0]?.text;

  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
        {label}
      </Text>
      <Input
        name={node.attributes.name}
        type={inputType}
        defaultValue={toStringValue(node.attributes.value)}
        required={node.attributes.required}
        disabled={node.attributes.disabled}
        autoComplete={resolveAutoComplete(
          node.attributes.name,
          node.attributes.type,
          flowType,
        )}
        fullWidth
        size="lg"
        variant="outline"
        radius="lg"
        font="$footer"
        fontSize={16}
        textColor="#FFFFFF"
        borderColor="$border"
        bg="$mainCards"
        placeholder={label}
        placeholderColor="$secondaryText"
        endIcon={
          isPasswordField ? (
            <PasswordVisibilityButton
              isVisible={isPasswordVisible}
              onClick={onTogglePasswordVisibility}
            />
          ) : undefined
        }
        endIconInteractive={isPasswordField}
        style={{ paddingLeft: 18, paddingRight: 18 }}
      />
      {message ? (
        <Text color="#FFB4B4" font="$footer" size={13} lineHeight="18px">
          {message}
        </Text>
      ) : null}
    </Box>
  );
}

function ConfirmPasswordField({
  value,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
  onChange,
}: {
  value: string;
  error: string | null;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  onChange: (value: string) => void;
}): ReactNode {
  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
        Повторите пароль
      </Text>
      <Input
        name="confirm_password"
        type={isPasswordVisible ? 'text' : 'password'}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        required
        autoComplete="new-password"
        fullWidth
        size="lg"
        variant="outline"
        radius="lg"
        font="$footer"
        fontSize={16}
        textColor="#FFFFFF"
        borderColor={error ? '#D14343' : '$border'}
        bg="$mainCards"
        placeholder="Повторите пароль"
        placeholderColor="$secondaryText"
        endIcon={
          <PasswordVisibilityButton
            isVisible={isPasswordVisible}
            onClick={onTogglePasswordVisibility}
          />
        }
        endIconInteractive
        style={{ paddingLeft: 18, paddingRight: 18 }}
      />
      {error ? (
        <Text color="#FFB4B4" font="$footer" size={13} lineHeight="18px">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

function PasswordVisibilityButton({
  isVisible,
  onClick,
}: {
  isVisible: boolean;
  onClick: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
      aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
    >
      {isVisible ? <EyeCloseIcon /> : <EyeOpenIcon />}
    </button>
  );
}

function EyeCloseIcon(): ReactNode {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_638_553)">
        <g clipPath="url(#clip1_638_553)">
          <path
            d="M31.7613 14.908C30.4731 12.1143 28.5863 9.63803 26.2346 7.65467L30.2773 3.612L28.3906 1.724L24 6.11067C21.5698 4.70496 18.8073 3.97613 16 4C5.99995 4 1.40928 12.348 0.238617 14.908C0.0814681 15.2511 0.00012207 15.624 0.00012207 16.0013C0.00012207 16.3787 0.0814681 16.7516 0.238617 17.0947C1.5268 19.8884 3.41358 22.3646 5.76528 24.348L1.72395 28.3907L3.60928 30.276L7.99995 25.8893C10.4301 27.295 13.1926 28.0239 16 28C26 28 30.5906 19.652 31.7613 17.092C31.9181 16.7493 31.9993 16.3769 31.9993 16C31.9993 15.6231 31.9181 15.2507 31.7613 14.908ZM2.66662 16.0147C3.66662 13.8213 7.59062 6.66667 16 6.66667C18.0927 6.65443 20.1581 7.14267 22.0239 8.09067L19.6706 10.444C18.3905 9.59413 16.8558 9.21333 15.3269 9.36619C13.798 9.51906 12.3691 10.1962 11.2826 11.2827C10.1961 12.3692 9.51901 13.7981 9.36615 15.327C9.21328 16.8559 9.59409 18.3906 10.444 19.6707L7.67195 22.4427C5.53912 20.7058 3.82778 18.5081 2.66662 16.0147ZM20 16C20 17.0609 19.5785 18.0783 18.8284 18.8284C18.0782 19.5786 17.0608 20 16 20C15.406 19.9977 14.8202 19.8609 14.2866 19.6L19.6 14.2867C19.8609 14.8203 19.9977 15.406 20 16ZM12 16C12 14.9391 12.4214 13.9217 13.1715 13.1716C13.9217 12.4214 14.9391 12 16 12C16.5939 12.0023 17.1797 12.1391 17.7133 12.4L12.4 17.7133C12.139 17.1797 12.0023 16.594 12 16ZM16 25.3333C13.9072 25.3456 11.8418 24.8573 9.97595 23.9093L12.3293 21.556C13.6094 22.4059 15.1441 22.7867 16.673 22.6338C18.2019 22.4809 19.6308 21.8038 20.7173 20.7173C21.8038 19.6308 22.4809 18.2019 22.6338 16.673C22.7866 15.1441 22.4058 13.6094 21.556 12.3293L24.3266 9.55867C26.4636 11.2971 28.176 13.5001 29.3333 16C28.3146 18.2093 24.3893 25.3333 16 25.3333Z"
            fill="#FFFFFF"
          />
        </g>
        <path
          d="M16 9.33331C14.6815 9.33331 13.3926 9.72431 12.2962 10.4568C11.1999 11.1894 10.3454 12.2306 9.84085 13.4488C9.33626 14.6669 9.20424 16.0074 9.46148 17.3006C9.71871 18.5938 10.3536 19.7817 11.286 20.714C12.2183 21.6464 13.4062 22.2813 14.6994 22.5385C15.9926 22.7958 17.3331 22.6638 18.5513 22.1592C19.7694 21.6546 20.8106 20.8001 21.5432 19.7038C22.2757 18.6075 22.6667 17.3185 22.6667 16C22.6646 14.2325 21.9615 12.5381 20.7118 11.2883C19.462 10.0385 17.7675 9.33543 16 9.33331ZM16 20C15.2089 20 14.4356 19.7654 13.7778 19.3259C13.12 18.8863 12.6073 18.2616 12.3045 17.5307C12.0018 16.7998 11.9226 15.9955 12.0769 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6121 14.4438 12.2312 15.2197 12.0768C15.9956 11.9225 16.7999 12.0017 17.5308 12.3045C18.2617 12.6072 18.8864 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0608 19.5786 18.0783 18.8285 18.8284C18.0783 19.5786 17.0609 20 16 20Z"
          fill="#FFFFFF"
        />
      </g>
      <defs>
        <clipPath id="clip0_638_553">
          <rect width="32" height="32" fill="white" />
        </clipPath>
        <clipPath id="clip1_638_553">
          <rect width="32" height="32" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function EyeOpenIcon(): ReactNode {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      color="#FFFFFF"
    >
      <g clipPath="url(#clip0)">
        <path
          d="M31.0279 12.5587C28.9599 9.19066 24.2559 3.53999 15.9999 3.53999C7.74395 3.53999 3.03995 9.19066 0.971946 12.5587C0.33265 13.5927 -0.00598145 14.7843 -0.00598145 16C-0.00598145 17.2157 0.33265 18.4073 0.971946 19.4413C3.03995 22.8093 7.74395 28.46 15.9999 28.46C24.2559 28.46 28.9599 22.8093 31.0279 19.4413C31.6672 18.4073 32.0059 17.2157 32.0059 16C32.0059 14.7843 31.6672 13.5927 31.0279 12.5587ZM28.7546 18.0453C26.9786 20.9333 22.9586 25.7933 15.9999 25.7933C9.04128 25.7933 5.02128 20.9333 3.24528 18.0453C2.86546 17.4307 2.66428 16.7225 2.66428 16C2.66428 15.2775 2.86546 14.5693 3.24528 13.9547C5.02128 11.0667 9.04128 6.20666 15.9999 6.20666C22.9586 6.20666 26.9786 11.0613 28.7546 13.9547C29.1344 14.5693 29.3356 15.2775 29.3356 16C29.3356 16.7225 29.1344 17.4307 28.7546 18.0453Z"
          fill="currentColor"
        />
        <path
          d="M16 9.33333C14.6815 9.33333 13.3926 9.72432 12.2962 10.4569C11.1999 11.1894 10.3454 12.2306 9.84085 13.4488C9.33626 14.6669 9.20424 16.0074 9.46148 17.3006C9.71871 18.5938 10.3536 19.7817 11.286 20.714C12.2183 21.6464 13.4062 22.2813 14.6994 22.5386C15.9926 22.7958 17.3331 22.6638 18.5513 22.1592C19.7694 21.6546 20.8106 20.8001 21.5432 19.7038C22.2757 18.6075 22.6667 17.3185 22.6667 16C22.6646 14.2325 21.9615 12.5381 20.7118 11.2883C19.462 10.0385 17.7675 9.33545 16 9.33333ZM16 20C15.2089 20 14.4356 19.7654 13.7778 19.3259C13.12 18.8863 12.6073 18.2616 12.3045 17.5307C12.0018 16.7998 11.9226 15.9956 12.0769 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4438 12.2312 15.2197 12.0769C15.9956 11.9225 16.7999 12.0017 17.5308 12.3045C18.2617 12.6072 18.8864 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8285 18.8284C18.0783 19.5786 17.0609 20 16 20Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width="32" height="32" />
        </clipPath>
      </defs>
    </svg>
  );
}

function StatusMessage({
  text,
  tone,
}: {
  text: string;
  tone: 'error' | 'muted';
}): ReactNode {
  return (
    <Box
      backgroundColor={
        tone === 'error'
          ? 'rgba(209, 67, 67, 0.12)'
          : 'rgba(145, 152, 161, 0.08)'
      }
      border="1px solid"
      borderColor={tone === 'error' ? '#D14343' : '$border'}
      borderRadius={18}
      paddingTop={12}
      paddingRight={14}
      paddingBottom={12}
      paddingLeft={14}
    >
      <Text
        color={tone === 'error' ? '#FFB4B4' : '$secondaryText'}
        font="$footer"
        size={14}
        lineHeight="20px"
      >
        {text}
      </Text>
    </Box>
  );
}

function getHiddenNodes(nodes: KratosUiNode[]) {
  return nodes.filter(
    (node) =>
      node.attributes.node_type === 'input' && node.attributes.type === 'hidden',
  );
}

function orderRegistrationNodes(nodes: KratosUiNode[]) {
  const order = [
    'traits.email',
    'password',
    'traits.first_name',
    'traits.last_name',
  ];

  return [...nodes].sort((left, right) => {
    const leftIndex = order.indexOf(left.attributes.name);
    const rightIndex = order.indexOf(right.attributes.name);
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRightIndex =
      rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeftIndex - normalizedRightIndex;
  });
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function humanizeName(name: string) {
  switch (name) {
    case 'traits.email':
    case 'identifier':
      return 'Электронная почта';
    case 'password':
      return 'Пароль';
    case 'traits.first_name':
      return 'Имя';
    case 'traits.last_name':
      return 'Фамилия';
    case 'code':
      return 'Код подтверждения';
    default:
      return name;
  }
}

function resolveAutoComplete(
  name: string,
  type: string,
  flowType: AuthFlowType,
) {
  if (name === 'traits.email' || name === 'identifier') return 'email';
  if (name === 'traits.first_name') return 'given-name';
  if (name === 'traits.last_name') return 'family-name';
  if (name === 'password' && type === 'password') {
    return flowType === 'registration' ? 'new-password' : 'current-password';
  }
  if (name === 'code') return 'one-time-code';
  return undefined;
}

async function handleResendVerificationCode({
  onStart,
  onSuccess,
  onError,
}: {
  onStart: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

  try {
    onStart();

    const response = await fetch(`${backendUrl}/auth/verification/resend`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; email?: string; message?: string | string[] }
      | null;

    if (!response.ok) {
      if (typeof payload?.message === 'string') {
        onError(payload.message);
        return;
      }

      if (Array.isArray(payload?.message)) {
        onError(payload.message.join(', '));
        return;
      }

      onError('Не удалось отправить письмо повторно.');
      return;
    }

    onSuccess(
      payload?.email
        ? `Письмо повторно отправлено на ${payload.email}.`
        : 'Письмо отправлено повторно.',
    );
  } catch {
    onError('Не удалось отправить письмо повторно.');
  }
}
