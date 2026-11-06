import { useEffect, useRef, useState } from "react";

export const useWakeLock = (enabled = false) => {
  const wakeLockRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        setIsLocked(true);
        
        wakeLockRef.current.addEventListener("release", () => {
          setIsLocked(false);
        });
      }
    } catch (err) {
      console.warn(`Wake Lock error: ${err.name}, ${err.message}`);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire lock if user switches tabs and comes back
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && enabled) {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled]);

  return { isLocked, requestWakeLock, releaseWakeLock };
};