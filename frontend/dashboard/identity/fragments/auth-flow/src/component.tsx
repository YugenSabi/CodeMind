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
  const submitNode = flow
    ? flow.ui.nodes.find(
        (node) =>
          node.attributes.node_type === 'input' &&
          node.attributes.type === 'submit',
      )
    : null;
  const flowMessages = flow?.ui.messages ?? [];

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

        {isLoading ? (
          <StatusMessage text="Загрузка формы..." tone="muted" />
        ) : null}
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
          <form action={flow.ui.action} method={flow.ui.method}>
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

              {fieldNodes.map((node) => (
                <Field key={node.attributes.name} node={node} flowType={flowType} />
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
}: {
  node: KratosUiNode;
  flowType: AuthFlowType;
}): ReactNode {
  const label = node.meta.label?.text ?? humanizeName(node.attributes.name);
  const inputType = node.attributes.type === 'password' ? 'password' : 'text';
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
        autoComplete={resolveAutoComplete(node.attributes.name, inputType, flowType)}
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

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function humanizeName(name: string) {
  switch (name) {
    case 'traits.email':
      return 'Email';
    case 'traits.first_name':
      return 'Имя';
    case 'traits.last_name':
      return 'Фамилия';
    case 'identifier':
      return 'Email';
    case 'password':
      return 'Пароль';
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
