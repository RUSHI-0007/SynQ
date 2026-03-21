import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Project, FrameworkTemplate, ContainerConfig } from '@hackathon/shared-types';

export function useProjects() {
  const { getToken, userId, orgId } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      // Use active organization ID if one exists, otherwise user ID
      const scopeId = orgId || userId; 
      
      const res = await fetch(`http://localhost:4000/api/projects?scopeId=${scopeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error(await res.text() || 'Failed to fetch projects');
      const data = await res.json();
      setProjects(data as Project[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch Projects Error:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, userId, orgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, templateId: FrameworkTemplate): Promise<{ project: Project, container: ContainerConfig }> => {
    setError(null);
    try {
      const token = await getToken();
      const scopeId = orgId || userId;
      
      if (!scopeId) throw new Error("Authentication required");

      const res = await fetch('http://localhost:4000/api/projects/scaffold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, templateId, scopeId })
      });

      if (!res.ok) throw new Error(await res.text() || 'Failed to scaffold project Container');
      
      const data = await res.json();
      
      // Update local state with new project
      if (data.project) {
        setProjects(prev => [data.project, ...prev]);
      }
      
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Create Project Error:', err);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    refresh: fetchProjects
  };
}
