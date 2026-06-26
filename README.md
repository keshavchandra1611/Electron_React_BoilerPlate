# 💻 Electron + React Boilerplate

```bash
███████╗██╗     ███████╗ ██████╗████████╗██████╗  ██████╗ ███╗   ██╗
██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║
█████╗  ██║     █████╗  ██║        ██║   ██████╔╝██║   ██║██╔██╗ ██║
██╔══╝  ██║     ██╔══╝  ██║        ██║   ██╔══██╗██║   ██║██║╚██╗██║
███████╗███████╗███████╗╚██████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║
╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```
### ⚠️ Node.js Version Requirement
<!-- > Before we start: This frontend SDK requires **Node.js 18** to work correctly.   -->
> Please ensure you are using Node 22 (V22.13.1) before running or building the Electron renderer.

---

## ✅ What's Implemented

- ⚡ **Electron + React JS Boilerplate** (clean, ready to extend)
- 🎨 **TailwindCSS Integration** for modern styling
- 🧭 **Typed navigation route setup** for type-safe screen routing
- 🧹 **Removed unused workflows** and redundant setup files
- 🧠 **Cleaned `preload.ts`** with explicitly defined TypeScript types
- 💾 **Electron Store Implementation** for persistent local storage
- 🪪 **Removed Licensing** boilerplate (CHANGELOG, CODE_OF_CONDUCT, LICENSE, `.github`)
- 🔄 **OTA Updates Implemented (with dotenv setup)** for sending, downloading and installing updates
    - 💡 Note: Use these env content. 
        ```bash  
        API_BASE_URL = " <YOUR API BASE URL (test url) HERE>"  
        GH_TOKEN = " <YOUR GITHUB PUBLIC TOKEN HERE> "  
        PackagePushRepo  = "keshavchandra1611/Electron_React_BoilerPlate"
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

