import { useEffect, useState } from 'react';

export function useLiveKitToken(projectId: string) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      // Mock logic to simulate fetching a connection token on the client
      setToken(`simulated_lk_token_for_${projectId}`);
    }
    fetchToken();
  }, [projectId]);

  return { token };
}
