import React, { useState } from 'react';
import BubblePopup from './BubblePopup';

interface PopupItem {
  id: number;
  message: string;
  rollNumber?: string;
  gender?: string;
}

let addPopupFn: ((message: string, rollNumber?: string, gender?: string) => void) | null = null;
      // showPopup(student.name, student.rollNumber, student.gender);
export const showPopup = (message: string, rollNumber?: string, gender?: string) => {
  addPopupFn?.(message, rollNumber, gender);
};

export const PopupManager: React.FC = () => {
  const [popups, setPopups] = useState<PopupItem[]>([]);

  // Attach function so showPopup() can add popups globally
  addPopupFn = (message: string, rollNumber?: string, gender?: string) => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev, { id, message, rollNumber, gender }]);
  };

  const handleClose = (id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <>
      {popups.map((popup) => (
        <BubblePopup
          key={popup.id}
          message={popup.message}
          rollNumber={popup.rollNumber}
          gender={popup.gender}
          onClose={() => handleClose(popup.id)}
        />
      ))}
    </>
  );
};
