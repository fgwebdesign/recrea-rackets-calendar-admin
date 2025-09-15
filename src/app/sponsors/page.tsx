"use client";

import { useState, useEffect } from "react";
import { ImageIcon, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import SimpleAddSponsorModal from '@/components/Sponsors/SimpleAddSponsorModal';
import SponsorCard from '@/components/Sponsors/SponsorCard';
import { useSponsors } from '@/hooks/useSponsors';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import EditSponsorModal from '@/components/Sponsors/EditSponsorModal';
import { useTranslations } from '@/contexts/TranslationContext';

export default function SponsorsPage() {
  const t = useTranslations('sponsors');
  const { sponsors, isLoading, fetchSponsors, createSponsor, deleteSponsor, updateSponsor } = useSponsors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<{ id: string; name: string; logo_url: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    sponsorId: null as string | null,
    sponsorName: ''
  });

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleSubmit = async (sponsorData: { name: string; logo: File | null }) => {
    const success = await createSponsor(sponsorData);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = (sponsor: { id: string; name: string; logo_url: string }) => {
    setEditingSponsor(sponsor); 
  };

  const handleDelete = async () => {
    if (deleteModal.sponsorId) {
      const success = await deleteSponsor(deleteModal.sponsorId);
      if (success) {
        setDeleteModal({ isOpen: false, sponsorId: null, sponsorName: '' });
      }
    }
  };

  const handleEditSubmit = async (sponsorData: { id: string; name: string; logo: File | null }) => {
    const success = await updateSponsor(sponsorData.id, sponsorData);
    if (success) {
      setEditingSponsor(null);
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
              {t('addSponsor')}
            </Button>
          }
        />
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!isLoading && sponsors.length === 0 ? (
              <div className="col-span-full">
                <EmptyState />
              </div>
            ) : (
              sponsors.map((sponsor) => (
                <SponsorCard
                  key={sponsor.id}
                  id={sponsor.id}
                  name={sponsor.name}
                  logo_url={sponsor.logo_url}
                  onDelete={sponsor => setDeleteModal({
                    isOpen: true,
                    sponsorId: sponsor.id,
                    sponsorName: sponsor.name
                  })}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>

        <SimpleAddSponsorModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmit}
        />
        
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, sponsorId: null, sponsorName: '' })}
          onConfirm={handleDelete}
          itemName={deleteModal.sponsorName}
          itemType="el"
        />

        <EditSponsorModal
          isOpen={!!editingSponsor}
          onClose={() => setEditingSponsor(null)}
          onSubmit={handleEditSubmit}
          sponsor={editingSponsor}
        />
      </div>
    </div>
  );
}

