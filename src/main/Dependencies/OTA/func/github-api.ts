import https from 'https';

const REPO = process.env.PackagePushRepo;
const HEADERS = { 'User-Agent': 'Electron-App-Updater' };

export function getLatestGitHubRelease(): Promise<any> {
  return fetchGitHub(`https://api.github.com/repos/${REPO}/releases/latest`);
}

export function getAllGitHubReleases(): Promise<any[]> {
  return fetchGitHub(`https://api.github.com/repos/${REPO}/releases`);
}

export function getGitHubReleaseByTag(tag: string): Promise<any> {
  return fetchGitHub(
    `https://api.github.com/repos/${REPO}/releases/tags/${tag}`,
  );
}

function fetchGitHub(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: HEADERS }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}
