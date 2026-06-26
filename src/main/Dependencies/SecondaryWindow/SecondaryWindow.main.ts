import path from 'path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { resolveHtmlPath } from '../../util';

let secondaryWindow: BrowserWindow | null = null;

/**
 * Safely move the overlay. Electron's setPosition throws ("conversion failure")
 * for non-integer / non-finite / out-of-int32-range coordinates, and such a
 * throw inside a timer (the snap animation) crashes the whole app. This guards
 * every move so a bad value is dropped instead of crashing.
 */
const INT32_MAX = 2147483647;
// Coerce to a clean int32 and collapse negative zero to +0. Electron's native
// setPosition rejects `-0` with a "conversion failure" that crashes the timer;
// `Math.round` produces `-0` for small negatives (e.g. the last frames of a
// left-edge snap that animates x toward 0), so we normalize it here.
const toInt32 = (v: number): number =>
  Math.round(Math.max(-INT32_MAX, Math.min(v, INT32_MAX))) | 0;
const safeSetPosition = (x: number, y: number): void => {
  if (!secondaryWindow) return;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  secondaryWindow.setPosition(toInt32(x), toInt32(y));
};

// Geometry constants used by the collapse/expand feature.
const MIN_WIDTH = 240;
const EXPANDED_MIN_HEIGHT = 160;
const COLLAPSED_SIZE = 56; // a small square floating button
// Remembers the user's last expanded size so we can restore it on expand.
let expandedWidth = 320;
let expandedHeight = 200;

/**
 * Clamps a desired (x, y) top-left position so a window of the given size stays
 * fully inside the work area of the display nearest the target. Falls back to
 * the primary display for non-finite input so we never feed invalid numbers to
 * Electron's geometry APIs (which throw and crash the main process).
 */
const clampPositionToWorkArea = (
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } => {
  const safeX = Number.isFinite(x) ? x : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  const { workArea: wa } = screen.getDisplayNearestPoint({
    x: Math.round(safeX + width / 2),
    y: Math.round(safeY + height / 2),
  });
  return {
    x: Math.round(Math.max(wa.x, Math.min(safeX, wa.x + wa.width - width))),
    y: Math.round(Math.max(wa.y, Math.min(safeY, wa.y + wa.height - height))),
  };
};

/**
 * Clamps a position to the bounding box of all displays, grown by a margin so
 * the window may be dragged partially (or fully) off any edge. This does NOT
 * keep the window on-screen — it only keeps coordinates finite and in a sane
 * range so they can't crash Electron's geometry APIs. The window is brought
 * back on-screen by snap-to-edge when the drag ends.
 */
const clampToDragBounds = (
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } => {
  const safeX = Number.isFinite(x) ? x : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  const { bounds: primary } = screen.getPrimaryDisplay();
  let left = primary.x;
  let top = primary.y;
  let right = primary.x + primary.width;
  let bottom = primary.y + primary.height;
  screen.getAllDisplays().forEach(({ bounds }) => {
    left = Math.min(left, bounds.x);
    top = Math.min(top, bounds.y);
    right = Math.max(right, bounds.x + bounds.width);
    bottom = Math.max(bottom, bounds.y + bounds.height);
  });
  // Allow the window to be pulled fully past an edge (margin = its own size).
  return {
    x: Math.round(Math.max(left - width, Math.min(safeX, right))),
    y: Math.round(Math.max(top - height, Math.min(safeY, bottom))),
  };
};

/** Keeps the window fully inside the work area of its current display. */
const clampIntoWorkArea = (): void => {
  if (!secondaryWindow) return;
  const b = secondaryWindow.getBounds();
  const { x, y } = clampPositionToWorkArea(b.x, b.y, b.width, b.height);
  secondaryWindow.setBounds({ x, y, width: b.width, height: b.height });
};

// Handle for an in-progress snap animation so it can be cancelled.
let snapAnimation: ReturnType<typeof setInterval> | null = null;

const cancelSnapAnimation = (): void => {
  if (snapAnimation) {
    clearInterval(snapAnimation);
    snapAnimation = null;
  }
};

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** Smoothly eases the window from its current position to (targetX, targetY). */
const animateTo = (targetX: number, targetY: number, duration = 220): void => {
  if (!secondaryWindow) return;
  cancelSnapAnimation();
  const { x: startX, y: startY } = secondaryWindow.getBounds();
  const dx = targetX - startX;
  const dy = targetY - startY;
  if (dx === 0 && dy === 0) return;

  const startTime = Date.now();
  snapAnimation = setInterval(() => {
    try {
      if (!secondaryWindow) {
        cancelSnapAnimation();
        return;
      }
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = easeOutCubic(t);
      safeSetPosition(startX + dx * eased, startY + dy * eased);
      if (t >= 1) cancelSnapAnimation();
    } catch (err) {
      // Never let a geometry error in the timer crash the whole app.
      cancelSnapAnimation();
      console.error('[SecondaryWindow] snap animation tick failed:', err);
    }
  }, 16);
};

/** Snaps the window to the nearest edge of its current display's work area. */
const snapToNearestEdge = (): void => {
  if (!secondaryWindow) return;
  try {
    const b = secondaryWindow.getBounds();
    // Use a point guaranteed to be finite for the display lookup.
    const { workArea: wa } = screen.getDisplayNearestPoint({
      x: Math.round(b.x + b.width / 2),
      y: Math.round(b.y + b.height / 2),
    });
    // First clamp inside the work area so it can never sit outside the screen.
    let x = Math.max(wa.x, Math.min(b.x, wa.x + wa.width - b.width));
    let y = Math.max(wa.y, Math.min(b.y, wa.y + wa.height - b.height));

    const distLeft = x - wa.x;
    const distRight = wa.x + wa.width - (x + b.width);
    const distTop = y - wa.y;
    const distBottom = wa.y + wa.height - (y + b.height);
    const min = Math.min(distLeft, distRight, distTop, distBottom);

    if (min === distLeft) x = wa.x;
    else if (min === distRight) x = wa.x + wa.width - b.width;
    else if (min === distTop) y = wa.y;
    else y = wa.y + wa.height - b.height;

    animateTo(x, y);
  } catch (err) {
    console.error('[SecondaryWindow] snapToNearestEdge failed:', err);
  }
};

const getPreloadPath = (): string =>
  app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, '../../.erb/dll/preload.js');

/** Notify every window so toggle buttons stay in sync (e.g. when the overlay
 * is closed via its own × button rather than the toggle). */
const broadcastState = (isOpen: boolean): void => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('secondary-window:state', isOpen);
  });
};

/**
 * Creates (or focuses) the always-on-top, frameless, draggable overlay window.
 * The renderer renders the overlay UI when the URL hash is `#secondary`
 * (see src/renderer/index.tsx).
 */
export const createSecondaryWindow = (): BrowserWindow => {
  if (secondaryWindow) {
    secondaryWindow.show();
    secondaryWindow.focus();
    return secondaryWindow;
  }

  expandedWidth = 320;
  expandedHeight = 200;
  secondaryWindow = new BrowserWindow({
    width: 320,
    height: 200,
    minWidth: MIN_WIDTH,
    minHeight: EXPANDED_MIN_HEIGHT,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  secondaryWindow.loadURL(`${resolveHtmlPath('index.html')}#secondary`);

  // Stay above every other window, including fullscreen apps and other desktops.
  secondaryWindow.setAlwaysOnTop(true, 'screen-saver');
  secondaryWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });

  secondaryWindow.on('closed', () => {
    cancelSnapAnimation();
    secondaryWindow = null;
    broadcastState(false);
  });

  broadcastState(true);
  return secondaryWindow;
};

ipcMain.handle('secondary-window:open', () => {
  createSecondaryWindow();
});

ipcMain.handle('secondary-window:close', () => {
  secondaryWindow?.close();
});

/** Toggle the overlay and return its new open state. */
ipcMain.handle('secondary-window:toggle', () => {
  if (secondaryWindow) {
    secondaryWindow.close();
    return false;
  }
  createSecondaryWindow();
  return true;
});

ipcMain.handle('secondary-window:is-open', () => secondaryWindow !== null);

/**
 * Collapse the overlay into a small edge-snapped button, or restore it to the
 * previous expanded size.
 */
ipcMain.handle(
  'secondary-window:set-collapsed',
  (_event, collapsed: boolean) => {
    if (!secondaryWindow) return;
    if (collapsed) {
      const [width, height] = secondaryWindow.getSize();
      expandedWidth = width;
      expandedHeight = height;
      secondaryWindow.setResizable(false);
      secondaryWindow.setMinimumSize(COLLAPSED_SIZE, COLLAPSED_SIZE);
      secondaryWindow.setSize(COLLAPSED_SIZE, COLLAPSED_SIZE, false);
      snapToNearestEdge();
    } else {
      cancelSnapAnimation();
      secondaryWindow.setMinimumSize(MIN_WIDTH, EXPANDED_MIN_HEIGHT);
      secondaryWindow.setSize(expandedWidth, expandedHeight, false);
      secondaryWindow.setResizable(true);
      clampIntoWorkArea();
    }
  },
);

/** Returns the overlay window bounds (used by the renderer's custom drag). */
ipcMain.handle('secondary-window:get-bounds', () =>
  secondaryWindow ? secondaryWindow.getBounds() : null,
);

/** Moves the overlay to an absolute screen position (during a custom drag). */
ipcMain.handle(
  'secondary-window:set-position',
  (_event, x: number, y: number) => {
    if (!secondaryWindow) return;
    try {
      // A fresh drag interrupts any in-progress snap easing.
      cancelSnapAnimation();
      // Let the window be dragged anywhere (even off-screen), but keep the
      // coordinates finite and in range — out-of-range / non-finite values
      // passed to setPosition throw and would crash the main process. The
      // window is snapped back to the nearest edge on drop.
      const [width, height] = secondaryWindow.getSize();
      const { x: cx, y: cy } = clampToDragBounds(x, y, width, height);
      safeSetPosition(cx, cy);
    } catch (err) {
      console.error('[SecondaryWindow] set-position failed:', err);
    }
  },
);

/** Snaps the overlay to the nearest screen edge (on drag drop). */
ipcMain.handle('secondary-window:snap-to-edge', () => {
  snapToNearestEdge();
});
