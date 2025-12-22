'use client';

import { useState, useEffect } from "react";
import { ListChecks, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import CategoryCard from '@/components/Categories/CategoryCard';
import AddCategoryModal from '@/components/Categories/AddCategoryModal';
import { useCategories, Category } from '@/hooks/useCategories';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { useTranslations } from '@/contexts/TranslationContext';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const { categories, isLoading, fetchCategories, createCategory, deleteCategory, updateCategory } = useCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null as string | null,
    categoryName: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (categoryData: { name: string }) => {
    const success = await createCategory(categoryData);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleDelete = async () => {
    if (deleteModal.categoryId) {
      const success = await deleteCategory(deleteModal.categoryId);
      if (success) {
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' });
      }
    }
  };

  const handleEditSubmit = async (categoryData: { name: string }) => {
    if (editingCategory) {
      const success = await updateCategory(editingCategory.id, categoryData);
      if (success) {
        setEditingCategory(null);
        await fetchCategories();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
          title={t('title')}
          icon={<ListChecks className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
          description={t('description')}
          button={
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#6B8AFF] text-white hover:bg-[#5A75E6] dark:bg-blue-600 dark:hover:bg-blue-700 font-bold"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addCategory')}
            </Button>
          }
        />
        
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!isLoading && categories.length === 0 ? (
              <div className="col-span-full">
                <EmptyState />
              </div>
            ) : (
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onDelete={category => setDeleteModal({
                    isOpen: true,
                    categoryId: category.id,
                    categoryName: category.name
                  })}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>

        <AddCategoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmit}
        />
        
        <AddCategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSubmit={handleEditSubmit}
          initialName={editingCategory?.name || ''}
          isEditing={true}
        />

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: '' })}
          onConfirm={handleDelete}
          itemName={deleteModal.categoryName}
          itemType="categoría"
        />
      </div>
    </div>
  );
} 