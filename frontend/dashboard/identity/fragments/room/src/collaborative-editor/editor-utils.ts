'use client';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { type Extension, EditorState } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
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
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import type { RoomFile } from '@lib/files';
import type { RoomAiAssistAction } from '@lib/rooms';
import type { SessionUser } from './types';

export function getUserLabel(user: SessionUser | null) {
  if (!user) {
    return 'Guest';
  }

  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .trim();

  return fullName || user.email;
}

export function getUserColor(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

export function getEditorExtensions({
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
        height: '100%',
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

export function getLanguageExtension(language: RoomFile['language']) {
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

export function getEditorContent(editorView: EditorView | null, fallback: string) {
  return editorView?.state.doc.toString() ?? fallback;
}

export function normalizeAiCodeResponse(value: string) {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  return trimmed;
}

export function applyAiResponseToEditor(
  editorView: EditorView,
  action: RoomAiAssistAction,
  code: string,
) {
  const selection = editorView.state.selection.main;

  if (action === 'CURSOR_COMPLETE' || action === 'GENERATE_FROM_INSTRUCTION') {
    const insertFrom =
      action === 'GENERATE_FROM_INSTRUCTION' && !selection.empty
        ? selection.from
        : selection.to;
    const insertTo =
      action === 'GENERATE_FROM_INSTRUCTION' && !selection.empty
        ? selection.to
        : selection.to;

    const previousText = editorView.state.doc.sliceString(insertFrom, insertTo);

    editorView.dispatch({
      changes: {
        from: insertFrom,
        to: insertTo,
        insert: code,
      },
      selection: {
        anchor: insertFrom,
        head: insertFrom + code.length,
      },
    });

    editorView.focus();
    return {
      from: insertFrom,
      to: insertFrom + code.length,
      previousText,
    };
  }

  if (action === 'SELECTION_IMPROVE') {
    const previousText = editorView.state.doc.sliceString(
      selection.from,
      selection.to,
    );

    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: code,
      },
      selection: {
        anchor: selection.from,
        head: selection.from + code.length,
      },
    });

    editorView.focus();
    return {
      from: selection.from,
      to: selection.from + code.length,
      previousText,
    };
  }

  return null;
}
