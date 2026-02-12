'use client';

import { useState, useEffect, useRef } from "react";
import { Building2, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VenueCard from "@/components/Venues/VenueCard";
import VenueForm from "@/components/Venues/VenueForm";
import { useVenues } from "@/hooks/useVenues";
import { Venue } from "@/types/venue";
import EmptyState from "@/components/EmptyState";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useCourts } from "@/hooks/useCourts";
import CourtCard from "@/components/Courts/CourtCard";
import SimpleAddCourtModal from "@/components/Courts/SimpleAddCourtModal";
import EditCourtModal from "@/components/Courts/EditCourtModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from '@/contexts/TranslationContext';

export default function VenuesPage() {
  const t = useTranslations('venues');
  const { venues, loading, createVenue, updateVenue, deleteVenue, refetch: refetchVenues } = useVenues({ includeCourts: true });
  const { courts, isLoading: isLoadingCourts, fetchCourts, createCourt, updateCourt, deleteCourt } = useCourts();
  const [activeTab, setActiveTab] = useState("venues");
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deleteVenueModal, setDeleteVenueModal] = useState({
    isOpen: false,
    venue: null as Venue | null,
  });
  const [isAddCourtModalOpen, setIsAddCourtModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<{ id: string; name: string; photo_url: string } | null>(null);
  const [deleteCourtModal, setDeleteCourtModal] = useState({
    isOpen: false,
    courtId: null as string | null,
    courtName: ''
  });
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>("all");
  const [newlyCreatedVenueId, setNewlyCreatedVenueId] = useState<string | null>(null);
  const hasSetInitialDefaultVenue = useRef(false);

  // Por defecto mostrar la sede destacada (is_default) en el filtro de canchas
  useEffect(() => {
    if (venues.length > 0 && !hasSetInitialDefaultVenue.current) {
      const defaultVenue = venues.find(v => v.is_default);
      if (defaultVenue) {
        setSelectedVenueFilter(defaultVenue.id);
      }
      hasSetInitialDefaultVenue.current = true;
    }
  }, [venues]);

  const handleVenueSubmit = async (data: Partial<Venue>) => {
    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, data);
        setIsVenueModalOpen(false);
        setEditingVenue(null);
        await refetchVenues();
      } else {
        // Crear nueva venue
        const newVenue = await createVenue(data);
        setIsVenueModalOpen(false);
        setEditingVenue(null);
        await refetchVenues();
        
        // Si se creó exitosamente, cambiar a la tab de courts y abrir modal de agregar court
        if (newVenue && newVenue.id) {
          setActiveTab("courts");
          // Establecer el filtro de venue a la recién creada
          setSelectedVenueFilter(newVenue.id);
          // Esperar un momento para que la tab cambie antes de abrir el modal
          setTimeout(() => {
            setIsAddCourtModalOpen(true);
            // Guardar el ID de la venue recién creada para pre-seleccionarla
            setNewlyCreatedVenueId(newVenue.id);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error submitting venue:', error);
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue(venue);
    setIsVenueModalOpen(true);
  };

  const handleDeleteVenue = async () => {
    if (deleteVenueModal.venue) {
      try {
        await deleteVenue(deleteVenueModal.venue.id);
        setDeleteVenueModal({ isOpen: false, venue: null });
      } catch (error) {
        console.error('Error deleting venue:', error);
      }
    }
  };

  const handleCourtSubmit = async (courtData: { name: string; photo: File | null; venue_id?: string }) => {
    const success = await createCourt(courtData);
    if (success) {
      setIsAddCourtModalOpen(false);
      await fetchCourts();
      await refetchVenues();
    }
  };

  const handleEditCourt = (court: { id: string; name: string; photo_url: string; venue_id?: string }) => {
    setEditingCourt(court);
  };

  const handleDeleteCourt = async () => {
    if (deleteCourtModal.courtId) {
      const success = await deleteCourt(deleteCourtModal.courtId);
      if (success) {
        setDeleteCourtModal({ isOpen: false, courtId: null, courtName: '' });
        await fetchCourts();
      }
    }
  };

  const handleEditCourtSubmit = async (courtData: { id: string; name: string; photo: File | null; venue_id?: string }) => {
    const success = await updateCourt(courtData.id, courtData);
    if (success) {
      setEditingCourt(null);
      await fetchCourts();
    }
  };

  const filteredCourts = selectedVenueFilter === "all" 
    ? courts 
    : courts.filter(court => court.venue_id === selectedVenueFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
          title={t('title')}
          icon={<Building2 className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('description')}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="venues">{t('venues')}</TabsTrigger>
            <TabsTrigger value="courts">{t('courts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="venues" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('venues')}</h2>
              <Button 
                onClick={() => {
                  setEditingVenue(null);
                  setIsVenueModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {t('newVenue')}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingVenues')}</p>
                </div>
              </div>
            ) : venues.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue, index) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    onEdit={handleEditVenue}
                    onDelete={(venue) => setDeleteVenueModal({ isOpen: true, venue })}
                    priority={index < 3} // Prioridad para las primeras 3 imágenes visibles
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="courts" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('courts')}</h2>
              <Button 
                onClick={() => setIsAddCourtModalOpen(true)}
                className="bg-[#6B8AFF] text-white hover:bg-[#5A75E6] dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {t('addCourt')}
              </Button>
            </div>

            <div className="mb-4">
              <Select value={selectedVenueFilter} onValueChange={setSelectedVenueFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={t('filterByVenue')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allVenues')}</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoadingCourts ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingCourts')}</p>
                </div>
              </div>
            ) : filteredCourts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourts.map((court, index) => (
                  <CourtCard
                    key={court.id}
                    id={court.id}
                    name={court.name}
                    photo_url={court.photo_url}
                    venue_id={court.venue_id}
                    onDelete={court => setDeleteCourtModal({
                      isOpen: true,
                      courtId: court.id,
                      courtName: court.name
                    })}
                    onEdit={handleEditCourt}
                    priority={index < 3} // Prioridad para las primeras 3 imágenes visibles
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <VenueForm
          isOpen={isVenueModalOpen}
          onClose={() => {
            setIsVenueModalOpen(false);
            setEditingVenue(null);
          }}
          onSubmit={handleVenueSubmit}
          venue={editingVenue}
        />

        <DeleteConfirmationModal
          isOpen={deleteVenueModal.isOpen}
          onClose={() => setDeleteVenueModal({ isOpen: false, venue: null })}
          onConfirm={handleDeleteVenue}
          itemName={deleteVenueModal.venue?.name || ''}
          itemType="sede"
        />

        <SimpleAddCourtModal
          isOpen={isAddCourtModalOpen}
          onClose={() => {
            setIsAddCourtModalOpen(false);
            setNewlyCreatedVenueId(null);
          }}
          onSubmit={handleCourtSubmit}
          initialVenueId={newlyCreatedVenueId || undefined}
          venues={venues.map(v => ({ id: v.id, name: v.name }))}
        />

        <DeleteConfirmationModal
          isOpen={deleteCourtModal.isOpen}
          onClose={() => setDeleteCourtModal({ isOpen: false, courtId: null, courtName: '' })}
          onConfirm={handleDeleteCourt}
          itemName={deleteCourtModal.courtName}
          itemType="cancha"
        />

        <EditCourtModal
          isOpen={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          onSubmit={handleEditCourtSubmit}
          court={editingCourt}
        />
      </div>
    </div>
  );
}

