import { useState, useEffect } from 'react';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_STORAGE_KEY = 'app_version';

export const useVersionCheck = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Fetch the version.json file with cache-busting
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const data = await response.json();
        const newVersion = data.version;

        // Get stored version from localStorage
        const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);

        if (storedVersion && storedVersion !== newVersion) {
          // New version detected!
          setUpdateAvailable(true);
        } else if (!storedVersion) {
          // First time loading, store the version
          localStorage.setItem(VERSION_STORAGE_KEY, newVersion);
        }
      } catch (error) {
        console.error('Error checking version:', error);
      }
    };

    // Check immediately on mount
    checkVersion();

    // Then check periodically
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const refreshApp = () => {
    // Clear the old version and reload
    localStorage.removeItem(VERSION_STORAGE_KEY);
    window.location.reload();
  };

  return { updateAvailable, refreshApp };
};
