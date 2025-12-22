/**
 * DnD 调试 Hook
 */

import { useCallback, useEffect } from 'react';

interface DndDebugWindow {
  __DND_DEBUG__?: Array<Record<string, unknown>>;
  __DND_DEBUG_LAST__?: Record<string, unknown>;
}

export function useDndDebug() {
  const pushDndDebug = useCallback((entry: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as DndDebugWindow;
    const list = w.__DND_DEBUG__ ?? [];
    list.push(entry);
    if (list.length > 200) list.splice(0, list.length - 200);
    w.__DND_DEBUG__ = list;
    w.__DND_DEBUG_LAST__ = entry;
  }, []);

  return { pushDndDebug };
}

export function useDndDebugListeners(activeId: string | null, pushDndDebug: (entry: Record<string, unknown>) => void) {
  useEffect(() => {
    if (!activeId) return;
    if (typeof window === 'undefined') return;

    const onBlur = () => {
      pushDndDebug({ type: 'window.blur', id: activeId, ts: Date.now() });
    };
    const onVisibilityChange = () => {
      pushDndDebug({
        type: 'document.visibilitychange',
        id: activeId,
        state: document.visibilityState,
        ts: Date.now(),
      });
    };
    const onMouseUp = (e: MouseEvent) => {
      pushDndDebug({
        type: 'window.mouseup',
        id: activeId,
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY,
        ts: Date.now(),
      });
    };
    const onPointerCancel = (e: PointerEvent) => {
      pushDndDebug({
        type: 'window.pointercancel',
        id: activeId,
        pointerType: e.pointerType,
        clientX: e.clientX,
        clientY: e.clientY,
        ts: Date.now(),
      });
    };
    const onContextMenu = () => {
      pushDndDebug({ type: 'window.contextmenu', id: activeId, ts: Date.now() });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pushDndDebug({ type: 'window.keydown.esc', id: activeId, ts: Date.now() });
      }
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('mouseup', onMouseUp, true);
    window.addEventListener('pointercancel', onPointerCancel, true);
    window.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('mouseup', onMouseUp, true);
      window.removeEventListener('pointercancel', onPointerCancel, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [activeId, pushDndDebug]);
}
