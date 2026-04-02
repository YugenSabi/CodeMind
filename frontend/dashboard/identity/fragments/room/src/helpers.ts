import type { RoomFile } from '@lib/files';

export function getParticipantName(participant: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const fullName = [participant.firstName, participant.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || participant.email;
}

export function buildNextFileBaseName(files: RoomFile[]) {
  const nextIndex = files.length + 1;
  return `main-${nextIndex}`;
}

export function buildNextDirectoryBaseName(directories: Array<{ name: string }>) {
  const nextIndex = directories.length + 1;
  return `folder-${nextIndex}`;
}

export function getFileExtension(language: RoomFile['language']) {
  switch (language) {
    case 'TYPESCRIPT':
      return '.ts';
    case 'JAVASCRIPT':
      return '.js';
    case 'PYTHON':
      return '.py';
    case 'JSON':
      return '.json';
    case 'HTML':
      return '.html';
    case 'CSS':
      return '.css';
    case 'MARKDOWN':
      return '.md';
    default:
      return '.txt';
  }
}
