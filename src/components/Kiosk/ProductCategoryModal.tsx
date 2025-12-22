'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProductCategory, CreateProductCategoryData, UpdateProductCategoryData } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { AVAILABLE_ICONS, CategoryIcon } from "@/lib/categoryIcons";

interface ProductCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductCategoryData | UpdateProductCategoryData) => Promise<boolean>;
  category?: ProductCategory | null;
}

export default function ProductCategoryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  category 
}: ProductCategoryModalProps) {
  const t = useTranslations('kiosk');
  const isEditing = !!category;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    sort_order: 0,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
          icon: category.icon || '',
          color: category.color || '#3B82F6',
          sort_order: category.sort_order || 0,
          is_active: category.is_active !== false
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: '',
          color: '#3B82F6',
          sort_order: 0,
          is_active: true
        });
      }
    }
  }, [isOpen, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const success = await onSubmit(formData);
      if (success) {
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      sort_order: 0,
      is_active: true
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {isEditing ? t('categories.editCategory') : t('categories.addCategory')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {isEditing ? t('categories.editCategoryDescription') : t('categories.addCategoryDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                {t('categories.name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('categories.namePlaceholder')}
                required
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order" className="text-gray-700 dark:text-gray-300">
                {t('categories.sortOrder')}
              </Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
              {t('categories.descriptionLabel')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('categories.descriptionPlaceholder')}
              rows={3}
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                {t('categories.icon')}
              </Label>
              <div className="grid grid-cols-6 gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto">
                {AVAILABLE_ICONS.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  const isSelected = formData.icon === iconOption.value;
                  return (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.value }))}
                      className={`
                        p-3 rounded-lg border-2 transition-all hover:scale-105
                        ${isSelected 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      title={iconOption.name}
                    >
                      <IconComponent 
                        className={`w-5 h-5 mx-auto ${
                          isSelected 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {formData.icon && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Icono seleccionado:</span>
                  <div className="flex items-center gap-2">
                    <CategoryIcon 
                      iconName={formData.icon} 
                      className="w-5 h-5"
                      color={formData.color}
                    />
                    <span className="font-medium">{AVAILABLE_ICONS.find(i => i.value === formData.icon)?.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-gray-700 dark:text-gray-300">
                {t('categories.color')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-20 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_active" className="text-gray-700 dark:text-gray-300">
                {t('categories.isActive')}
              </Label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-bold"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-green-600 text-white hover:bg-green-700 font-bold"
            >
              {isSubmitting ? t('common.saving') : (isEditing ? t('common.update') : t('common.save'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

