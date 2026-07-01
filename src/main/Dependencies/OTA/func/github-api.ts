import https from 'https';

const REPO = process.env.PackagePushRepo;
const GHToken = process.env.GH_TOKEN
// const HEADERS = { 'User-Agent': 'Electron-App-Updater' };
const HEADERS = {
  "User-Agent": "PIClickersOverlay",
  "Accept": "application/vnd.github+json",
  "Authorization": `Bearer ${GHToken}`,  // To skip the rate limit error, you can use a personal access token (PAT) from GitHub. Make sure to set it in your environment variables as GH_TOKEN, 5000 requests per hour limit will be applied. If you don't have a token, you can skip this header, 60 requests per hour limit will be applied.
};

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
