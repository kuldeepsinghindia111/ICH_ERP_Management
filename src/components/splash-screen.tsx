import { useEffect, useState } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fading out after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Call onComplete after 2 seconds (giving 500ms for the fade transition)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src="/Imperial College Logo.avif"
        alt="College Logo"
        className="w-48 h-auto animate-pulse"
        onError={(e) => {
          // Fallback if logo.png is not found
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
