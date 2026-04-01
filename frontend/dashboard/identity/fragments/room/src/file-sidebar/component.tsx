import { type ReactNode, useMemo, useState } from 'react';
import type { RoomDirectory, RoomFile } from '@lib/files';
import { FolderIcon, JsonIcon } from '@ui/icons';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { FileCard } from '../file-card/component';

type FileSidebarProps = {
  rootName: string;
  files: RoomFile[];
  directories: RoomDirectory[];
  selectedFileId: string | null;
  currentUserId?: string;
  isOwner: boolean;
  isCreatingFile: boolean;
  deletingFileId: string | null;
  deletingDirectoryId: string | null;
  onCreateFile: () => void;
  onCreateDirectory: () => void;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (file: RoomFile) => void;
  onDeleteDirectory: (directory: RoomDirectory) => void;
  onMoveFile: (fileId: string, directoryId: string | null) => void;
  onMoveDirectory: (directoryId: string, parentId: string | null) => void;
};

type TreeNode = {
  directory: RoomDirectory;
  children: TreeNode[];
  files: RoomFile[];
};

type DragState =
  | {
      type: 'file';
      id: string;
    }
  | {
      type: 'directory';
      id: string;
    }
  | null;

export function FileSidebar({
  rootName,
  files,
  directories,
  selectedFileId,
  currentUserId,
  isOwner,
  isCreatingFile,
  deletingFileId,
  deletingDirectoryId,
  onCreateFile,
  onCreateDirectory,
  onSelectFile,
  onDeleteFile,
  onDeleteDirectory,
  onMoveFile,
  onMoveDirectory,
}: FileSidebarProps): ReactNode {
  const [expandedDirectoryIds, setExpandedDirectoryIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<DragState>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isRootDropActive, setIsRootDropActive] = useState(false);

  const tree = useMemo(() => buildTree(directories, files), [directories, files]);
  const rootFiles = useMemo(
    () => files.filter((file) => !file.directoryId),
    [files],
  );

  const toggleDirectory = (directoryId: string) => {
    setExpandedDirectoryIds((current) =>
      current.includes(directoryId)
        ? current.filter((id) => id !== directoryId)
        : [...current, directoryId],
    );
  };

  const handleDropToRoot = () => {
    if (!dragState) {
      return;
    }

    if (dragState.type === 'file') {
      onMoveFile(dragState.id, null);
    } else {
      onMoveDirectory(dragState.id, null);
    }

    setDragState(null);
    setDropTargetId(null);
    setIsRootDropActive(false);
  };

  const handleActivateRootDrop = () => {
    setIsRootDropActive(true);
    setDropTargetId(null);
  };

  return (
    <Box
      width={280}
      backgroundColor="#121720"
      border="1px solid"
      borderColor="rgba(255,255,255,0.06)"
      borderRadius={18}
      paddingTop={12}
      paddingRight={10}
      paddingBottom={12}
      paddingLeft={10}
      flexDirection="column"
      gap={10}
      overflow="hidden"
    >
      <Box justifyContent="space-between" alignItems="center" gap={12}>
        <Box flexDirection="column" gap={4}>
          <Text color="#D7DEE7" font="$footer" size={12} lineHeight="14px">
            EXPLORER
          </Text>
        </Box>

        <Box alignItems="center" gap={6}>
          <ActionButton
            label="+"
            icon={
              <JsonIcon
                width={14}
                height={14}
                style={{
                  width: 14,
                  height: 14,
                  display: 'block',
                  flexShrink: 0,
                  color: '#FFFFFF',
                }}
              />
            }
            onClick={onCreateFile}
            disabled={isCreatingFile}
          />
          <ActionButton
            label="+"
            icon={
              <FolderIcon
                width={14}
                height={14}
                style={{
                  width: 14,
                  height: 14,
                  display: 'block',
                  flexShrink: 0,
                  color: '#FFFFFF',
                }}
              />
            }
            onClick={onCreateDirectory}
          />
        </Box>
      </Box>

      <Box flexDirection="column" gap={2}>
        <button
          type="button"
          onDragOver={(event) => {
            event.preventDefault();
            handleActivateRootDrop();
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleDropToRoot();
          }}
          style={{
            width: '100%',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 10,
            paddingRight: 10,
            border: 'none',
            borderRadius: 10,
            background: isRootDropActive
              ? 'rgba(95, 135, 255, 0.12)'
              : 'transparent',
            color: '#D7DEE7',
            textAlign: 'left',
            boxShadow: isRootDropActive ? 'inset 2px 0 0 #5F87FF' : 'none',
          }}
        >
          <span
            style={{
              width: 14,
              color: '#AEB8C4',
              fontSize: 14,
              lineHeight: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ·
          </span>
          <Text color="#D7DEE7" font="$footer" size={13} lineHeight="16px">
            {rootName}
          </Text>
        </button>

        {tree.map((node) => (
          <DirectoryNode
            key={node.directory.id}
            node={node}
            depth={0}
            selectedFileId={selectedFileId}
            currentUserId={currentUserId}
            isOwner={isOwner}
            deletingFileId={deletingFileId}
            deletingDirectoryId={deletingDirectoryId}
            expandedDirectoryIds={expandedDirectoryIds}
            dragState={dragState}
            dropTargetId={dropTargetId}
            onToggleDirectory={toggleDirectory}
            onSelectFile={onSelectFile}
            onDeleteFile={onDeleteFile}
            onDeleteDirectory={onDeleteDirectory}
            onMoveFile={onMoveFile}
            onMoveDirectory={onMoveDirectory}
            onStartDrag={(nextDragState) => {
              setDragState(nextDragState);
              setDropTargetId(null);
              setIsRootDropActive(false);
            }}
            onEndDrag={() => {
              setDragState(null);
              setDropTargetId(null);
              setIsRootDropActive(false);
            }}
            onSetDropTarget={setDropTargetId}
          />
        ))}

        {rootFiles.map((file) => (
          <Box key={file.id} paddingLeft={10}>
            <FileCard
              file={file}
              isActive={file.id === selectedFileId}
              canDelete={isOwner || file.ownerId === currentUserId}
              isDeleting={deletingFileId === file.id}
              isDragging={dragState?.type === 'file' && dragState.id === file.id}
              onClick={() => {
                onSelectFile(file.id);
              }}
              onDelete={() => {
                onDeleteFile(file);
              }}
              onDragStart={() => {
                setDragState({ type: 'file', id: file.id });
                setDropTargetId(null);
                setIsRootDropActive(false);
              }}
              onDragEnd={() => {
                setDragState(null);
                setDropTargetId(null);
                setIsRootDropActive(false);
              }}
            />
          </Box>
        ))}
      </Box>

      {files.length === 0 && directories.length === 0 ? (
        <Box
          padding={12}
        >
          <Text color="#7D8793" font="$footer" size={12} lineHeight="18px">
            В комнате пока нет файлов и папок. Создайте первый элемент проекта, и он сразу откроется в редакторе.
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      height={28}
      minWidth={28}
      padding={8}
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      borderRadius={8}
      bg="transparent"
      textColor="#FFFFFF"
      disabled={disabled}
      onClick={onClick}
    >
      <Box alignItems="center" gap={4}>
        <Text color="#B8C1CC" font="$footer" size={12} lineHeight="14px">
          {label}
        </Text>
        {icon}
      </Box>
    </Button>
  );
}

function DirectoryNode({
  node,
  depth,
  selectedFileId,
  currentUserId,
  isOwner,
  deletingFileId,
  deletingDirectoryId,
  expandedDirectoryIds,
  dragState,
  dropTargetId,
  onToggleDirectory,
  onSelectFile,
  onDeleteFile,
  onDeleteDirectory,
  onMoveFile,
  onMoveDirectory,
  onStartDrag,
  onEndDrag,
  onSetDropTarget,
}: {
  node: TreeNode;
  depth: number;
  selectedFileId: string | null;
  currentUserId?: string;
  isOwner: boolean;
  deletingFileId: string | null;
  deletingDirectoryId: string | null;
  expandedDirectoryIds: string[];
  dragState: DragState;
  dropTargetId: string | null;
  onToggleDirectory: (directoryId: string) => void;
  onSelectFile: (fileId: string) => void;
  onDeleteFile: (file: RoomFile) => void;
  onDeleteDirectory: (directory: RoomDirectory) => void;
  onMoveFile: (fileId: string, directoryId: string | null) => void;
  onMoveDirectory: (directoryId: string, parentId: string | null) => void;
  onStartDrag: (state: DragState) => void;
  onEndDrag: () => void;
  onSetDropTarget: (directoryId: string | null) => void;
}) {
  const isExpanded = expandedDirectoryIds.includes(node.directory.id);
  const isDropActive = dropTargetId === node.directory.id;
  const hasChildren = node.children.length > 0 || node.files.length > 0;

  return (
    <Box width="$full" flexDirection="column">
      <Box width="$full" alignItems="center" gap={6} style={{ paddingRight: 4 }}>
        <button
          type="button"
          draggable
          onClick={() => {
            onToggleDirectory(node.directory.id);
          }}
          onDragStart={() => {
            onStartDrag({ type: 'directory', id: node.directory.id });
          }}
          onDragEnd={onEndDrag}
          onDragOver={(event) => {
            event.preventDefault();
            onSetDropTarget(node.directory.id);
          }}
          onDrop={(event) => {
            event.preventDefault();

            if (!dragState) {
              return;
            }

            if (dragState.type === 'file') {
              onMoveFile(dragState.id, node.directory.id);
            } else {
              onMoveDirectory(dragState.id, node.directory.id);
            }

            onEndDrag();
          }}
          style={{
            width: '100%',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 10 + depth * 14,
            paddingRight: 10,
            border: 'none',
            borderRadius: 10,
            background:
              isDropActive ? 'rgba(95, 135, 255, 0.12)' : 'transparent',
            color: '#D7DEE7',
            cursor: 'pointer',
            textAlign: 'left',
            opacity:
              dragState?.type === 'directory' && dragState.id === node.directory.id
                ? 0.48
                : 1,
            boxShadow: isDropActive ? 'inset 2px 0 0 #5F87FF' : 'none',
          }}
        >
          <span
            style={{
              width: 14,
              color: '#AEB8C4',
              fontSize: 14,
              lineHeight: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {hasChildren ? (isExpanded ? '▾' : '▸') : ''}
          </span>
          <FolderIcon
            width={16}
            height={16}
            style={{
              width: 16,
              height: 16,
              display: 'block',
              flexShrink: 0,
              color: '#FFFFFF',
            }}
          />
          <span
            style={{
              fontSize: 13,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {node.directory.name}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            onDeleteDirectory(node.directory);
          }}
          style={{
            width: 18,
            height: 18,
            border: 'none',
            borderRadius: 6,
            background: 'transparent',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            opacity: deletingDirectoryId === node.directory.id ? 0.7 : 1,
          }}
        >
          {deletingDirectoryId === node.directory.id ? '...' : '×'}
        </button>
      </Box>

      {isExpanded ? (
        <Box flexDirection="column">
          {node.children.map((child) => (
            <DirectoryNode
              key={child.directory.id}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              currentUserId={currentUserId}
              isOwner={isOwner}
              deletingFileId={deletingFileId}
              deletingDirectoryId={deletingDirectoryId}
              expandedDirectoryIds={expandedDirectoryIds}
              dragState={dragState}
              dropTargetId={dropTargetId}
              onToggleDirectory={onToggleDirectory}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onDeleteDirectory={onDeleteDirectory}
              onMoveFile={onMoveFile}
              onMoveDirectory={onMoveDirectory}
              onStartDrag={onStartDrag}
              onEndDrag={onEndDrag}
              onSetDropTarget={onSetDropTarget}
            />
          ))}

          {node.files.map((file) => (
            <Box key={file.id} paddingLeft={14 + depth * 14}>
              <FileCard
                file={file}
                isActive={file.id === selectedFileId}
                canDelete={isOwner || file.ownerId === currentUserId}
                isDeleting={deletingFileId === file.id}
                isDragging={dragState?.type === 'file' && dragState.id === file.id}
                onClick={() => {
                  onSelectFile(file.id);
                }}
                onDelete={() => {
                  onDeleteFile(file);
                }}
                onDragStart={() => {
                  onStartDrag({ type: 'file', id: file.id });
                }}
                onDragEnd={onEndDrag}
              />
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function buildTree(directories: RoomDirectory[], files: RoomFile[]) {
  const byParentId = new Map<string | null, RoomDirectory[]>();
  const filesByDirectoryId = new Map<string | null, RoomFile[]>();

  for (const directory of directories) {
    const parentDirectories = byParentId.get(directory.parentId) ?? [];
    parentDirectories.push(directory);
    byParentId.set(directory.parentId, parentDirectories);
  }

  for (const file of files) {
    const directoryFiles = filesByDirectoryId.get(file.directoryId) ?? [];
    directoryFiles.push(file);
    filesByDirectoryId.set(file.directoryId, directoryFiles);
  }

  const buildBranch = (parentId: string | null): TreeNode[] =>
    (byParentId.get(parentId) ?? [])
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((directory) => ({
        directory,
        children: buildBranch(directory.id),
        files: [...(filesByDirectoryId.get(directory.id) ?? [])].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      }));

  return buildBranch(null);
}
