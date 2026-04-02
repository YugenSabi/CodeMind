import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { fieldStyles } from '../helpers';

type ProfileFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function ProfileField({
  label,
  value,
  onChange,
  placeholder,
}: ProfileFieldProps): ReactNode {
  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#D7DEE7" font="$footer" size={12} lineHeight="16px">
        {label}
      </Text>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        style={fieldStyles}
      />
    </Box>
  );
}
