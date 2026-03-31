import type { ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Input } from '@ui/input';
import { Text } from '@ui/text';

export function JoinRoomComponent(): ReactNode {
  return (
    <Box width="$full" minHeight="$full" alignItems="center" justifyContent="center">
      <Box
        width="$full"
        maxWidth={780}
        height={120}
        flexDirection="column"
        alignItems="center"
        gap={10}
        backgroundColor="#272D35"
        border="1px solid"
        borderColor="$border"
        borderRadius={30}
        padding={15}
      >
        <Text color="#FFFFFF" font="$rus" size={20} textAlign="center">
          Введите код комнаты:
        </Text>
        <Input
          fullWidth
          variant="outline"
          font="$rus"
          height={83}
          fontSize={24}
          textColor="#FFFFFF"
          borderColor="$border"
          bg="$mainCards"
          endIcon={<JoinArrowIcon />}
          endIconInteractive
          style={{
            borderRadius: "20px"
          }}
        />
      </Box>
    </Box>
  );
}

function JoinArrowIcon(): ReactNode {
  return (
    <Box
      width={31}
      height={31}
      alignItems="center"
      justifyContent="center"
      style={{
        pointerEvents: 'none',
      }}
    >
      <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask
          id="join-room-mask"
          style={{ maskType: 'luminance' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="31"
          height="31"
        >
          <path d="M31 0H0V31H31V0Z" fill="white" />
        </mask>
        <g mask="url(#join-room-mask)">
          <path
            d="M11.625 5.1665H24.5417V23.2498C24.5417 24.6766 23.3851 25.8331 21.9583 25.8331H11.625"
            stroke="#3B8640"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.4999 19.3748L19.3749 15.4998M19.3749 15.4998L15.4999 11.6248M19.3749 15.4998H6.45825"
            stroke="#3B8640"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </Box>
  );
}
