// Individual exports
export const riseTimeMs = 500; // bubble rises in 0.5s
export const visibleTimeMs = 100; // bubble stays visible for 1.5s
export const fadeTimeMs = 500; // bubble fades out in 0.5s

// Derived value
export const totalDurationMs = (visibleTimeMs + riseTimeMs + fadeTimeMs) * 1000;

// Optional: export them as a single object too
export const popupTiming = {
  visibleTimeMs,
  riseTimeMs,
  fadeTimeMs,
  totalDurationMs,
};



// MyNote : Animation 1 ========================================================================================
// /* 🌟 POSITION ANIMATION */
// @keyframes bubbleRise {
//   0% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-start-offset) + var(--popup-y-offset))) scale(0.9);
//   }

//   60% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-rise-offset) + var(--popup-y-offset))) scale(1);
//   }

//   100% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-end-offset) + var(--popup-y-offset))) scale(0.98);
//   }
// }

// /* 🌟 OPACITY ANIMATION */
// @keyframes bubbleFade {
//   0% {
//     opacity: var(--popup-opacity-start);
//   }

//   /* 10% {
//     opacity: var(--popup-opacity-start);
//   } */

//   50% {
//     opacity: var(--popup-opacity-visible);
//   }

//   100% {
//     opacity: var(--popup-opacity-end);
//   }
// }

// MyNote : Animation 2 ========================================================================================
// /* 🌟 POSITION ANIMATION */
// @keyframes bubbleRise {
//   0% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-start-offset) + var(--popup-y-offset))) scale(0.9);
//   }

//   20% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-rise-offset) + var(--popup-y-offset))) scale(1);
//   }

//   80% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-rise-offset) + var(--popup-y-offset))) scale(1);
//   }

//   100% {
//     transform: translate(var(--popup-x-offset), calc(var(--popup-end-offset) + var(--popup-y-offset))) scale(0.98);
//   }
// }

// /* 🌟 OPACITY ANIMATION */
// @keyframes bubbleFade {
//   0% {
//     opacity: var(--popup-opacity-start);
//   }

//   20% {
//     opacity: var(--popup-opacity-visible);
//   }

//   80% {
//     opacity: var(--popup-opacity-visible); /* stay fully visible */
//   }

//   100% {
//     opacity: var(--popup-opacity-end);
//   }
// }
