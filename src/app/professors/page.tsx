'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, PlusCircle, Clock } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import AddProfessorModal from '@/components/Professors/AddProfessorModal';
import ProfessorCard from '@/components/Professors/ProfessorCard';
import EditProfessorModal from '@/components/Professors/EditProfessorModal';
import { useProfessors } from '@/hooks/useProfessors';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { Professor } from '@/types/professor';
import { useTranslations } from '@/contexts/TranslationContext';

export default function ProfessorsPage() {
  const t = useTranslations('professors');
  const { professors, isLoading, fetchProfessors, createProfessor, deleteProfessor, updateProfessor } = useProfessors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    professorId: null as string | null,
    professorName: ''
  });

  useEffect(() => {
    fetchProfessors();
  }, []);

  const handleSubmit = async (professorData: any) => {
    const success = await createProfessor(professorData);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor); 
  };

  const handleDelete = async () => {
    if (deleteModal.professorId) {
      const success = await deleteProfessor(deleteModal.professorId);
      if (success) {
        setDeleteModal({ isOpen: false, professorId: null, professorName: '' });
      }
    }
  };

  const handleEditSubmit = async (id: string, professorData: any) => {
    const success = await updateProfessor(id, professorData);
    if (success) {
      setEditingProfessor(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
          title={t('title')}
          icon={<GraduationCap className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('description')}
          button={
            <div className="flex gap-2">
              <Link href="/professors/classes">
                <Button variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Registro de clases
                </Button>
              </Link>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                {t('addProfessor')}
              </Button>
            </div>
          }
        />
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!isLoading && professors.length === 0 ? (
              <div className="col-span-full">
                <EmptyState />
              </div>
            ) : (
              professors.map((professor, index) => (
                <ProfessorCard
                  key={professor.id}
                  professor={professor}
                  onDelete={professor => setDeleteModal({
                    isOpen: true,
                    professorId: professor.id,
                    professorName: professor.name
                  })}
                  onEdit={handleEdit}
                  priority={index < 3} // Prioridad para las primeras 3 imágenes visibles
                />
              ))
            )}
          </div>
        </div>

        <AddProfessorModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmit}
        />
        
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, professorId: null, professorName: '' })}
          onConfirm={handleDelete}
          itemName={deleteModal.professorName}
          itemType="profesor"
        />

        <EditProfessorModal
          isOpen={!!editingProfessor}
          onClose={() => setEditingProfessor(null)}
          onSubmit={handleEditSubmit}
          professor={editingProfessor}
        />
      </div>
    </div>
  );
}
