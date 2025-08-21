import { useState, useEffect, useRef } from 'react';

const SESSION_KEY = 'travelify_session_id';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Try to get existing session from localStorage
    const existingSessionId = localStorage.getItem(SESSION_KEY);
    
    if (existingSessionId) {
      setSessionId(existingSessionId);
      console.log('[useSession] Using existing session:', existingSessionId);
    } else {
      // Session will be created by the server on first API call
      console.log('[useSession] No existing session, will be created by server');
    }
  }, []);

  // Update localStorage whenever sessionId changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_KEY, sessionId);
    }
  }, [sessionId]);

  const updateSessionFromResponse = (response: Response) => {
    const newSessionId = response.headers.get('X-Session-Id');
    if (newSessionId && newSessionId !== sessionId) {
      setSessionId(newSessionId);
      console.log('[useSession] Session updated from server:', newSessionId);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    console.log('[useSession] Session cleared');
  };

  return {
    sessionId,
    updateSessionFromResponse,
    clearSession
  };
}