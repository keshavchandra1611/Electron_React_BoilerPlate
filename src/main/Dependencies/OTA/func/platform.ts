export function getPlatformAsset(release: any): any {
  const platform = process.platform; // 'win32', 'darwin', 'linux'
  const arch = process.arch; // 'x64', 'arm64', etc.
  const assets = release.assets || [];

  if (platform === 'win32') {
    return (
      assets.find((a: any) => a.name.endsWith('.exe')) ||
      assets.find((a: any) => a.name.toLowerCase().includes('win'))
    );
  }

  if (platform === 'darwin') {
    const archTag = arch === 'arm64' ? 'arm64' : 'x64';
    return (
      assets.find(
        (a: any) =>
          a.name.endsWith('.dmg') &&
          a.name.toLowerCase().includes(archTag.toLowerCase()),
      ) || assets.find((a: any) => a.name.endsWith('.dmg'))
    );
  }

  if (platform === 'linux') {
    return (
      assets.find((a: any) => a.name.endsWith('.AppImage')) ||
      assets.find((a: any) => a.name.endsWith('.tar.gz'))
    );
  }

  return null;
}
