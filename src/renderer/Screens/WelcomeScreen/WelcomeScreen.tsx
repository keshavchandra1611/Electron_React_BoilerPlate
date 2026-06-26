import React, { useEffect, useState } from 'react';
import icon from '../../../../assets/icon.svg';
import { RouteName, useTypedNavigation } from '../../routes/routes';

const WelcomeScreen = () => {
  const { goTo } = useTypedNavigation();
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    // Reflect the current state on mount, then stay in sync with open/close
    // events (including when the overlay closes via its own × button).
    window.electron?.secondaryWindow.isOpen().then(setOverlayOpen);
    const unsubscribe = window.electron?.secondaryWindow.onStateChange(
      setOverlayOpen,
    );
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-500 text-center">
      <h1 className="text-4xl font-semibold text-white mb-8">Welcome</h1>
      {/* App Icon */}
      <img
        width="160"
        alt="App Icon"
        src={icon}
        className="mb-6 animate-fade-in"
      />

      {/* Heading */}
      <h1 className="text-3xl font-semibold text-gray-100 mb-2">
        Electron React Boilerplate
      </h1>
      <h2 className="text-2xl font-semibold text-gray-100 mb-2">
        Tailwind Setup
      </h2>
      <p className="text-gray-100 mb-8">
        Your modern Electron + React + Tailwind starter template 🚀
      </p>

      {/* Button */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => goTo(RouteName.Home)}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
        >
          Go to Home
        </button>
        <button
          onClick={() => goTo(RouteName.ElectronStore)}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
        >
          Go to Check Electron Store
        </button>
        <button
          onClick={() => goTo(RouteName.OverTheAirUpdates)}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
        >
          Go to Check OTA Updates
        </button>
        <button
          onClick={() => window.electron?.secondaryWindow.toggle()}
          className={`px-6 py-2 text-white font-medium rounded-xl transition-all shadow-md ${
            overlayOpen
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {overlayOpen ? 'Close Overlay Window' : 'Open Overlay Window'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
