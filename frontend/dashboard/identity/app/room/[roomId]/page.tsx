import type { ReactNode } from 'react';
import { RoomComponent } from '@fragments/room';

type RoomPageProps = {
  params: {
    roomId: string;
  };
};

export default function RoomPage({ params }: RoomPageProps): ReactNode {
  return <RoomComponent roomId={params.roomId} />;
}
