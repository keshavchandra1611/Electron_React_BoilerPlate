import React, { useState } from 'react';
import BubblePopup from './BubblePopup';
import { showPopup } from './PopupManager';

interface BubblePopupDemoProps {
  options: string;
  value?: string;
  onChange: (value: string) => void;
}

const BubblePopupDemo: React.FC<BubblePopupDemoProps> = ({
  options,
  value,
  onChange,
}) => {
  const [popups, setPopups] = useState<
    { id: number; message: string; duration?: number }[]
  >([]);

  const messages = [
    'Update successful 🎉',
    'Device paired ✅',
    'Clicker connected ⚡',
    'Student synced 👩‍🎓',
    'Battery check 🔋',
    'Action complete 🚀',
    'Saved successfully 💾',
  ];

  const handleShowPopups = () => {
    const totalPopups = 1000; // generate 100 popups
    const maxDelay = 1000; // max delay in ms

    const newPopups: { id: number; message: string; duration?: number }[] = [];

    for (let i = 0; i < totalPopups; i++) {
      const randomDelay = Math.random() * maxDelay;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];

      setTimeout(() => {
        setPopups((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: randomMsg,
            duration: 4000,
          },
        ]);
      }, randomDelay);
    }
  };

  const handleClosePopup = (id: number) => {
    setPopups((prev) => prev.filter((popup) => popup.id !== id));
  };

  return (
    <div>
      <div>
        <button
          onClick={handleShowPopups}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
        >
          Show 100 Bubbles
        </button>

        {/* Render all popups */}
        {popups.map((popup) => (
          <BubblePopup
            key={popup.id}
            message={popup.message}
            duration={popup.duration}
            onClose={() => handleClosePopup(popup.id)}
          />
        ))}
      </div>
      <button
        // onClick={() => showPopup('Hello World!')}
        onClick={() => {
          const count = 50; // number of popups
          for (let i = 0; i < count; i++) {
            const randomDelay = Math.random() * 1000; // 0–1s delay
            setTimeout(() => {
              showPopup(`Popup #${i + 1}`);
            }, randomDelay);
          }
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Show Popup
      </button>
    </div>
  );
};

export default BubblePopupDemo;
