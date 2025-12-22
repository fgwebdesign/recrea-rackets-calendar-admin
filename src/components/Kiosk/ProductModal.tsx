'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon } from "lucide-react";
import Image from 'next/image';
import { Product, CreateProductData, UpdateProductData } from "@/types/kiosk";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useVenues } from "@/hooks/useVenues";
import { useTranslations } from '@/contexts/TranslationContext';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData | UpdateProductData, imageFile?: File | null) => Promise<{ success: boolean; productId?: string }>;
  product?: Product | null;
}

export default function ProductModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product 
}: ProductModalProps) {
  const t = useTranslations('kiosk');
  const isEditing = !!product;
  const { categories, isLoading: loadingCategories } = useProductCategories();
  const { venues, loading: loadingVenues } = useVenues({ includeCourts: false });
  
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_alert: 5,
    track_inventory: true,
    is_active: true,
    is_featured: false,
    venue_id: 'none'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          category_id: product.category_id || '',
          name: product.name || '',
          description: product.description || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          price: product.price || 0,
          cost_price: product.cost_price || 0,
          stock_quantity: product.stock_quantity || 0,
          min_stock_alert: product.min_stock_alert || 5,
          track_inventory: product.track_inventory !== false,
          is_active: product.is_active !== false,
          is_featured: product.is_featured || false,
          venue_id: product.venue_id || 'none'
        });
        setPreviewUrl(product.image_url || '');
        setImageFile(null);
      } else {
        setFormData({
          category_id: '',
          name: '',
          description: '',
          sku: '',
          barcode: '',
          price: 0,
          cost_price: 0,
          stock_quantity: 0,
          min_stock_alert: 5,
          track_inventory: true,
          is_active: true,
          is_featured: false,
          venue_id: 'none'
        });
        setPreviewUrl('');
        setImageFile(null);
      }
    }
  }, [isOpen, product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, productId: string): Promise<string | undefined> => {
    try {
      setUploadingImage(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No estás autenticado');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/kiosk/products/${productId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la imagen');
      }

      const data = await response.json();
      return data.image_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const submitData: CreateProductData | UpdateProductData = {
        ...formData,
        venue_id: formData.venue_id && formData.venue_id !== 'none' ? formData.venue_id : undefined,
        // No incluir image_url si hay un archivo nuevo, se subirá después
        image_url: isEditing && !imageFile ? previewUrl : undefined
      };

      // Primero crear/actualizar el producto
      const result = await onSubmit(submitData, imageFile);
      
      // Si hay imagen nueva y el producto fue creado/actualizado exitosamente, subir la imagen
      if (result.success && imageFile && result.productId) {
        try {
          await uploadImage(imageFile, result.productId);
        } catch (error) {
          console.error('Error uploading image after product update:', error);
          // No lanzar error, el producto ya se creó/actualizó
        }
      }
      
      if (result.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Error submitting product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      category_id: '',
      name: '',
      description: '',
      sku: '',
      barcode: '',
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock_alert: 5,
      track_inventory: true,
      is_active: true,
      is_featured: false,
      venue_id: 'none'
    });
    setPreviewUrl('');
    setImageFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-800 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {isEditing ? t('products.editProduct') : t('products.addProduct')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {isEditing ? t('products.editProductDescription') : t('products.addProductDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Imagen */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">{t('products.image')}</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              {previewUrl ? (
                <div className="relative w-full h-48 mb-2">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover rounded-md"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('products.noImage')}</p>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2"
                disabled={isSubmitting || uploadingImage}
              />
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                {t('products.name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('products.namePlaceholder')}
                required
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-gray-700 dark:text-gray-300">
                {t('products.category')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                disabled={loadingCategories || isSubmitting}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder={t('products.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
              {t('products.description')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('products.descriptionPlaceholder')}
              rows={3}
              className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Códigos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-gray-700 dark:text-gray-300">{t('products.sku')}</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder={t('products.skuPlaceholder')}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-gray-700 dark:text-gray-300">{t('products.barcode')}</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder={t('products.barcodePlaceholder')}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-700 dark:text-gray-300">
                {t('products.price')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price" className="text-gray-700 dark:text-gray-300">{t('products.costPrice')}</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Inventario */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="track_inventory"
                checked={formData.track_inventory}
                onChange={(e) => setFormData(prev => ({ ...prev, track_inventory: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="track_inventory" className="text-gray-700 dark:text-gray-300">
                {t('products.trackInventory')}
              </Label>
            </div>

            {formData.track_inventory && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity" className="text-gray-700 dark:text-gray-300">
                    {t('products.stockQuantity')}
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock_alert" className="text-gray-700 dark:text-gray-300">
                    {t('products.minStockAlert')}
                  </Label>
                  <Input
                    id="min_stock_alert"
                    type="number"
                    min="0"
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock_alert: parseInt(e.target.value) || 5 }))}
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sede */}
          <div className="space-y-2">
            <Label htmlFor="venue_id" className="text-gray-700 dark:text-gray-300">
              {t('products.venue')}
            </Label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, venue_id: value }))}
              disabled={loadingVenues || isSubmitting}
            >
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder={t('products.selectVenue')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('products.allVenues')}</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opciones */}
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_featured" className="text-gray-700 dark:text-gray-300">
                {t('products.isFeatured')}
              </Label>
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
                  {t('products.isActive')}
                </Label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || uploadingImage}
              className="border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadingImage || !formData.name.trim() || !formData.category_id}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting || uploadingImage 
                ? t('common.saving') 
                : (isEditing ? t('common.update') : t('common.save'))
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

