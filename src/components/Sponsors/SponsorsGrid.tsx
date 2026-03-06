"use client";

import { useState } from "react";
import { useSponsors } from "@/hooks/useSponsors";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditSponsorModal from "./EditSponsorModal";
import { Sponsor } from "@/types/sponsor";

export default function SponsorsGrid() {
  const { sponsors, isLoading, deleteSponsor, updateSponsor } = useSponsors();
  const [sponsorToDelete, setSponsorToDelete] = useState<string | null>(null);
  const [sponsorToEdit, setSponsorToEdit] = useState<Sponsor | null>(null);

  const handleDelete = async () => {
    if (sponsorToDelete) {
      try {
        await deleteSponsor(sponsorToDelete);
      } catch (error) {
        console.error('Error deleting sponsor:', error);
      }
      setSponsorToDelete(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!sponsors.length) {
    return (
      <EmptyState message="No hay patrocinadores registrados aún" />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sponsors.map((sponsor) => (
          <div 
            key={sponsor.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 
                     border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="aspect-square relative bg-gray-50 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden 
                          max-w-[200px] mx-auto">
              <Image
                src={sponsor.logo_url}
                alt={sponsor.name}
                fill
                className="object-contain p-3"
                loading="lazy"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {sponsor.name}
              </h3>
              <div className="flex gap-1">
                <button 
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 
                           rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setSponsorToEdit(sponsor)}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 
                           rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setSponsorToDelete(sponsor.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!sponsorToDelete} onOpenChange={() => setSponsorToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El patrocinador será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSponsorToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditSponsorModal
        sponsor={sponsorToEdit}
        isOpen={!!sponsorToEdit}
        onClose={() => setSponsorToEdit(null)}
        onUpdate={updateSponsor}
      />
    </>
  );
} 