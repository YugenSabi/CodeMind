export const fieldStyles = {
  width: '100%',
  height: 46,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#0F141C',
  color: '#FFFFFF',
  padding: '0 14px',
  outline: 'none',
  fontSize: '14px',
  lineHeight: '18px',
} as const;

export function getProfileName(
  profile: {
    firstName: string | null;
    lastName: string | null;
  },
  fallbackName: string,
) {
  const fullName = [profile.firstName, profile.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();

  return fullName || fallbackName;
}

export function formatProfileDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('File reading failed'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('File reading failed'));
    };

    reader.readAsDataURL(file);
  });
}
