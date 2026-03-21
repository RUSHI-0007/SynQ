import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getApiUrl, getApiHeaders } from '@/lib/api-client';
import { Project } from '@hackathon/shared-types';

export function useProject(projectId: string) {
  const { getToken } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(getApiUrl(`api/projects/${projectId}`), {
        headers: getApiHeaders(token)
      });
      if (!res.ok) throw new Error(await res.text() || 'Project not found');
      const data = await res.json();
      setProject(data as Project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, getToken]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error };
}
