/**
 * Centralized application configuration and version history registry.
 *
 * What this file does:
 * 1. Defines common interfaces (`AppConfig`, `VersionHistory`) for app metadata
 *    and version tracking.
 * 2. Maintains a list of supported applications in a single `apps` object.
 * 3. Stores version history for each app, including version numbers and
 *    human-readable change descriptions.
 * 4. Exposes `thisApp` to indicate which app configuration is currently active.
 *
 * Usage:
 * - Used by build/release scripts to:
 *   - Automatically pick the latest version
 *   - Update `package.json` metadata
 *   - Generate release/build information files
 *
 * Notes:
 * - Adding a new app requires adding a new entry in `apps`.
 * - New releases should be appended to the `history` array
 *   (latest version must be the last entry).
 */

export interface VersionHistory {
  version: string;
  description: string;
}

export interface AppConfig {
  name: string;
  productName: string;
  appId: string;
  history: VersionHistory[];

  homepage?: string;
  bugs?: { url: string };
  repository?: { type: string; url: string };
  author?: { name: string; email?: string; url?: string };
  buildPublish?: {
    provider: string;
    owner: string;
    repo: string;
  };
  collective?: {
    url: string;
  };
}

export const thisApp = 'MyElectronApp';

export const apps: Record<string, AppConfig> = {
  MyElectronApp: {
    name: 'my-electron-app',
    productName: 'My Electron App',
    appId: 'co.keshavorg.myelectron',
    history: [
      { version: '1.0.0', description: 'OTA Enabled!' },
    ],

    homepage:
      'https://github.com/keshavchandra1611/Electron_React_BoilerPlate.git#readme',
    bugs: {
      url: 'https://github.com/keshavchandra1611/Electron_React_BoilerPlate/issues',
    },
    repository: {
      type: 'git',
      url: 'git+https://github.com/keshavchandra1611/Electron_React_BoilerPlate.git',
    },
    author: {
      name: 'Electron React Boilerplate Maintainer | Keshav Chandra',
      email: 'keshavchandra1611@gmail.com',
      url: 'https://github.com/keshavchandra1611',
    },
    buildPublish: {
      provider: 'github',
      owner: 'keshavchandra1611',
      repo: 'Electron_React_BoilerPlate',
    },
    // collective: {
    //   url: 'https://opencollective.com/electron-react-boilerplate-594',
    // },
  },
};
