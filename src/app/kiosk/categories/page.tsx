'use client';

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import ProductCategoryCard from "@/components/Kiosk/ProductCategoryCard";
import ProductCategoryModal from "@/components/Kiosk/ProductCategoryModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useProductCategories } from "@/hooks/useProductCategories";
import { ProductCategory } from "@/types/kiosk";
import EmptyState from "@/components/EmptyState";
import { useTranslations } from '@/contexts/TranslationContext';

export default function ProductCategoriesPage() {
  const t = useTranslations('kiosk');
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, fetchCategories } = useProductCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    category: null as ProductCategory | null
  });

  const handleSubmit = async (data: any): Promise<boolean> => {
    try {
      if (editingCategory) {
        const success = await updateCategory(editingCategory.id, data);
        if (success) {
          setIsModalOpen(false);
          setEditingCategory(null);
          await fetchCategories();
        }
        return success;
      } else {
        const success = await createCategory(data);
        if (success) {
          setIsModalOpen(false);
          setEditingCategory(null);
          await fetchCategories();
        }
        return success;
      }
    } catch (error) {
      console.error('Error submitting category:', error);
      return false;
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteModal.category) {
      const success = await deleteCategory(deleteModal.category.id);
      if (success) {
        setDeleteModal({ isOpen: false, category: null });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('categories.title')}
        description={t('categories.description')}
        icon={<PlusCircle className="w-6 h-6" />}
      />

      <div className="mt-6 flex justify-end mb-6">
        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="bg-green-600 text-white hover:bg-green-700 font-bold"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('categories.addCategory')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('categories.noCategories')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('categories.noCategoriesDescription')}
          </p>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="bg-green-600 text-white hover:bg-green-700 font-bold"
          >
            {t('categories.addCategory')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <ProductCategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={(cat) => setDeleteModal({ isOpen: true, category: cat })}
            />
          ))}
        </div>
      )}

      <ProductCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
        category={editingCategory}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, category: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.category?.name || ''}
        itemType="categoría"
      />
    </div>
  );
}

