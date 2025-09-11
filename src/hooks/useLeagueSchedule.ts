import { useState, useEffect } from 'react';

interface Match {
  id: string;
  category_id: string;
  category_name: string;
  team1: string;
  team2: string;
  match_date: string;
  court: string;
  status: "SCHEDULED" | "COMPLETED" | "WALKOVER";
  team1_sets1_won: number;
  team1_sets2_won: number;
  team2_sets1_won: number;
  team2_sets2_won: number;
}

export function useLeagueSchedule(leagueId?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Si no hay liga seleccionada, simplemente retornamos un array vacío
        if (!leagueId) {
          setMatches([]);
          return;
        }
        
        console.log('Fetching matches with leagueId:', leagueId);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const url = `${baseUrl}/leagues/matches/round/${leagueId}`;
        console.log('Fetching from URL:', url);

        const token = localStorage.getItem('adminToken');
        if (!token) {
          // No mostrar error si no hay token, simplemente retornar
          setMatches([]);
          return;
        }

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Response error:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(
            errorData?.message || 
            `Error al cargar los partidos: ${response.status} ${response.statusText}`
          );
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data) {
          throw new Error('No se recibieron datos del servidor');
        }

        const pendingMatches = Array.isArray(data.pending) ? data.pending : [];
        
        const scheduledMatches = pendingMatches
          .filter((match: Match) => match.status === "SCHEDULED")
          .sort((a: Match, b: Match) => 
            new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
          );
        
        console.log('Scheduled matches:', scheduledMatches);
        setMatches(scheduledMatches);
      } catch (err) {
        console.error('Error in fetchMatches:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [leagueId]);

  // Efecto para filtrar los partidos cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(match => match.category_id === selectedCategory);
      setFilteredMatches(filtered);
    }
  }, [selectedCategory, matches]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: new Intl.DateTimeFormat('es', {  
        hour: '2-digit',
        minute: '2-digit'
      }).format(date),
      date: new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }).format(date)
    };
  };

  return {
    matches,
    filteredMatches,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    formatDateTime
  };
} 