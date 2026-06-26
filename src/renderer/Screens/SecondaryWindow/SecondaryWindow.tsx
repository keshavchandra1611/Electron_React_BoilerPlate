import React, { useEffect, useRef, useState } from 'react';

// `-webkit-app-region` isn't in React's CSSProperties typings, so cast it.
const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties;
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

// Movement past this many pixels counts as a drag (otherwise it's a click).
const DRAG_THRESHOLD = 4;

const SecondaryWindow = () => {
  const [collapsed, setCollapsed] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    winX: number;
    winY: number;
    moved: boolean;
  } | null>(null);

  // The overlay is its own clicker client. The single-owner lock lives in the
  // main process: if another window already owns the receiver, our open() comes
  // back as an error instead of stealing the connection.
  const [isConnected, setIsConnected] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [lastData, setLastData] = useState<any>(null);
  const [lastClickerData, setLastClickerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The BrowserWindow is transparent; keep the page background clear so the
    // rounded surface below is the only thing visible.
    document.body.style.background = 'transparent';
  }, []);

  useEffect(() => {
    window.electron?.clickerSDK.subscribeEvents((data: any) => {
      if (data.type === 'opened') {
        setIsConnected(true);
        setError(null);
      } else if (data.type === 'closed') {
        setIsConnected(false);
        setReceiverId(null);
        setLastData(null);
        setLastClickerData(null);
      } else if (data.type === 'data') {
        if (data.payload?.clickerId && !data.payload?.receiverId) {
          setLastClickerData(data.payload);
        } else {
          setLastData(data.payload);
        }
        // Ignore the placeholder/broadcast receiver id — keep the last real one.
        const incomingReceiverId = data.payload?.receiverId;
        if (incomingReceiverId && incomingReceiverId !== 'FE:00:00:00:00:01') {
          setReceiverId(incomingReceiverId);
        }
      } else if (data.type === 'error') {
        setError(data.payload?.message || 'Unknown error');
      }
    });
    return () => {
      window.electron?.clickerSDK.unsubscribeEvents();
      window.electron?.clickerSDK.close();
    };
  }, []);

  const toggleConnection = () => {
    setError(null);
    if (isConnected) {
      window.electron?.clickerSDK.close();
    } else {
      window.electron?.clickerSDK.open();
    }
  };

  const handleClose = () => {
    window.electron?.secondaryWindow.close();
  };

  const applyCollapsed = (next: boolean) => {
    setCollapsed(next);
    window.electron?.secondaryWindow.setCollapsed(next);
  };

  // --- Custom drag for the collapsed button -------------------------------
  // The same button must work as BOTH a drag handle and a click-to-expand
  // control, so we track the mouse manually: move the window while dragging,
  // and on release either snap to an edge (if dragged) or expand (if clicked).
  const onDragMove = (e: MouseEvent) => {
    const s = dragState.current;
    if (!s) return;
    const dx = e.screenX - s.startX;
    const dy = e.screenY - s.startY;
    if (!s.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      s.moved = true;
    }
    if (s.moved) {
      window.electron?.secondaryWindow.setPosition(s.winX + dx, s.winY + dy);
    }
  };

  const onDragEnd = () => {
    const s = dragState.current;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    dragState.current = null;
    if (!s) return;
    if (s.moved) {
      window.electron?.secondaryWindow.snapToEdge();
    } else {
      applyCollapsed(false); // a click without movement expands
    }
  };

  const onButtonMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const bounds = await window.electron?.secondaryWindow.getBounds();
    if (!bounds) return;
    dragState.current = {
      startX: e.screenX,
      startY: e.screenY,
      winX: bounds.x,
      winY: bounds.y,
      moved: false,
    };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  };

  // --- Collapsed: just the floating expand button -------------------------
  if (collapsed) {
    return (
      <button
        type="button"
        onMouseDown={onButtonMouseDown}
        style={noDragRegion}
        title="Expand"
        aria-label="Expand overlay"
        className="flex h-screen w-screen cursor-move items-center justify-center rounded-full border border-white/25 bg-gray-900/90 text-lg text-white backdrop-blur hover:bg-gray-800/90"
      >
        ⤢
      </button>
    );
  }

  // --- Expanded: full overlay ---------------------------------------------
  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden rounded-2xl border border-white/25 bg-gray-900/90 text-white backdrop-blur"
      style={noDragRegion}
    >
      {/* Title bar — only the grip button moves the window */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Dedicated drag button (grip handle) */}
          <button
            type="button"
            style={dragRegion}
            className="flex h-6 w-6 cursor-move items-center justify-center rounded-md bg-white/10 text-base leading-none text-gray-200 hover:bg-white/20"
            title="Drag to move"
            aria-label="Drag to move"
          >
            ⠿
          </button>
          <span className="text-sm font-semibold">Overlay</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => applyCollapsed(true)}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs font-bold leading-none text-gray-200 hover:bg-white/20"
            title="Collapse"
            aria-label="Collapse overlay"
          >
            —
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold leading-none text-white hover:bg-red-600"
            aria-label="Close overlay"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3"
        style={noDragRegion}
      >
        {/* Connect / disconnect — drives the single shared connection */}
        <button
          type="button"
          onClick={toggleConnection}
          title={
            isConnected && receiverId
              ? `Receiver ${receiverId}`
              : isConnected
                ? 'Disconnect the receiver'
                : 'Connect the receiver'
          }
          className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
            isConnected
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-sky-500 hover:bg-sky-600'
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: isConnected ? '#4ade80' : '#fda4af' }}
          />
          {isConnected
            ? `Disconnect${receiverId ? ` (${receiverId})` : ''}`
            : 'Connect'}
        </button>

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/15 px-2 py-1.5 text-[11px] font-medium text-red-300">
            {error}
          </p>
        )}

        {!lastData && !lastClickerData && (
          <p className="px-1 text-center text-[11px] text-gray-400">
            {isConnected
              ? 'Waiting for clicker data…'
              : 'Connect to see clicker data.'}
          </p>
        )}

        {lastData && (
          <div className="rounded-md border border-white/10 bg-black/30 p-2">
            <h3 className="mb-1 text-[11px] font-semibold text-gray-300">
              Last Data Received
            </h3>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[10px] leading-tight text-green-400">
              {JSON.stringify(lastData, null, 2)}
            </pre>
          </div>
        )}

        {lastClickerData && (
          <div className="rounded-md border border-white/10 bg-black/30 p-2">
            <h3 className="mb-1 text-[11px] font-semibold text-gray-300">
              Last Data From Clicker
            </h3>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[10px] leading-tight text-green-400">
              {JSON.stringify(lastClickerData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecondaryWindow;
