import React, { useState, useEffect } from 'react';
import { useTypedNavigation } from '../../routes/routes';

interface Release {
  tag_name: string;
  name?: string;
  published_at?: string;
  body?: string;
  assets?: { name: string; browser_download_url: string }[];
}

export default function OverTheAirUpdates() {
  const { goBack } = useTypedNavigation();
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [status, setStatus] = useState<string>('Idle');
  const [progress, setProgress] = useState<number>(0);
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    console.log(`\x1b[1;33m🐹 window.electron.env.get('API_BASE_URL'):\x1b[0m \x1b[0;35m${window.electron.env.get('API_BASE_URL')}\x1b[0m`,);

    window.electron.OverTheAirUpdates.onDownloadProgress((prog) => {
      // setProgress(prog.percent ? Number(prog.percent.toFixed(1)) : 0);
      const percentage = Math.floor(prog.percent * 100);
      setProgress(percentage);
      setStatus(`Downloading: ${percentage}%`);
    });

    const loadVersion = async () => {
      try {
        const version = await window.electron.OverTheAirUpdates.getAppVersion();
        setCurrentVersion(version);
      } catch (err) {
        console.error('Failed to get version', err);
      }
    };
    loadVersion();
  }, []);

  const handle = async (fn: () => Promise<any>) => {
    setStatus('Working...');
    try {
      const res = await fn();

      // Pretty render releases if response is array
      if (Array.isArray(res)) setReleases(res);
      else setStatus(JSON.stringify(res, null, 2));
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                🔄 OTA Update Demo Controls
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Current Version
                <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {currentVersion || 'Loading...'}
                </span>
              </p>
            </div>

            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition shadow"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Update Actions
          </h3>

          <div className="flex flex-wrap gap-3">
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition shadow-sm"
              onClick={() =>
                handle(window.electron.OverTheAirUpdates.checkForUpdates)
              }
            >
              Check Updates (Raw Json)
            </button>

            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded-xl transition"
              onClick={() =>
                handle(window.electron.OverTheAirUpdates.getAllVersions)
              }
            >
              Get All Versions (List)
            </button>

            <button
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-xl transition shadow-sm"
              onClick={() =>
                handle(() =>
                  window.electron.OverTheAirUpdates.installSpecific('v1.0.2'),
                )
              }
            >
              Install v1.0.2 (Specific version)
            </button>

            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl transition shadow-sm"
              onClick={() =>
                handle(window.electron.OverTheAirUpdates.installLatest)
              }
            >
              Install Latest
            </button>

            <button
              className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm rounded-xl transition"
              onClick={() =>
                handle(window.electron.OverTheAirUpdates.downloadLatest)
              }
            >
              Download Latest Only
            </button>
          </div>
        </div>

        {/* Progress Card */}
        {progress > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-3">{status}</p>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-right text-xs text-gray-500 mt-2">{progress}%</p>
          </div>
        )}

        {/* Releases Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Releases</h3>

          {releases.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
              {releases.map((r) => (
                <div
                  key={r.tag_name}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-blue-600 font-semibold">
                      {r.tag_name}
                    </h4>
                    {r.published_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(r.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {r.name && (
                    <p className="text-sm text-gray-700 mb-2">{r.name}</p>
                  )}

                  {r.body && (
                    <pre className="text-xs bg-gray-50 p-3 rounded-lg border max-h-32 overflow-auto text-gray-600">
                      {r.body}
                    </pre>
                  )}

                  {r.assets?.length ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Assets
                      </p>
                      <ul className="text-xs space-y-1">
                        {r.assets.map((a) => (
                          <li key={a.name}>
                            <a
                              href={a.browser_download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {a.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-black border border-green-500 rounded-xl p-4 overflow-auto shadow-inner">
              <pre className="whitespace-pre-wrap break-words text-xs font-mono text-green-400">
                {typeof status === 'object'
                  ? JSON.stringify(status, null, 2)
                  : status}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
