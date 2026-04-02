import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { CreateFileModal } from '../create-file-modal/component';

type CreateItemModalProps = {
  isOpen: boolean;
  itemType: 'file' | 'directory';
  fileName: string;
  fileExtension: string;
  language: RoomFile['language'];
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onLanguageChange: (value: RoomFile['language']) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CreateItemModal({
  isOpen,
  itemType,
  fileName,
  fileExtension,
  language,
  isLoading,
  onNameChange,
  onLanguageChange,
  onCancel,
  onConfirm,
}: CreateItemModalProps): ReactNode {
  if (!isOpen) {
    return null;
  }

  return (
    <CreateFileModal
      itemType={itemType}
      fileName={fileName}
      fileExtension={fileExtension}
      language={language}
      isLoading={isLoading}
      onNameChange={onNameChange}
      onLanguageChange={onLanguageChange}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
