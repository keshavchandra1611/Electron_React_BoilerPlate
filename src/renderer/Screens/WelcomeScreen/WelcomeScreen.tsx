import React from 'react';
import icon from '../../../../assets/icon.svg';
import { RouteName, useTypedNavigation } from '../../routes/routes';

const WelcomeScreen = () => {
  const { goTo } = useTypedNavigation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-500 text-center">
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
      <div className='flex justify-center items-center gap-2'>
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
      </div>
    </div>
  );
};

export default WelcomeScreen;
