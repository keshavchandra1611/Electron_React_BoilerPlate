import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  clearAllStorage,
  getWithKey,
  setWithKey,
  deleteWithKey,
  getAllStorage,
} from '../../utils/ElectronStore/ElectronStoreUtil';

export default function ElectronStoreDemo() {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [storeData, setStoreData] = useState<Record<string, any>>({});

  // Default demo data
  const DEFAULTS: { key: string; value: string }[] = [
    { key: 'test1', value: 'Keshav2' },
    { key: 'test2', value: 'Alice' },
    { key: 'test3', value: 'Bob' },
  ];

  // Refresh all data from store
  const refreshData = () => {
    try {
      const all = getAllStorage();
      setStoreData(all || {});
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = () => {
    if (!key.trim()) return toast.error('Key cannot be empty');
    setWithKey(key, value);
    toast.success(`✅ Saved "${key}"`);
    setKey('');
    setValue('');
    refreshData();
  };

  const handleDelete = (k: string) => {
    deleteWithKey(k);
    toast.info(`🗑️ Deleted "${k}"`);
    refreshData();
  };

  const handleClear = () => {
    clearAllStorage();
    toast.warn('🚨 Cleared all storage!');
    refreshData();
  };

  const handleAddDemoData = () => {
    // 🧩 Loop through each default key-value pair and save them individually
    // Example: setWithKey('test1', 'Keshav2'), setWithKey('test2', 'Alice'), etc.
    DEFAULTS.forEach((item) => setWithKey(item.key, item.value));

    // // 🪞 Log what’s being added to the Electron Store
    // console.log('📦 Adding demo data:', DEFAULTS);

    // 🗂️ Save the entire DEFAULTS array under a single key called "test"
    // This allows you to later retrieve the whole set at once if needed
    setWithKey('test', DEFAULTS);

    toast.info('📦 Demo data added!');

    // 🔄 Refresh UI so that the newly added data appears immediately
    refreshData();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-6 text-gray-800">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 mt-10">
        <h1 className="text-2xl font-bold text-center mb-1">
          ⚙️ Electron Store Demo
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Manage and view Electron Store data.
        </p>

        {/* Input section */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <input
            className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium"
          >
            Save
          </button>
        </div>

        {/* Data list */}
        <div className="border rounded-xl p-4 bg-gray-50 max-h-72 overflow-auto">
          {Object.keys(storeData).length > 0 ? (
            Object.entries(storeData).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-start border-b last:border-b-0 py-2"
              >
                <div className="max-w-[80%]">
                  <p className="font-semibold">{k}</p>
                  {typeof v === 'object' ? (
                    <pre className="text-sm text-gray-600 bg-gray-100 p-2 rounded-lg whitespace-pre-wrap">
                      {JSON.stringify(v, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-600 break-all">
                      {String(v)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(k)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No data stored</p>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex justify-between mt-6">
          <button
            onClick={refreshData}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-medium"
          >
            Refresh
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleAddDemoData}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add Demo Data
            </button>
            <button
              onClick={handleClear}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 italic">
        Demo Version — Electron Store Playground
      </p>
    </div>
  );
}
