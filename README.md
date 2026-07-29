# Browser Project

A custom privacy-focused web browser built with Electron and TypeScript.

## Features

- Multi-tab browsing with `BrowserView`
- Back/forward/reload navigation with stop-loading support
- Custom start page with search/URL bar
- Browsing history (with automatic deduplication)
- Bookmarks
- Settings page (custom homepage)
- Keyboard shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+L`, `Ctrl+R`)
- Ad and tracker blocking (EasyList/EasyPrivacy)
- Per-tab session isolation (sandboxed partitions)
- SSL certificate validation warnings

## Tech Stack

- Electron
- TypeScript
- Jest (testing)
- GitHub Actions (CI)

## Project Structure

src/
├── main/ # Main process: windows, tabs, IPC handlers
├── renderer/ # UI: toolbar, tabs, address bar, start/history/bookmarks/settings pages
├── preload/ # contextBridge API exposed to renderer
├── security/ # Adblock, certificate checks, session isolation
└── shared/ # Shared types/constants


## Getting Started

Install dependencies:

npm install


Build and run:

npm start


Run tests:

npm test


### NixOS

If you're on NixOS, use the provided `shell.nix` to get the required system libraries and a nixpkgs-patched Electron binary:

nix-shell
npm run build
electron .


## Development Workflow

- Create a feature branch for each new feature: `git checkout -b feature/your-feature`
- Push and open a Pull Request into `main`
- Tests must pass (GitHub Actions CI) before merging
- Merge via GitHub once checks are green

## Contributors

- Illia — UI, core browser functionality (tabs, navigation, history, bookmarks, settings)
- Nazar — Privacy and security (adblock, session isolation, certificate validation)