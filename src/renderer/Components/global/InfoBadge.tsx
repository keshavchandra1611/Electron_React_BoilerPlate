import React, { useState } from 'react';
import currentVersionDetails from './../../../utils/Version/current-details.json';

const AppVersionInfo = () => {
  const [showPopup, setShowPopup] = useState(false);
  const currentAppVersionData = currentVersionDetails ?? '';

  return (
    <>
      {/* Info Badge */}
      <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
        <button
          onClick={() => setShowPopup(true)}
          className="font-mono font-semibold text-gray-800 text-xs flex gap-2 items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg hover:bg-white transition"
          title="What's New?"
          style={{ mixBlendMode: 'difference' }}
        >
          {currentAppVersionData.productName}
          <span className="font-normal text-xs">
            v{currentAppVersionData.version}
          </span>
          {/* Inline InformationCircle SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
            />
          </svg>
        </button>
        {/* 
        <span className="text-gray-600 text-sm truncate max-w-[200px]">
          {currentAppVersionData.description}
        </span> */}
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              {/* Inline XMark SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 className="text-xl font-semibold mb-2">
              What's New in v{currentAppVersionData.version}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {currentAppVersionData.description}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AppVersionInfo;
