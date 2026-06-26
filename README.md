# 💻 Electron + React Boilerplate

```bash
███████╗██╗     ███████╗ ██████╗████████╗██████╗  ██████╗ ███╗   ██╗
██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║
█████╗  ██║     █████╗  ██║        ██║   ██████╔╝██║   ██║██╔██╗ ██║
██╔══╝  ██║     ██╔══╝  ██║        ██║   ██╔══██╗██║   ██║██║╚██╗██║
███████╗███████╗███████╗╚██████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║
╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

A batteries-included **Electron + React + TypeScript** boilerplate, extended into a
**clicker classroom app** — it talks to a USB clicker receiver over serial, pairs
clickers to students, takes attendance, and ships a floating always-on-top overlay.
Built on top of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)
with TailwindCSS, OTA updates, persistent storage, and a typed `window.electron` bridge.

### ⚠️ Node.js Version Requirement
<!-- > Before we start: This frontend SDK requires **Node.js 18** to work correctly.   -->
> Please ensure you are using **Node 22 (v22.13.1)** before running or building the Electron renderer.

---

## ✨ Highlights

- ⚡ **Electron + React + TypeScript** — clean ERB base, ready to extend
- 🎨 **TailwindCSS** styling with a typed, route-based screen setup
- 🔌 **Clicker SDK** — serial communication with a USB receiver + clickers
- 🧑‍🏫 **Classroom Management** — roster, pair/unpair, and attendance
- 🪟 **Floating Overlay** — always-on-top, draggable, snap-to-edge companion window
- 🔄 **OTA Updates** — publish, download, and install releases from GitHub
- 💾 **Persistent storage** via electron-store
- 🛡️ **Production-hardened** builds with crash-safe window geometry

---

## ✅ What's Implemented

> Listed in the order it was built, oldest first.

- ⚡ **Electron + React JS Boilerplate** — cloned from electron-react-boilerplate and
  cleaned up, ready to extend
- 🎨 **TailwindCSS Integration** for modern styling
- 🧭 **Typed navigation route setup** for type-safe screen routing
- 🧹 **Removed unused workflows** and redundant setup files
- 🧠 **Cleaned `preload.ts`** with explicitly defined TypeScript types for the
  `window.electron` bridge
- 💾 **Electron Store Implementation** for persistent local key–value storage
- 🪪 **Removed Licensing** boilerplate (CHANGELOG, CODE_OF_CONDUCT, LICENSE, `.github`)
- 🔄 **OTA Updates (with dotenv setup)** for sending, downloading and installing
  updates via `electron-updater` + GitHub releases
    - 💡 Note: provide these env values (see [Environment Variables](#-environment-variables)).
        ```bash
        API_BASE_URL = "<YOUR API BASE URL (test url) HERE>"
        GH_TOKEN     = "<YOUR GITHUB PUBLIC TOKEN HERE>"
        PackagePushRepo = "keshavchandra1611/Electron_React_BoilerPlate"
        ```
- 🛠️ **Production env & build hardening** — reliable environment-variable access in
  packaged builds, fixed `installFresh` script, and separated build outputs
- 🪟 **Floating Overlay Window** — an always-on-top, frameless, transparent companion
  window for the app
    - 🧲 **Drag anywhere & snap-to-edge** — drag the overlay (or its collapsed button)
      freely, even off-screen; on release it smoothly snaps back to the nearest edge
    - ➖ **Collapse / Expand** — minimize the overlay into a small floating button and
      click to restore it to its previous size
    - 🖥️ **Stays on top everywhere** — visible across all workspaces and over
      fullscreen apps
    - 🛡️ **Crash-safe geometry** — all window-move coordinates are clamped to a valid
      integer range (with negative-zero normalized) so off-screen drags can never
      crash the main process
- 🖲️ **Clicker SDK + Classroom Management** — serial-port connection layer
  (`src/SDK/init.ts`, `clickerControl.ts`, `serial-commands.enum.ts`), the preload
  bridge (`window.electron.clickerSDK`), and the Classroom Management screen
  (`ClickerTestScreen`) with student roster, pair/unpair, attendance, and a
  celebration bubble popup when a paired clicker responds
- 🔒 **Clicker on the overlay + single-owner connection** — connect/disconnect the
  receiver and see live data (last receiver data + last clicker data) with the
  connected receiver id, right from the overlay. The receiver has exactly **one
  listener at a time**: whichever window connects first (Classroom Management screen
  or overlay) owns it; the other is locked out with an *"already connected on
  another window — disconnect it there first"* error until the owner disconnects.
  Enforced in the main process so the two windows can never fight over the stream.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies (also rebuilds native modules like serialport)
npm install

# 2. Run in development (hot-reloading renderer + main)
npm start            # or: npm run dev

# 3. Lint
npm run lint         # check
npm run lint:fix     # auto-fix (Prettier runs as an ESLint rule)

# 4. Tests
npm test
```

### Building & Packaging

```bash
npm run build           # build main + renderer bundles
npm run package:mac     # package a macOS app
npm run package:win     # package a Windows (x64) app
npm run package:all     # clean, bump version, then package win + mac

# Publish to GitHub releases (requires GH_TOKEN in .env)
npm run package:winPush
npm run package:macPush
```

> 🧰 **Stuck build?** `npm run installFresh` wipes `node_modules`, lockfiles, and
> Electron caches, then reinstalls from scratch.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
API_BASE_URL    = "<your API base url for OTA update checks>"
GH_TOKEN        = "<your GitHub token for publishing releases>"
PackagePushRepo = "keshavchandra1611/Electron_React_BoilerPlate"
```

These power the **OTA update** flow (checking, downloading, installing) and the
`package:*Push` publish scripts.

---

## 🧩 The `window.electron` Bridge

The preload exposes a single typed object (`src/main/preload.ts`):

| Namespace | Purpose |
|---|---|
| `ipcRenderer` | Generic typed IPC `sendMessage` / `on` / `once` / `invoke` |
| `electronStore` | Persistent storage — `get` / `set` / `delete` |
| `env` | App environment info (dev/packaged, etc.) |
| `OverTheAirUpdates` | Check, download, install OTA updates |
| `secondaryWindow` | Control the floating overlay (open/close/collapse/drag/snap) |
| `clickerSDK` | Connect to and control the clicker receiver |

### Clicker SDK API (`window.electron.clickerSDK`)

```ts
list(): Promise<PortInfo[]>          // list serial ports
open(): boolean                      // connect the receiver (claims the single-owner lock)
close(): boolean                     // disconnect (releases the lock)
write(cmd: SerialMessageType): boolean
pairClicker(macId: string): boolean  // pair a specific clicker
subscribeEvents(cb): void            // stream: 'opened' | 'closed' | 'data' | 'error'
unsubscribeEvents(): void
```

Serial commands live in `src/SDK/serial-commands.enum.ts` (`START_PAIR`, `END_PAIR`,
`START_POLL`, `ENABLE_MULTI_MODE`, plus receiver/clicker firmware-OTA commands).

---

## 🗂️ Project Structure

```
src/
├── SDK/                         # Clicker SDK (serial)
│   ├── init.ts                  # main-process serial port + single-owner lock
│   ├── clickerControl.ts        # RxJS event service used by the preload bridge
│   └── serial-commands.enum.ts  # device command vocabulary
├── main/                        # Electron main process
│   ├── main.ts, preload.ts
│   └── Dependencies/            # feature modules (main + preload pairs)
│       ├── Clicker/             # clicker preload bridge
│       ├── SecondaryWindow/     # overlay window: creation, drag, snap, collapse
│       ├── OTA/                 # over-the-air updates
│       ├── ElectronStore/       # persistent storage
│       ├── env/ · ipc/          # env + generic IPC bridges
└── renderer/                    # React app
    ├── Screens/
    │   ├── ClickerTestScreen/   # Classroom Management (roster, pairing, attendance)
    │   ├── SecondaryWindow/     # the overlay UI
    │   ├── OTA/ · ElectronStore/ · Home/ · WelcomeScreen/
    ├── Components/global/        # e.g. BubblePopup celebration animation
    └── routes/                   # typed navigation
```

The renderer ships **one bundle** loaded by both windows; the overlay is rendered
when the URL hash is `#secondary` (see `src/renderer/index.tsx`).

---

## 🧠 Architecture Notes

- **Single serial connection, single owner.** The USB receiver is opened once in the
  main process (`src/SDK/init.ts`). Serial data flows only to the window that owns
  the connection; a second window attempting to connect is rejected with an error
  rather than silently stealing the stream — so the Classroom Management screen and
  the overlay never conflict.
- **Crash-safe overlay geometry.** Every window-move coordinate is clamped to a valid
  `int32` range (negative-zero normalized), because Electron's `setPosition` throws on
  bad values and a throw inside the snap-animation timer would crash the app.
- **Prettier via ESLint.** Formatting is enforced as an ESLint rule (through
  `eslint-config-erb`); run `npm run lint:fix` to format.

---

## 📜 License

Licensing boilerplate was intentionally removed from this fork. Add your own license
before distribution.
