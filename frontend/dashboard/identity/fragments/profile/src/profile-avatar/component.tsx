import { type ReactNode, useMemo } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size: number;
};

export function ProfileAvatar({
  name,
  avatarUrl,
  size,
}: ProfileAvatarProps): ReactNode {
  const initials = useMemo(() => {
    const compact = name.trim();
    return compact.charAt(0).toUpperCase() || 'U';
  }, [name]);

  return (
    <Box
      width={size}
      height={size}
      borderRadius={28}
      backgroundColor="#141922"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Text color="#FFFFFF" font="$rus" size={44} lineHeight="48px">
          {initials}
        </Text>
      )}
    </Box>
  );
}
