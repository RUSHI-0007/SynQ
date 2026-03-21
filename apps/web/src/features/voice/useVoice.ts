import { useState, useCallback } from 'react';

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
      // In production, ensure this points to the right backend URL using env vars
      const res = await fetch(`http://localhost:4000/api/voice/token?projectId=${projectId}&participantName=${encodeURIComponent(clerkUserName)}`);
      
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
