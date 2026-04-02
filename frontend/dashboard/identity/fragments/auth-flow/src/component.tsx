'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthSession } from '@lib/auth';
import { Button } from '@ui/button';
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
import { FlowForm } from './flow-form/component';
import { orderRegistrationNodes, toStringValue } from './helpers';
import { StatusMessage } from './status-message/component';

type AuthFlowComponentProps = {
  flowType: AuthFlowType;
};

export function AuthFlowComponent({
  flowType,
}: AuthFlowComponentProps): ReactNode {
  const t = useTranslations('authFlow');
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
            error instanceof Error ? error.message : t('loadFailed'),
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
  }, [flowType, searchParams, t]);

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
      setConfirmPasswordError(t('repeatPasswordRequired'));
      return;
    }

    if (currentPassword !== confirmPassword) {
      event.preventDefault();
      setConfirmPasswordError(t('passwordMismatch'));
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

        {isLoading ? <StatusMessage text={t('loading')} tone="muted" /> : null}
        {!isLoading && errorMessage ? (
          <StatusMessage text={errorMessage} tone="error" />
        ) : null}
        {!isLoading && isVerifiedRedirect ? (
          <StatusMessage text={t('verifiedInfo')} tone="muted" />
        ) : null}
        {!isLoading && verificationInfo ? (
          <StatusMessage text={verificationInfo} tone="muted" />
        ) : null}

        {!isLoading && flow ? (
          <FlowForm
            flow={flow}
            flowType={flowType}
            orderedFieldNodes={orderedFieldNodes}
            passwordNode={passwordNode}
            submitLabel={copy.submitLabel}
            secondaryAction={copy.secondaryAction}
            confirmPassword={confirmPassword}
            confirmPasswordError={confirmPasswordError}
            isPasswordVisible={isPasswordVisible}
            isConfirmPasswordVisible={isConfirmPasswordVisible}
            isResendingVerification={isResendingVerification}
            resendVerificationLabel={
              isResendingVerification
                ? t('resending')
                : user?.email
                  ? t('resendLabelWithEmail', { email: user.email })
                  : t('resendLabel')
            }
            onSubmit={handleSubmit}
            onTogglePasswordVisibility={() => {
              setIsPasswordVisible((current) => !current);
            }}
            onToggleConfirmPasswordVisibility={() => {
              setIsConfirmPasswordVisible((current) => !current);
            }}
            onConfirmPasswordChange={(value) => {
              setConfirmPassword(value);
              if (confirmPasswordError) {
                setConfirmPasswordError(null);
              }
            }}
            onResendVerification={() => {
              void handleResendVerificationCode({
                backendUrl:
                  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000',
                t,
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
          />
        ) : null}

        {flowType === 'verification' || flowType === 'recovery' ? (
          <Text
            color="$secondaryText"
            font="$footer"
            size={13}
            lineHeight="18px"
            textAlign="center"
          >
            {t('checkEmail')}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

async function handleResendVerificationCode({
  backendUrl,
  t,
  onStart,
  onSuccess,
  onError,
}: {
  backendUrl: string;
  t: (key: string, values?: Record<string, string>) => string;
  onStart: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
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

      onError(t('resendFailed'));
      return;
    }

    onSuccess(
      payload?.email
        ? t('resendSuccessWithEmail', { email: payload.email })
        : t('resendSuccess'),
    );
  } catch {
    onError(t('resendFailed'));
  }
}
