'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Plus, Trash2, DollarSign, Package, AlertTriangle, Building2, Tag, Star, CheckCircle2, XCircle, Sparkles, Layers } from "lucide-react";
import Image from 'next/image';
import { Product, CreateProductData, UpdateProductData, ProductSize } from "@/types/kiosk";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useVenues } from "@/hooks/useVenues";
import { useKioskVenue } from "@/contexts/KioskVenueContext";
import { useTranslations } from '@/contexts/TranslationContext';
import { CategoryIcon } from "@/lib/categoryIcons";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData | UpdateProductData, imageFile?: File | null) => Promise<{ success: boolean; productId?: string }>;
  product?: Product | null;
  onProductUpdated?: () => void; // Callback para refrescar la lista después de subir imagen
}

export default function ProductModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product,
  onProductUpdated
}: ProductModalProps) {
  const t = useTranslations('kiosk');
  const isEditing = !!product;
  const { categories, isLoading: loadingCategories } = useProductCategories();
  const { venues, loading: loadingVenues } = useVenues({ includeCourts: false });
  const { selectedVenueId } = useKioskVenue();
  
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
    venue_id: selectedVenueId || 'none'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [sizeType, setSizeType] = useState<'clothing' | 'shoes'>('clothing');
  const [hasVariants, setHasVariants] = useState(false);
  const [attributes, setAttributes] = useState<Array<{ name: string; values: string[]; display_order: number }>>([]);
  const [variants, setVariants] = useState<Array<{
    sku?: string;
    name?: string;
    price?: number;
    cost_price?: number;
    stock_quantity: number;
    image_url?: string;
    is_active?: boolean;
    attribute_values: Record<string, string>;
  }>>([]);

  // Detectar si la categoría es Indumentaria
  const isClothingCategory = formData.category_id && categories.find(c => c.id === formData.category_id)?.name?.toLowerCase() === 'indumentaria';

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
          venue_id: product.venue_id || selectedVenueId || 'none'
        });
        setPreviewUrl(product.image_url || '');
        setImageFile(null);
        // Cargar talles si existen
        if (product.sizes && product.sizes.length > 0) {
          setSizes(product.sizes);
          setSizeType(product.sizes[0].size_type || 'clothing');
        } else {
          setSizes([]);
          setSizeType('clothing');
        }
        // Cargar variantes si existen
        if (product.attributes && product.attributes.length > 0 && product.variants && product.variants.length > 0) {
          setHasVariants(true);
          setAttributes(product.attributes.map(attr => ({
            name: attr.name,
            values: attr.values?.map(v => typeof v === 'string' ? v : v.value) || [],
            display_order: attr.display_order || 0
          })));
          setVariants(product.variants.map(v => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            cost_price: v.cost_price,
            stock_quantity: v.stock_quantity,
            image_url: v.image_url,
            is_active: v.is_active !== false,
            attribute_values: v.attributes?.reduce((acc, attr) => {
              acc[attr.attribute_name] = attr.value;
              return acc;
            }, {} as Record<string, string>) || {}
          })));
        } else {
          setHasVariants(false);
          setAttributes([]);
          setVariants([]);
        }
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
          venue_id: selectedVenueId || 'none'
        });
        setPreviewUrl('');
        setImageFile(null);
        setSizes([]);
        setSizeType('clothing');
        setHasVariants(false);
        setAttributes([]);
        setVariants([]);
      }
    }
  }, [isOpen, product, categories, selectedVenueId]);

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
      
      // Validar que venue_id esté presente al crear
      if (!isEditing && (!formData.venue_id || formData.venue_id === 'none')) {
        alert('Debes seleccionar una sede para crear el producto');
        setIsSubmitting(false);
        return;
      }
      
      const submitData: CreateProductData | UpdateProductData = {
        ...formData,
        venue_id: formData.venue_id && formData.venue_id !== 'none' ? formData.venue_id : (selectedVenueId || undefined),
        // No incluir image_url si hay un archivo nuevo, se subirá después
        image_url: isEditing && !imageFile ? previewUrl : undefined,
        // Incluir talles si la categoría es Indumentaria
        sizes: isClothingCategory && sizes.length > 0 ? sizes.map(s => ({
          size: s.size,
          size_type: s.size_type,
          stock_quantity: s.stock_quantity
        })) : undefined,
        // Incluir atributos y variantes si están habilitados
        attributes: hasVariants && attributes.length > 0 ? attributes : undefined,
        variants: hasVariants && variants.length > 0 ? variants : undefined
      };
      
      // Asegurar que venue_id esté presente
      if (!submitData.venue_id) {
        alert('venue_id es requerido para crear un producto');
        setIsSubmitting(false);
        return;
      }

      // Primero crear/actualizar el producto
      const result = await onSubmit(submitData, imageFile);
      
      if (result.success) {
        // Si hay imagen nueva, subirla antes de cerrar
        if (imageFile && result.productId) {
          try {
            await uploadImage(imageFile, result.productId);
          } catch (error) {
            console.error('Error uploading image after product update:', error);
            // No lanzar error, el producto ya se creó/actualizó
          }
        }
        
        // Cerrar modal y refrescar (una sola vez, después de todo)
        handleClose();
        
        // Refrescar la lista de productos para obtener datos actualizados del backend (variantes, etc.)
        // Esto se hace una sola vez, después de cerrar el modal
        if (onProductUpdated) {
          onProductUpdated();
        }
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
    setSizes([]);
    setSizeType('clothing');
    setHasVariants(false);
    setAttributes([]);
    setVariants([]);
    onClose();
  };

  // Funciones para manejar talles
  const addSize = () => {
    const newSize: ProductSize = {
      size: '',
      size_type: sizeType,
      stock_quantity: 0
    };
    setSizes([...sizes, newSize]);
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    const updatedSizes = [...sizes];
    updatedSizes[index] = { ...updatedSizes[index], [field]: value };
    setSizes(updatedSizes);
  };

  // Opciones de talles según el tipo
  const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const shoeSizes = Array.from({ length: 20 }, (_, i) => (36 + i).toString()); // 36-55

  const availableSizes = sizeType === 'clothing' ? clothingSizes : shoeSizes;

  // Funciones para manejar atributos y variantes
  const addAttribute = () => {
    setAttributes([...attributes, { name: '', values: [], display_order: attributes.length }]);
  };

  const removeAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
    // Limpiar variantes si se eliminaron atributos
    if (variants.length > 0) {
      setVariants([]);
    }
  };

  const updateAttributeName = (index: number, name: string) => {
    const updated = [...attributes];
    updated[index].name = name;
    setAttributes(updated);
    // Limpiar variantes si cambia el nombre
    if (variants.length > 0) {
      setVariants([]);
    }
  };

  const addAttributeValue = (attrIndex: number) => {
    const updated = [...attributes];
    updated[attrIndex].values.push('');
    setAttributes(updated);
  };

  const updateAttributeValue = (attrIndex: number, valueIndex: number, value: string) => {
    const updated = [...attributes];
    updated[attrIndex].values[valueIndex] = value;
    setAttributes(updated);
    // Limpiar variantes si cambia un valor
    if (variants.length > 0) {
      setVariants([]);
    }
  };

  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    const updated = [...attributes];
    updated[attrIndex].values.splice(valueIndex, 1);
    setAttributes(updated);
    // Limpiar variantes si se eliminó un valor
    if (variants.length > 0) {
      setVariants([]);
    }
  };

  // Generar todas las combinaciones posibles de variantes
  const generateVariants = () => {
    // Validar que todos los atributos tengan nombre y al menos un valor
    const invalidAttributes = attributes.filter(attr => !attr.name.trim() || attr.values.length === 0 || attr.values.some(v => !v.trim()));
    if (invalidAttributes.length > 0) {
      alert('Por favor completa todos los atributos con nombre y al menos un valor');
      return;
    }

    // Generar combinaciones cartesianas
    const combinations: Record<string, string>[] = [];
    
    function generateCombinations(index: number, current: Record<string, string>) {
      if (index === attributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attr = attributes[index];
      for (const value of attr.values) {
        if (value.trim()) {
          generateCombinations(index + 1, { ...current, [attr.name]: value.trim() });
        }
      }
    }

    generateCombinations(0, {});

    // Crear variantes desde las combinaciones
    const baseProductName = formData.name || 'Producto';
    const newVariants = combinations.map(combo => {
      const variantName = Object.values(combo).join(' ');
      const skuBase = formData.sku || baseProductName.replace(/\s+/g, '-').toUpperCase();
      const skuSuffix = Object.values(combo).map(v => v.substring(0, 3).toUpperCase()).join('-');
      
      return {
        sku: `${skuBase}-${skuSuffix}`,
        name: `${baseProductName} ${variantName}`,
        price: formData.price || undefined,
        cost_price: formData.cost_price || 0,
        stock_quantity: 0,
        is_active: true,
        attribute_values: combo
      };
    });

    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: string, value: string | number | boolean | undefined) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 max-w-6xl max-h-[90vh] overflow-y-auto z-50 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <DialogHeader className="pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isEditing ? t('products.editProduct') : t('products.addProduct')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
            {isEditing ? t('products.editProductDescription') : t('products.addProductDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle de Estado Activo/Inactivo - Arriba del todo */}
          {isEditing && (
            <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              formData.is_active 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-md' 
                : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl shadow-sm ${
                  formData.is_active 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {formData.is_active ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <Label htmlFor="is_active" className="text-base font-bold text-gray-900 dark:text-white cursor-pointer">
                    {t('products.isActive')}
                  </Label>
                  <p className={`text-sm ${formData.is_active ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {formData.is_active ? 'El producto está activo y visible' : 'El producto está inactivo y oculto'}
                  </p>
                </div>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          )}
          
          {/* Layout horizontal: Imagen a la izquierda, Información básica a la derecha */}
          <div className="grid grid-cols-3 gap-6">
            {/* Imagen - Columna izquierda */}
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t('products.image')}
              </Label>
              <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                {previewUrl ? (
                  <div className="relative w-full h-48 mb-3 rounded-md overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                      priority
                      quality={90}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 mb-3">
                    <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('products.noImage')}</p>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isSubmitting || uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isSubmitting || uploadingImage}
                    className="w-full border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold rounded-lg transition-all hover:shadow-md"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {previewUrl ? t('products.changeImage') : t('products.selectImage')}
                  </Button>
                </label>
              </div>
            </div>

            {/* Información básica - Columnas derechas */}
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-semibold">
                    {t('products.name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('products.namePlaceholder')}
                    required
                    className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-gray-700 dark:text-gray-300 font-semibold">
                    {t('products.category')} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    disabled={loadingCategories || isSubmitting}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg">
                      <SelectValue placeholder={t('products.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent position="item-aligned" className="z-[100]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <CategoryIcon 
                              iconName={cat.icon} 
                              categoryName={cat.name}
                              className="w-4 h-4"
                              color={cat.color}
                            />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-semibold">
                  {t('products.descriptionLabel')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('products.descriptionPlaceholder')}
                  rows={5}
                  className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Códigos y Precios en una sola fila horizontal */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                {t('products.sku')}
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder={t('products.skuPlaceholder')}
                className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {t('products.barcode')}
              </Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder={t('products.barcodePlaceholder')}
                className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                className="bg-white dark:bg-gray-700 border-2 border-green-200 dark:border-green-700 text-gray-900 dark:text-gray-100 focus:border-green-500 dark:focus:border-green-500 rounded-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price" className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                {t('products.costPrice')}
              </Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                className="bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-700 text-gray-900 dark:text-gray-100 focus:border-orange-500 dark:focus:border-orange-500 rounded-lg"
              />
            </div>
          </div>

          {/* Inventario, Sede y Opciones en layout horizontal */}
          <div className="grid grid-cols-3 gap-4 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            {/* Inventario */}
            <div className="space-y-4">
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="track_inventory" className="text-sm font-bold text-blue-900 dark:text-blue-100 cursor-pointer flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t('products.trackInventory')}
                    </Label>
                    <Switch
                      id="track_inventory"
                      checked={formData.track_inventory}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, track_inventory: checked }))}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {formData.track_inventory && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('products.stockQuantity')}
                          {isClothingCategory && sizes.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              (Calculado automáticamente)
                            </span>
                          )}
                        </Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          min="0"
                          value={isClothingCategory && sizes.length > 0 
                            ? sizes.reduce((sum, size) => sum + (size.stock_quantity || 0), 0)
                            : formData.stock_quantity
                          }
                          onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                          disabled={!!(isClothingCategory && sizes.length > 0)}
                          className="bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                        />
                        {isClothingCategory && sizes.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            El stock total se calcula automáticamente sumando el stock de todos los talles
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stock_alert_enabled" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            Alerta de Stock Mínimo
                          </Label>
                          <Switch
                            id="stock_alert_enabled"
                            checked={formData.min_stock_alert > 0}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              min_stock_alert: checked ? 5 : 0 
                            }))}
                            className="data-[state=checked]:bg-orange-600"
                          />
                        </div>
                        {formData.min_stock_alert > 0 && (
                          <Input
                            id="min_stock_alert"
                            type="number"
                            min="1"
                            value={formData.min_stock_alert}
                            onChange={(e) => setFormData(prev => ({ ...prev, min_stock_alert: parseInt(e.target.value) || 5 }))}
                            className="bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-700 text-gray-900 dark:text-gray-100 focus:border-orange-500 dark:focus:border-orange-500 rounded-lg"
                            placeholder="Cantidad mínima"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sede */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-md">
              <CardContent className="pt-4">
                <Label htmlFor="venue_id" className="text-sm font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3 block">
                  <Building2 className="w-4 h-4" />
                  {t('products.venue')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.venue_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, venue_id: value }))}
                  disabled={loadingVenues || isSubmitting}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-2 border-purple-200 dark:border-purple-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg">
                    <SelectValue placeholder={t('products.selectVenue')} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned" className="z-[100]">
                    {venues.filter(v => v.is_active).map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.venue_id || formData.venue_id === 'none' ? (
                  <p className="text-xs text-red-500 mt-2">{t('products.venueRequired')}</p>
                ) : null}
              </CardContent>
            </Card>

            {/* Opciones */}
            <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured" className="text-sm font-bold text-yellow-900 dark:text-yellow-100 cursor-pointer flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {t('products.isFeatured')}
                  </Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    className="data-[state=checked]:bg-yellow-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección de Talles para Indumentaria */}
          {isClothingCategory && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Talles del Producto
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Agrega los talles disponibles y el stock de cada uno
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-700 dark:text-gray-300">Tipo:</Label>
                    <Select value={sizeType} onValueChange={(value: 'clothing' | 'shoes') => {
                      setSizeType(value);
                      // Actualizar el tipo de todos los talles existentes
                      setSizes(sizes.map(s => ({ ...s, size_type: value })));
                    }}>
                      <SelectTrigger className="w-[140px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Ropa</SelectItem>
                        <SelectItem value="shoes">Zapatillas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={addSize}
                    variant="outline"
                    className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Talle
                  </Button>
                </div>
              </div>

              {sizes.length > 0 && (
                <div className="space-y-3">
                  {sizes.map((size, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-1">
                        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Talle</Label>
                        <Select
                          value={size.size}
                          onValueChange={(value) => updateSize(index, 'size', value)}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                            <SelectValue placeholder="Seleccionar talle" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSizes.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Stock</Label>
                        <Input
                          type="number"
                          min="0"
                          value={size.stock_quantity}
                          onChange={(e) => updateSize(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeSize(index)}
                        variant="ghost"
                        size="icon"
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 mt-6"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {sizes.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-sm">No hay talles agregados. Haz clic en &quot;Agregar Talle&quot; para comenzar.</p>
                </div>
              )}
            </div>
          )}

          {/* Sección de Variantes de Productos */}
          {!isClothingCategory && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="has_variants" className="text-base font-bold text-indigo-900 dark:text-indigo-100 cursor-pointer flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Usar Variantes de Producto
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Crea variantes con atributos (ej: Color: Azul, Rojo, Verde)
                      </p>
                    </div>
                    <Switch
                      id="has_variants"
                      checked={hasVariants}
                      onCheckedChange={(checked) => {
                        setHasVariants(checked);
                        if (!checked) {
                          setAttributes([]);
                          setVariants([]);
                        }
                      }}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </div>

                  {hasVariants && (
                    <div className="space-y-6 mt-6">
                      {/* Gestión de Atributos */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              Atributos del Producto
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Define atributos y sus valores (ej: Color, Sabor, Tamaño)
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={addAttribute}
                            variant="outline"
                            className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Atributo
                          </Button>
                        </div>

                        {attributes.length > 0 && (
                          <div className="space-y-4">
                            {attributes.map((attr, attrIndex) => (
                              <div key={attrIndex} className="p-4 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                                      Nombre del Atributo
                                    </Label>
                                    <Input
                                      value={attr.name}
                                      onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                                      placeholder="Ej: Color, Sabor, Tamaño"
                                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => removeAttribute(attrIndex)}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                      Valores
                                    </Label>
                                    <Button
                                      type="button"
                                      onClick={() => addAttributeValue(attrIndex)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-indigo-600 dark:text-indigo-400"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Agregar Valor
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {attr.values.map((value, valueIndex) => (
                                      <div key={valueIndex} className="flex items-center gap-2">
                                        <Input
                                          value={value}
                                          onChange={(e) => updateAttributeValue(attrIndex, valueIndex, e.target.value)}
                                          placeholder="Ej: Azul, Rojo"
                                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                        />
                                        <Button
                                          type="button"
                                          onClick={() => removeAttributeValue(attrIndex, valueIndex)}
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-600 dark:text-red-400 h-9 w-9"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {attributes.length > 0 && variants.length === 0 && (
                          <Button
                            type="button"
                            onClick={generateVariants}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generar Variantes Automáticamente
                          </Button>
                        )}
                      </div>

                      {/* Lista de Variantes Generadas */}
                      {variants.length > 0 && (
                        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                          <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            Variantes Generadas ({variants.length})
                          </Label>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {variants.map((variant, variantIndex) => (
                              <div key={variantIndex} className="p-4 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                      {variant.name || Object.values(variant.attribute_values).join(' ')}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {Object.entries(variant.attribute_values).map(([key, value]) => (
                                        <span key={key} className="mr-2">
                                          <strong>{key}:</strong> {value}
                                        </span>
                                      ))}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => removeVariant(variantIndex)}
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-xs text-gray-600 dark:text-gray-400">SKU</Label>
                                    <Input
                                      value={variant.sku || ''}
                                      onChange={(e) => updateVariant(variantIndex, 'sku', e.target.value)}
                                      placeholder="SKU único"
                                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600 dark:text-gray-400">Precio (opcional)</Label>
                                    <Input
                                      type="number"
                                      value={variant.price || ''}
                                      onChange={(e) => updateVariant(variantIndex, 'price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                      placeholder={`${formData.price || 0}`}
                                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600 dark:text-gray-400">Costo</Label>
                                    <Input
                                      type="number"
                                      value={variant.cost_price || 0}
                                      onChange={(e) => updateVariant(variantIndex, 'cost_price', parseFloat(e.target.value) || 0)}
                                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600 dark:text-gray-400">Stock</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={variant.stock_quantity}
                                      onChange={(e) => updateVariant(variantIndex, 'stock_quantity', parseInt(e.target.value) || 0)}
                                      className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {attributes.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Agrega atributos y valores, luego genera las variantes automáticamente</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || uploadingImage}
              className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold px-6 py-2 rounded-lg transition-all"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadingImage || !formData.name.trim() || !formData.category_id || !formData.venue_id || formData.venue_id === 'none'}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

