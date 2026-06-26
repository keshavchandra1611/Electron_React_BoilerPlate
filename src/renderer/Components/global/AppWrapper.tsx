// AppWrapper.tsx
import React, { useEffect, useState, ReactNode } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from './Loader';
import AppVersionInfo from './InfoBadge';
import { PopupManager } from './BubblePopup/PopupManager';


type AppWrapperProps = {
  children: ReactNode;
};

const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handler = (event: any) => {
      console.log('⚙️ Renderer caught app-closing:', event.detail);
      setIsClosing(true);
      // toast.info('App is closing');
    };
    window.addEventListener('app-closing-event', handler);

    return () => {
      window.removeEventListener('app-closing-event', handler);
    };
  }, []);

  return (
    <div className="relative">
      {/* Main content with opacity change */}
      <div
        className={`transition-opacity duration-300 ${isClosing ? 'opacity-50' : 'opacity-100'}`}
      >
        {children}
      </div>

      <AppVersionInfo />
      {/* Closing overlay */}
      {isClosing && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-4 text-white text-lg">
          <Loader />
          <span>App is closing, cleaning up...</span>
        </div>
      )}

      <ToastContainer position="bottom-right" />
      {/* This renders all active popups */}
      <PopupManager />
    </div>
  );
};

export default AppWrapper;
