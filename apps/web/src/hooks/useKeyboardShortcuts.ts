import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: KeyHandler;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Support both Ctrl and Meta (Cmd on Mac)
        const modifierMatch =
          (shortcut.ctrl || shortcut.meta)
            ? (event.ctrlKey || event.metaKey)
            : ctrlMatch && metaMatch;

        if (modifierMatch && shiftMatch && altMatch && keyMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for the editor
export function useEditorShortcuts({
  onSave,
  onSearch,
  onNewFile,
  onToggleChat,
}: {
  onSave?: () => void;
  onSearch?: () => void;
  onNewFile?: () => void;
  onToggleChat?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      handler: () => onSave(),
    });
  }

  if (onSearch) {
    shortcuts.push({
      key: 'p',
      ctrl: true,
      handler: () => onSearch(),
    });
  }

  if (onNewFile) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      handler: () => onNewFile(),
    });
  }

  if (onToggleChat) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      handler: () => onToggleChat(),
    });
  }

  useKeyboardShortcuts(shortcuts);
}
