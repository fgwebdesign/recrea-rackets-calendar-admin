import { useState, useEffect } from 'react';
import { League } from '@/types/league';

export function useLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeagues = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          // No mostrar error si no hay token, simplemente retornar
          setLeagues([]);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/all?page=1&pageSize=10&include=teams`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch leagues. Status:', response.status);
          throw new Error(`Failed to fetch leagues. Status: ${response.status}`);
        }
        
        const data = await response.json();
        setLeagues(Array.isArray(data) ? data : data.leagues || data.data || []);
      } catch (error) {
        console.error("Error fetching leagues:", error);
        setError(error instanceof Error ? error.message : 'Error fetching leagues');
        setLeagues([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeagues();
  }, []);

  // Return all leagues without filtering by status
  return {
    leagues,
    isLoading,
    error,
  };
} 