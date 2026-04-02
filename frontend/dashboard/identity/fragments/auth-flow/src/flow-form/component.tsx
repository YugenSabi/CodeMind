import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { type AuthFlowType, type KratosFlow, type KratosUiNode } from '@lib/auth';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { ConfirmPasswordField } from '../confirm-password-field/component';
import { Field } from '../field/component';
import {
  getHiddenNodes,
  humanizeName,
  resolveAutoComplete,
  toStringValue,
} from '../helpers';
import { StatusMessage } from '../status-message/component';

type FlowFormProps = {
  flow: KratosFlow;
  flowType: AuthFlowType;
  orderedFieldNodes: KratosUiNode[];
  passwordNode?: KratosUiNode;
  submitLabel: string;
  secondaryAction?: {
    href: string;
    label: string;
  };
  confirmPassword: string;
  confirmPasswordError: string | null;
  isPasswordVisible: boolean;
  isConfirmPasswordVisible: boolean;
  isResendingVerification: boolean;
  resendVerificationLabel: string;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
  onConfirmPasswordChange: (value: string) => void;
  onResendVerification: () => void;
};

export function FlowForm({
  flow,
  flowType,
  orderedFieldNodes,
  passwordNode,
  submitLabel,
  secondaryAction,
  confirmPassword,
  confirmPasswordError,
  isPasswordVisible,
  isConfirmPasswordVisible,
  isResendingVerification,
  resendVerificationLabel,
  onSubmit,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
  onConfirmPasswordChange,
  onResendVerification,
}: FlowFormProps): ReactNode {
  const t = useTranslations('authFlow.fields');
  const flowMessages = flow.ui.messages ?? [];
  const hiddenNodes = getHiddenNodes(flow.ui.nodes);
  const submitNode = flow.ui.nodes.find(
    (node) =>
      node.attributes.node_type === 'input' &&
      node.attributes.type === 'submit',
  );

  return (
    <form action={flow.ui.action} method={flow.ui.method} onSubmit={onSubmit}>
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
              label={humanizeName(node.attributes.name, t)}
              defaultValue={toStringValue(node.attributes.value)}
              autoComplete={resolveAutoComplete(
                node.attributes.name,
                node.attributes.type,
                flowType,
              )}
              isPasswordVisible={isPasswordVisible}
              onTogglePasswordVisibility={onTogglePasswordVisibility}
            />

            {flowType === 'registration' &&
            node.attributes.name === 'password' &&
            passwordNode ? (
              <ConfirmPasswordField
                value={confirmPassword}
                error={confirmPasswordError}
                isPasswordVisible={isConfirmPasswordVisible}
                onTogglePasswordVisibility={onToggleConfirmPasswordVisibility}
                onChange={onConfirmPasswordChange}
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
          {submitLabel}
        </Button>

        {secondaryAction ? (
          <Button
            type="link"
            href={secondaryAction.href}
            variant="ghost"
            height={44}
            borderRadius={15}
            textColor="$secondaryText"
            font="$footer"
            fontSize={15}
          >
            {secondaryAction.label}
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
            onClick={onResendVerification}
          >
            {resendVerificationLabel}
          </Button>
        ) : null}
      </Box>
    </form>
  );
}
