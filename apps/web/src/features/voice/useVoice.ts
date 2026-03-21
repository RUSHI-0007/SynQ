import { useState, useCallback } from 'react';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';

export function useVoice(projectId: string, clerkUserName: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    if (!projectId || !clerkUserName) {
      setError('Missing project or user context required for Voice Chat.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(getApiUrl(`api/voice/token?projectId=${projectId}&participantName=${encodeURIComponent(clerkUserName)}`), {
        headers: getApiHeaders()
      });
      
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to map Voice credentials.');
      }
      
      const data = await res.json();
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
      console.error('LiveKit Token Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, clerkUserName]);

  const disconnect = useCallback(() => {
    setToken(null);
  }, []);

  return {
    token,
    loading,
    error,
    connect: fetchToken,
    disconnect
  };
}
