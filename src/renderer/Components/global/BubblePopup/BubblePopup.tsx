import React, { useEffect, useState, useRef } from 'react';
import './BubblePopup.css';
import { popupTiming } from './PopupConfig';
import { getAvatarByGenderAndRoll } from '../../../assets/Images/ChildrenImages/Children';
import { Images } from '../../../assets/images';
interface BubblePopupProps {
  onClose?: () => void;
  message: string;
  rollNumber?: string;
  gender?: string;
}

const BubblePopup: React.FC<BubblePopupProps> = ({
  onClose,
  message,
  rollNumber,
  gender,
}) => {
  // const randomX = useRef(Math.random() * 1600 - 800); // -500px to +500px
  // const randomY = useRef(Math.random() * 100 - 50); // -50px to +50px offset (vertical randomness)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track screen width dynamically
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // // Random horizontal offset relative to screen width
  // const randomX = useRef(Math.random() * windowWidth - windowWidth / 2);
  // const randomY = useRef(Math.random() * 100 - 50); // -50px to +50px

  const maxOffsetX = windowWidth / 2 - 100; // avoid going off screen
  const randomX = useRef(Math.random() * 2 * maxOffsetX - maxOffsetX);
  const maxOffsetY = 40;
  const randomY = useRef(Math.random() * 2 * maxOffsetY - maxOffsetY);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 500);
    }, popupTiming.totalDurationMs);
    return () => clearTimeout(timer);
  }, [popupTiming.totalDurationMs, onClose]);

  // Handler for animation end
  const handleAnimationEnd = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div className="bubble-popup-container">
      <div
        className="bubble-popup flex flex-col items-center rounded-3xl scale-110"
        style={
          {
            '--popup-x-offset': `${randomX.current}px`,
            '--popup-y-offset': `${randomY.current}px`,
            '--popup-rise-time': `${popupTiming.riseTimeMs}ms`,
            '--popup-visible-time': `${popupTiming.visibleTimeMs}ms`,
            '--popup-fade-time': `${popupTiming.fadeTimeMs}ms`,
          } as React.CSSProperties
        }
        onAnimationEnd={handleAnimationEnd} // 🎯 remove when animation completes
      >
        {(gender && rollNumber) && (
          <div className=" flex justify-center items-center overflow-hidden rounded-xl p-1">
            <img
              src={
                getAvatarByGenderAndRoll(gender, rollNumber) ||
                Images.defaultChild
              }
              alt="Student Avatar"
              className="w-full h-14 object-contain"
            />
          </div>
        )}
        {message}
      </div>
    </div>
  );
};

export default BubblePopup;
