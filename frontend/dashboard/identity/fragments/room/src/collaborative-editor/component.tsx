'use client';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Y from 'yjs';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  assistRoomAi,
  generateAlgorithmTask,
  getCurrentAlgorithmTask,
  getRoomAiCapabilities,
  getRoomAiHistory,
  reviewCurrentAlgorithmSolution,
} from '@lib/rooms';
import { Box } from '@ui/layout';
import { EditorHeader } from '../editor-header/component';
import { ErrorBanner } from './error-banner/component';
import {
  applyAiResponseToEditor,
  getEditorContent,
  getEditorExtensions,
  getUserColor,
  getUserLabel,
  normalizeAiCodeResponse,
} from './editor-utils';
import type { AlgorithmReview, CollaborativeEditorProps } from './types';
import { Workspace } from './workspace/component';

const DEFAULT_COLLAB_URL = 'ws://localhost:1234';

export function CollaborativeEditor({
  room,
  file,
  user,
  roomId,
  socket,
}: CollaborativeEditorProps): ReactNode {
  const t = useTranslations('room.editor');
  const [status, setStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [value, setValue] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<
    'idle' | 'running' | 'stopped'
  >('idle');
  const [toolError, setToolError] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState<
    | 'CURSOR_COMPLETE'
    | 'SELECTION_EXPLAIN'
    | 'SELECTION_REVIEW'
    | 'SELECTION_IMPROVE'
    | 'GENERATE_FROM_INSTRUCTION'
  >('SELECTION_REVIEW');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([] as Awaited<
    ReturnType<typeof getRoomAiHistory>
  >);
  const [canUseAi, setCanUseAi] = useState(room.mode !== 'INTERVIEWS');
  const [algorithmTask, setAlgorithmTask] = useState(room.activeAlgorithmTask);
  const [algorithmDifficulty, setAlgorithmDifficulty] = useState<
    'EASY' | 'MEDIUM' | 'HARD'
  >('MEDIUM');
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [isReviewingTask, setIsReviewingTask] = useState(false);
  const [algorithmReview, setAlgorithmReview] = useState<AlgorithmReview>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const terminalRootRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastAiEditRef = useRef<{
    from: number;
    to: number;
    previousText: string;
  } | null>(null);

  const collabUrl = useMemo(() => {
    const rawUrl =
      process.env.NEXT_PUBLIC_COLLAB_URL ??
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^http/, 'ws') ??
      DEFAULT_COLLAB_URL;

    return rawUrl.replace(/^http/, 'ws');
  }, []);

  useEffect(() => {
    setAlgorithmTask(room.activeAlgorithmTask);
  }, [room.activeAlgorithmTask]);

  useEffect(() => {
    let cancelled = false;

    async function loadAiState() {
      if (room.mode === 'INTERVIEWS') {
        setCanUseAi(false);
        setAiHistory([]);
        return;
      }

      try {
        const [capabilities, history] = await Promise.all([
          getRoomAiCapabilities(roomId),
          getRoomAiHistory(roomId),
        ]);

        if (!cancelled) {
          setCanUseAi(capabilities.aiEnabled);
          setAiHistory(history);
        }
      } catch (error) {
        if (!cancelled) {
          setAiError(
            error instanceof Error ? error.message : t('loadAiToolsFailed'),
          );
        }
      }
    }

    void loadAiState();

    return () => {
      cancelled = true;
    };
  }, [room.mode, roomId, t]);

  useEffect(() => {
    if (room.mode !== 'ALGORITHMS') {
      return;
    }

    let cancelled = false;

    async function loadTask() {
      try {
        const task = await getCurrentAlgorithmTask(roomId);

        if (!cancelled) {
          setAlgorithmTask(task);
        }
      } catch (error) {
        if (!cancelled) {
          setAiError(
            error instanceof Error ? error.message : t('loadAlgorithmTaskFailed'),
          );
        }
      }
    }

    void loadTask();

    return () => {
      cancelled = true;
    };
  }, [room.mode, roomId, t]);

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

    provider.awareness?.setLocalStateField('user', {
      name: getUserLabel(user),
      color: getUserColor(user?.id ?? file.id),
    });

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

    return () => {
      view.destroy();
      provider.destroy();
      document.destroy();
      editorViewRef.current = null;
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

      if (socket && roomId && terminalStatus === 'running') {
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
        error instanceof Error ? error.message : t('runCodeFailed'),
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

  const handleAskAi = async () => {
    const editorView = editorViewRef.current;

    if (!editorView) {
      return;
    }

    const currentCode = getEditorContent(editorView, value);
    const selection = editorView.state.selection.main;
    const selectedCode = selection.empty
      ? undefined
      : currentCode.slice(selection.from, selection.to);

    if (!aiPrompt.trim()) {
      setAiError(t('aiPromptRequired'));
      return;
    }

    try {
      setIsAiLoading(true);
      setAiError(null);
      setAlgorithmReview(null);

      const response = await assistRoomAi(roomId, {
        action: aiAction,
        instruction: aiPrompt.trim(),
        language: file.language,
        currentCode,
        fileId: file.id,
        selectedCode,
        cursorPrefix: currentCode.slice(
          Math.max(0, selection.from - 800),
          selection.from,
        ),
        cursorSuffix: currentCode.slice(
          selection.to,
          Math.min(currentCode.length, selection.to + 800),
        ),
      });

      const normalizedResponse = normalizeAiCodeResponse(response.response);
      const shouldApplyCode =
        aiAction === 'CURSOR_COMPLETE' ||
        aiAction === 'SELECTION_IMPROVE' ||
        aiAction === 'GENERATE_FROM_INSTRUCTION';

      if (shouldApplyCode) {
        lastAiEditRef.current = applyAiResponseToEditor(
          editorView,
          aiAction,
          normalizedResponse,
        );
        setAiResponse(t('codeInserted'));
      } else {
        setAiResponse(response.response);
      }

      setAiHistory((current) => [
        {
          id: response.id,
          roomId,
          fileId: file.id,
          kind: response.kind,
          prompt: aiPrompt.trim(),
          response: shouldApplyCode ? normalizedResponse : response.response,
          metadata: null,
          actor: user
            ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
          createdAt: response.createdAt,
        },
        ...current,
      ]);
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : t('aiResponseFailed'),
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatAlgorithmTaskForEditor = (
    task: NonNullable<typeof algorithmTask>,
  ) => {
    const examples = task.examples?.length
      ? [
          'Примеры:',
          ...task.examples.map((example, index) =>
            [
              `${index + 1}. Вход:`,
              example.input,
              'Выход:',
              example.output,
              example.explanation ? `Пояснение: ${example.explanation}` : null,
            ]
              .filter(Boolean)
              .join('\n'),
          ),
        ].join('\n\n')
      : null;
    const hints = task.hints?.length
      ? ['Подсказки:', ...task.hints.map((hint) => `- ${hint}`)].join('\n')
      : null;
    const sections = [
      `Задача: ${task.title}`,
      '',
      task.problemStatement,
      task.inputFormat ? `Формат ввода:\n${task.inputFormat}` : null,
      task.outputFormat ? `Формат вывода:\n${task.outputFormat}` : null,
      task.constraints ? `Ограничения:\n${task.constraints}` : null,
      examples,
      hints,
      task.evaluationCriteria
        ? `Критерии проверки:\n${task.evaluationCriteria}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');
    const commentBlock = `/*\n${sections
      .split('\n')
      .map((line) => (line.length > 0 ? ` * ${line}` : ' *'))
      .join('\n')}\n */`;
    const starterCode = task.starterCode?.trim() ?? '';

    return `${commentBlock}\n\n${starterCode}`;
  };

  const extractAlgorithmSolution = (content: string) => {
    const match = content.match(/^\s*\/\*[\s\S]*?\*\/\s*/);

    if (!match) {
      return content;
    }

    return content.slice(match[0].length).trim();
  };

  const handleGenerateTask = async () => {
    try {
      setIsGeneratingTask(true);
      setAiError(null);
      setAlgorithmReview(null);

      const nextTask = await generateAlgorithmTask(roomId, {
        difficulty: algorithmDifficulty,
        preferredLanguage: file.language,
      });

      const formattedTask = formatAlgorithmTaskForEditor(nextTask);
      const editorView = editorViewRef.current;

      if (editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: formattedTask,
          },
          selection: {
            anchor: formattedTask.length,
            head: formattedTask.length,
          },
        });
        editorView.focus();
      }

      setAlgorithmTask(nextTask);
      setAiResponse(
        t('taskGenerated', {
          title: nextTask.title,
        }),
      );
      setAiHistory((current) => [
        {
          id: nextTask.id,
          roomId,
          fileId: file.id,
          kind: 'ALGORITHM_TASK_GENERATED',
          prompt: t('taskPromptWithoutTopic', {
            difficulty: algorithmDifficulty,
          }),
          response: nextTask.problemStatement,
          metadata: null,
          actor: user
            ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
          createdAt: nextTask.createdAt,
        },
        ...current,
      ]);
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : t('generateTaskFailed'),
      );
    } finally {
      setIsGeneratingTask(false);
    }
  };

  const handleReviewTaskSolution = async () => {
    try {
      setIsReviewingTask(true);
      setAiError(null);

      const result = await reviewCurrentAlgorithmSolution(roomId, {
        fileId: file.id,
        solutionCode: extractAlgorithmSolution(
          getEditorContent(editorViewRef.current, value),
        ),
        language: file.language,
      });

      setAlgorithmReview(result.review);
      setAiResponse(result.review.summary);
      setAiHistory((current) => [
        {
          id: result.id,
          roomId,
          fileId: file.id,
          kind: 'ALGORITHM_SOLUTION_REVIEWED',
          prompt: t('reviewPrompt', { title: result.task.title }),
          response: result.review.summary,
          metadata: null,
          actor: user
            ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
          createdAt: result.createdAt,
        },
        ...current,
      ]);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : t('reviewFailed'));
    } finally {
      setIsReviewingTask(false);
    }
  };

  const handleRejectAiInsert = () => {
    const editorView = editorViewRef.current;
    const lastAiEdit = lastAiEditRef.current;

    if (!editorView || !lastAiEdit) {
      return;
    }

    editorView.dispatch({
      changes: {
        from: lastAiEdit.from,
        to: lastAiEdit.to,
        insert: lastAiEdit.previousText,
      },
      selection: {
        anchor: lastAiEdit.from,
        head: lastAiEdit.from + lastAiEdit.previousText.length,
      },
    });

    editorView.focus();
    lastAiEditRef.current = null;
    setAiResponse(t('lastInsertRejected'));
  };

  return (
    <Box
      width="$full"
      height="100%"
      minWidth={0}
      minHeight={0}
      flexDirection="column"
      gap={10}
      overflow="hidden"
    >
      <EditorHeader
        file={file}
        isRunning={isRunning}
        canStop={Boolean(socket) && terminalStatus === 'running'}
        onRun={() => {
          void handleRun();
        }}
        onStop={handleStop}
      />

      <Workspace
        editorRootRef={editorRootRef}
        terminalRootRef={terminalRootRef}
        terminalStatus={terminalStatus}
        canUseAi={canUseAi}
        roomMode={room.mode}
        algorithmTask={algorithmTask}
        algorithmDifficulty={algorithmDifficulty}
        isGeneratingTask={isGeneratingTask}
        isReviewingTask={isReviewingTask}
        review={algorithmReview}
        aiAction={aiAction}
        aiPrompt={aiPrompt}
        aiResponse={aiResponse}
        aiHistory={aiHistory}
        isAiLoading={isAiLoading}
        canReject={lastAiEditRef.current !== null}
        onDifficultyChange={setAlgorithmDifficulty}
        onGenerateTask={() => {
          void handleGenerateTask();
        }}
        onReviewSolution={() => {
          void handleReviewTaskSolution();
        }}
        onAiActionChange={setAiAction}
        onAiPromptChange={setAiPrompt}
        onAiSubmit={() => {
          void handleAskAi();
        }}
        onAiReject={handleRejectAiInsert}
      />

      <ErrorBanner message={toolError ?? aiError} />
    </Box>
  );
}
