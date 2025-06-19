import { useState, useEffect, useCallback } from 'react';
import { STT_CONFIG } from '../constants/audioConfig';

export interface RestartCallbacks {
  onRestart: () => void;
  onMaxAttemptsReached: () => void;
}

export function useRestartManager(callbacks: RestartCallbacks) {
  const [isStreamError, setIsStreamError] = useState<boolean>(false);
  const [restartAttempts, setRestartAttempts] = useState<number>(0);

  const handleStreamError = useCallback((error: string) => {
    if (error?.includes("Exceeded maximum allowed stream duration")) {
      setIsStreamError(true);
      setRestartAttempts(prev => prev + 1);
    }
  }, []);

  const handleConnectionError = useCallback(() => {
    setIsStreamError(true);
    setRestartAttempts(prev => prev + 1);
  }, []);

  const resetErrorState = useCallback(() => {
    setIsStreamError(false);
    setRestartAttempts(0);
  }, []);

  useEffect(() => {
    if (isStreamError && restartAttempts < STT_CONFIG.maxRestartAttempts) {
      console.log(`Attempting restart (${restartAttempts}/${STT_CONFIG.maxRestartAttempts})`);
      
      const timer = setTimeout(() => {
        callbacks.onRestart();
        setIsStreamError(false);
      }, STT_CONFIG.restartDelay);
      
      return () => clearTimeout(timer);
    } else if (isStreamError && restartAttempts >= STT_CONFIG.maxRestartAttempts) {
      console.error("Maximum restart attempts reached");
      callbacks.onMaxAttemptsReached();
    }
  }, [isStreamError, restartAttempts, callbacks]);

  return {
    isStreamError,
    restartAttempts,
    handleStreamError,
    handleConnectionError,
    resetErrorState
  };
} 