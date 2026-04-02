import { type ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type MetricCardProps = {
  label: string;
  value: string;
};

export function MetricCard({ label, value }: MetricCardProps): ReactNode {
  return (
    <Box
      flexDirection="column"
      gap={6}
      padding={14}
      backgroundColor="#141922"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={16}
    >
      <Text color="#7D8793" font="$footer" size={12} lineHeight="16px">
        {label}
      </Text>
      <Text color="#FFFFFF" font="$footer" size={18} lineHeight="22px">
        {value}
      </Text>
    </Box>
  );
}
