'use client';

import { useState, useEffect } from "react";
import { ImageIcon, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import SimpleAddCourtModal from '@/components/Courts/SimpleAddCourtModal';
import CourtCard from '@/components/Courts/CourtCard';
import { useCourts } from '@/hooks/useCourts';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import EditCourtModal from '@/components/Courts/EditCourtModal';
import { useTranslations } from '@/contexts/TranslationContext';

export default function CourtsPage() {
  const t = useTranslations('courts');
  const { courts, isLoading, fetchCourts, createCourt, deleteCourt, updateCourt } = useCourts();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<{ id: string; name: string; photo_url: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    courtId: null as string | null,
    courtName: ''
  });

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleSubmit = async (courtData: { name: string; photo: File | null }) => {
    const success = await createCourt(courtData);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = (court: { id: string; name: string; photo_url: string }) => {
    setEditingCourt(court); 
  };

  const handleDelete = async () => {
    if (deleteModal.courtId) {
      const success = await deleteCourt(deleteModal.courtId);
      if (success) {
        setDeleteModal({ isOpen: false, courtId: null, courtName: '' });
      }
    }
  };

  const handleEditSubmit = async (courtData: { id: string; name: string; photo: File | null }) => {
    const success = await updateCourt(courtData.id, courtData);
    if (success) {
      setEditingCourt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
          title={t('title')}
          icon={<ImageIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('description')}
          button={
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#6B8AFF] text-white hover:bg-[#5A75E6] dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addCourt')}
            </Button>
          }
        />
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!isLoading && courts.length === 0 ? (
              <div className="col-span-full">
                <EmptyState />
              </div>
            ) : (
              courts.map((court) => (
                <CourtCard
                  key={court.id}
                  id={court.id}
                  name={court.name}
                  photo_url={court.photo_url}
                  onDelete={court => setDeleteModal({
                    isOpen: true,
                    courtId: court.id,
                    courtName: court.name
                  })}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>

        <SimpleAddCourtModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmit}
        />
        
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, courtId: null, courtName: '' })}
          onConfirm={handleDelete}
          itemName={deleteModal.courtName}
          itemType="la"
        />

        <EditCourtModal
          isOpen={!!editingCourt}
          onClose={() => setEditingCourt(null)}
          onSubmit={handleEditSubmit}
          court={editingCourt}
        />
      </div>
    </div>
  );
}
