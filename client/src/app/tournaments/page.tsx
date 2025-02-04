import TournamentList from './TournamentList';
import { PlusCircle, TrophyIcon } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';

export default async function TournamentsPage() {
  return (
    <div className="p-8">
      <div className="max-w-[1500px] mx-auto">
        <Header 
          title="Torneos"
          icon={<TrophyIcon className="w-6 h-6" />}
          description="Administra y visualiza todos los torneos."
          button={
            <Link 
              href="/tournaments/create" 
              className="bg-[#6B8AFF] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#5A75E6] transition-colors duration-300 flex items-center"
            >
              <PlusCircle className="mr-2" size={20} />
              Crear Torneo
            </Link>
          }
        />
        
        <div className="space-y-8">
          <TournamentList />
        </div>
      </div>
    </div>
  );
}

