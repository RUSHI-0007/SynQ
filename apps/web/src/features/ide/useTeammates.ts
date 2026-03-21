import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface Teammate {
  id: string;
  name: string;
  avatarUrl: string;
  role: 'owner' | 'member';
}

export function useTeammates(projectId: string) {
  const { getToken } = useAuth();
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTeammates() {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const token = await getToken();
        const res = await fetch(`http://localhost:4000/api/projects/${projectId}/teammates`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch teammates');
        }

        const data = await res.json();
        if (isMounted) {
          setTeammates(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[useTeammates] Failed to load real data', err);
          setTeammates([]); // Strictly empty array on error, no fake users
          setError(err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchTeammates();

    return () => {
      isMounted = false;
    };
  }, [projectId, getToken]);

  return { teammates, isLoading, error };
}
