export function parseFileDocumentName(documentName: string) {
  const normalized = documentName.trim();

  if (!normalized) {
    throw new Error('Document name is required');
  }

  if (!normalized.startsWith('file:')) {
    throw new Error(
      'Unsupported document name. Expected format "file:<fileId>"',
    );
  }

  const fileId = normalized.slice('file:'.length).trim();

  if (!fileId) {
    throw new Error('File document name must include a file id');
  }

  return {
    fileId,
    normalizedDocumentName: `file:${fileId}`,
  };
}
