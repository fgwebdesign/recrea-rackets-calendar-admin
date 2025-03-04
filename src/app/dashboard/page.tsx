'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useUsers } from '@/hooks/useUsers';
import { useQuickStats } from '@/hooks/useQuickStats';
import { useTournaments } from '@/hooks/useTournaments';
import { useSponsors } from '@/hooks/useSponsors';
import { useCourts } from '@/hooks/useCourts';
import { DashboardStats } from '@/components/Dashboard/DashboardStats';
import { UpcomingTournaments } from '@/components/Dashboard/UpcomingTournaments';
import { DateTime } from '@/components/Dashboard/DateTime';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HomeIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { ActiveCourts } from '@/components/Dashboard/ActiveCourts';


const ActiveUsers = dynamic(() => import('../../components/Dashboard/ActiveUsers'), {
  loading: () => <div className="animate-pulse bg-gray-100 h-64 rounded-xl"></div>,
  ssr: false
});

export default function Dashboard() {
  const { users, isLoading: usersLoading } = useUsers();
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { sponsors, isLoading: sponsorsLoading } = useSponsors();
  const { courts, isLoading: courtsLoading } = useCourts();
  const { stats, loading: statsLoading } = useQuickStats(users, tournaments, sponsors);

  if (usersLoading || statsLoading || tournamentsLoading || sponsorsLoading || courtsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <Header 
          title="Inicio"
          description="Visualiza las estadísticas y la información general."
          icon={<HomeIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
        />
        
        <DateTime />
        <DashboardStats stats={stats} />
        <UpcomingTournaments tournaments={tournaments} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
          <ActiveCourts courts={courts} />
          <ActiveUsers />
        </div>
      </div>
    </div>
  );
}
