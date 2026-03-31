'use client';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import { type Extension, EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import type { RoomFile } from '@lib/files';
import type { RoomSocket } from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

const DEFAULT_COLLAB_URL = 'ws://localhost:1234';

type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type CollaborativeEditorProps = {
  file: RoomFile;
  user: SessionUser | null;
  roomId: string;
  socket: RoomSocket | null;
};

type PresenceUser = {
  name: string;
  color: string;
};

export function CollaborativeEditor({
  file,
  user,
  roomId,
  socket,
}: CollaborativeEditorProps): ReactNode {
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [value, setValue] = useState('');
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<
    'idle' | 'running' | 'stopped'
  >('idle');
  const [toolError, setToolError] = useState<string | null>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const terminalRootRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const textRef = useRef<Y.Text | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const collabUrl = useMemo(() => {
    const rawUrl =
      process.env.NEXT_PUBLIC_COLLAB_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^http/, 'ws') ??
      DEFAULT_COLLAB_URL;

    return rawUrl.replace(/^http/, 'ws');
  }, []);

  useEffect(() => {
    if (!editorRootRef.current) {
      return;
    }

    const document = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: collabUrl,
      name: file.documentName,
      document,
      onStatus: ({ status: nextStatus }) => {
        if (nextStatus === 'connecting') {
          setStatus('connecting');
          return;
        }

        if (nextStatus === 'connected') {
          setStatus('connected');
          return;
        }

        setStatus('disconnected');
      },
      onAuthenticationFailed: () => {
        setStatus('error');
      },
    });

    const text = document.getText('content');
    const userColor = getUserColor(user?.id ?? file.id);
    const userLabel = getUserLabel(user);

    textRef.current = text;

    provider.awareness?.setLocalStateField('user', {
      name: userLabel,
      color: userColor,
    });

    const syncPresence = () => {
      const nextPresence = Array.from(
        provider.awareness?.getStates().values() ?? [],
      )
        .map((state) => state.user as PresenceUser | undefined)
        .filter((item): item is PresenceUser => Boolean(item));

      setPresence(nextPresence);
    };

    const view = new EditorView({
      state: EditorState.create({
        doc: text.toString(),
        extensions: getEditorExtensions({
          fileLanguage: file.language,
          yText: text,
          awareness: provider.awareness,
          onValueChange: setValue,
        }),
      }),
      parent: editorRootRef.current,
    });

    editorViewRef.current = view;
    setValue(view.state.doc.toString());
    syncPresence();
    provider.awareness?.on('change', syncPresence);

    return () => {
      provider.awareness?.off('change', syncPresence);
      view.destroy();
      provider.destroy();
      document.destroy();
      editorViewRef.current = null;
      textRef.current = null;
    };
  }, [collabUrl, file.documentName, file.id, file.language, user]);

  useEffect(() => {
    if (!terminalRootRef.current) {
      return;
    }

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      theme: {
        background: '#0B0F14',
        foreground: '#D7DEE7',
      },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRootRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();

      if (socket && roomId) {
        socket.emit('terminal:resize', {
          roomId,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRootRef.current);

    const disposable = terminal.onData((data) => {
      if (socket && roomId && terminalStatus === 'running') {
        socket.emit('terminal:input', {
          roomId,
          input: data,
        });
      }
    });

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [roomId, socket, terminalStatus]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleData = (payload: { roomId?: string; chunk?: string }) => {
      if (payload.roomId !== roomId || !payload.chunk) {
        return;
      }

      terminalRef.current?.write(payload.chunk);
    };

    const handleStarted = (payload: { roomId?: string }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setTerminalStatus('running');
      setIsRunning(false);
      terminalRef.current?.focus();
    };

    const handleStopped = (payload: { roomId?: string }) => {
      if (payload.roomId !== roomId) {
        return;
      }

      setTerminalStatus('stopped');
      setIsRunning(false);
      terminalRef.current?.writeln('\r\n[terminal stopped]');
    };

    socket.on('terminal:data', handleData);
    socket.on('terminal:started', handleStarted);
    socket.on('terminal:stopped', handleStopped);

    return () => {
      socket.off('terminal:data', handleData);
      socket.off('terminal:started', handleStarted);
      socket.off('terminal:stopped', handleStopped);
    };
  }, [roomId, socket]);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setTerminalStatus('running');
      setToolError(null);
      terminalRef.current?.clear();

      socket?.emit('terminal:start', {
        roomId,
        fileId: file.id,
        content: getEditorContent(editorViewRef.current, value),
        cols: terminalRef.current?.cols ?? 120,
        rows: terminalRef.current?.rows ?? 32,
      });
    } catch (error) {
      setTerminalStatus('idle');
      setToolError(
        error instanceof Error ? error.message : 'Не удалось выполнить код.',
      );
    } finally {
      if (!socket) {
        setIsRunning(false);
      }
    }
  };

  const handleStop = () => {
    if (!socket) {
      return;
    }

    socket.emit('terminal:stop', { roomId });
    setTerminalStatus('stopped');
    setIsRunning(false);
  };

  return (
    <Box width="$full" height="$full" flexDirection="column" gap={14}>
      <Box justifyContent="space-between" alignItems="center" gap={12}>
        <Box flexDirection="column" gap={4}>
          <Text color="#FFFFFF" font="$rus" size={20} lineHeight="24px">
            {file.name}
          </Text>
          <Text color="$secondaryText" font="$footer" size={13} lineHeight="18px">
            {file.language} · {file.documentName}
          </Text>
        </Box>

        <Box alignItems="center" gap={8} flexWrap="wrap">
          <Button
            type="button"
            variant="filled"
            height={40}
            padding={14}
            borderRadius={14}
            bg="#43953D"
            textColor="#FFFFFF"
            disabled={isRunning}
            onClick={() => {
              void handleRun();
            }}
          >
            <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
              {isRunning ? 'Running...' : 'Run'}
            </Text>
          </Button>

          <Button
            type="button"
            variant="ghost"
            height={40}
            padding={14}
            border="1px solid"
            borderColor="$border"
            borderRadius={14}
            textColor="#FFFFFF"
            disabled={!socket || terminalStatus !== 'running'}
            onClick={handleStop}
          >
            <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
              Stop
            </Text>
          </Button>

          {presence.map((participant) => (
            <Box
              key={`${participant.name}-${participant.color}`}
              backgroundColor="rgba(255,255,255,0.06)"
              border="1px solid"
              borderColor="$border"
              borderRadius={14}
              paddingTop={8}
              paddingRight={10}
              paddingBottom={8}
              paddingLeft={10}
              alignItems="center"
              gap={8}
            >
              <Box
                width={10}
                height={10}
                borderRadius={999}
                style={{ backgroundColor: participant.color }}
              />
              <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
                {participant.name}
              </Text>
            </Box>
          ))}

          <StatusChip status={status} />
        </Box>
      </Box>

      <Box
        width="$full"
        minHeight={420}
        backgroundColor="#10151C"
        border="1px solid"
        borderColor="$border"
        borderRadius={24}
        padding={0}
        overflow="hidden"
      >
        <div
          ref={editorRootRef}
          style={{
            width: '100%',
            minHeight: 420,
            height: '100%',
          }}
        />
      </Box>

      {toolError ? (
        <Box
          width="$full"
          backgroundColor="rgba(209, 67, 67, 0.12)"
          border="1px solid"
          borderColor="#D14343"
          borderRadius={18}
          paddingTop={12}
          paddingRight={14}
          paddingBottom={12}
          paddingLeft={14}
        >
          <Text color="#FFB4B4" font="$footer" size={13} lineHeight="18px">
            {toolError}
          </Text>
        </Box>
      ) : null}

      <TerminalPanel
        terminalRootRef={terminalRootRef}
        status={terminalStatus}
      />
    </Box>
  );
}

function TerminalPanel({
  terminalRootRef,
  status,
}: {
  terminalRootRef: { current: HTMLDivElement | null };
  status: 'idle' | 'running' | 'stopped';
}) {
  return (
    <Box
      width="$full"
      minHeight={180}
      backgroundColor="#0B0F14"
      border="1px solid"
      borderColor="$border"
      borderRadius={24}
      padding={16}
      flexDirection="column"
      gap={10}
    >
      <Box justifyContent="space-between" alignItems="center">
        <Text color="#FFFFFF" font="$rus" size={18} lineHeight="22px">
          Terminal
        </Text>
        <Text color="$secondaryText" font="$footer" size={12} lineHeight="16px">
          {status === 'running'
            ? 'running'
            : status === 'stopped'
              ? 'stopped'
              : 'idle'}
        </Text>
      </Box>

      <div
        ref={terminalRootRef}
        style={{
          minHeight: 220,
          width: '100%',
        }}
      />
    </Box>
  );
}

function StatusChip({
  status,
}: {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}) {
  const labelByStatus = {
    connecting: 'Подключение к редактору...',
    connected: 'Редактор подключен',
    disconnected: 'Редактор отключен',
    error: 'Ошибка auth/editor',
  } as const;

  return (
    <Box
      backgroundColor="rgba(145, 152, 161, 0.08)"
      border="1px solid"
      borderColor="$border"
      borderRadius={16}
      paddingTop={10}
      paddingRight={14}
      paddingBottom={10}
      paddingLeft={14}
    >
      <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
        {labelByStatus[status]}
      </Text>
    </Box>
  );
}

function getUserLabel(user: SessionUser | null) {
  if (!user) {
    return 'Guest';
  }

  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();

  return fullName || user.email;
}

function getUserColor(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

function replaceDocumentContent(
  nextValue: string,
  text: Y.Text | null,
  setValue: (value: string) => void,
) {
  if (!text) {
    setValue(nextValue);
    return;
  }

  text.doc?.transact(() => {
    text.delete(0, text.length);
    text.insert(0, nextValue);
  }, 'local-format');
}

function getEditorExtensions({
  fileLanguage,
  yText,
  awareness,
  onValueChange,
}: {
  fileLanguage: RoomFile['language'];
  yText: Y.Text;
  awareness: HocuspocusProvider['awareness'];
  onValueChange: (value: string) => void;
}): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    highlightActiveLine(),
    EditorView.lineWrapping,
    oneDark,
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '15px',
      },
      '.cm-scroller': {
        fontFamily:
          'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace',
        minHeight: '420px',
      },
      '.cm-gutters': {
        backgroundColor: '#10151C',
        color: '#6D7782',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255,255,255,0.04)',
      },
      '.cm-content': {
        padding: '16px 0',
      },
      '.cm-line': {
        padding: '0 16px',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#F5F7FA',
      },
      '.cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'rgba(88, 166, 255, 0.28)',
      },
    }),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),
    getLanguageExtension(fileLanguage),
    yCollab(yText, awareness),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onValueChange(update.state.doc.toString());
      }
    }),
  ];
}

function getLanguageExtension(language: RoomFile['language']) {
  switch (language) {
    case 'JAVASCRIPT':
      return javascript();
    case 'TYPESCRIPT':
      return javascript({ typescript: true });
    case 'PYTHON':
      return python();
    case 'JSON':
      return json();
    case 'HTML':
      return html();
    case 'CSS':
      return css();
    case 'MARKDOWN':
      return markdown();
    default:
      return [];
  }
}

function getEditorContent(editorView: EditorView | null, fallback: string) {
  return editorView?.state.doc.toString() ?? fallback;
}
