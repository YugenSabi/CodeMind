import { type ReactNode } from 'react';
import { Input } from '@ui/input';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import type { AuthFlowType, KratosUiNode } from '@lib/auth';
import { PasswordVisibilityButton } from '../password-visibility-button/component';

type FieldProps = {
  node: KratosUiNode;
  flowType: AuthFlowType;
  label: string;
  defaultValue: string;
  autoComplete?: string;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
};

export function Field({
  node,
  flowType,
  label,
  defaultValue,
  autoComplete,
  isPasswordVisible,
  onTogglePasswordVisibility,
}: FieldProps): ReactNode {
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
        defaultValue={defaultValue}
        required={node.attributes.required}
        disabled={node.attributes.disabled}
        autoComplete={autoComplete}
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
