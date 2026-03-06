'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, Plus, Trash2, Package, AlertTriangle, CheckCircle2, XCircle, Sparkles, Layers } from "lucide-react";
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
  const [stockIntake, setStockIntake] = useState('');
  const [stockIntakeNotes, setStockIntakeNotes] = useState('');

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
      
      const intakeNum = stockIntake ? parseInt(stockIntake, 10) : 0;
      const submitData: CreateProductData | UpdateProductData = {
        ...formData,
        venue_id: formData.venue_id && formData.venue_id !== 'none' ? formData.venue_id : (selectedVenueId || undefined),
        image_url: isEditing && !imageFile ? previewUrl : undefined,
        sizes: isClothingCategory && sizes.length > 0 ? sizes.map(s => ({
          size: s.size,
          size_type: s.size_type,
          stock_quantity: s.stock_quantity
        })) : undefined,
        attributes: hasVariants && attributes.length > 0 ? attributes : undefined,
        variants: hasVariants && variants.length > 0 ? variants : undefined
      };
      if (isEditing && intakeNum > 0) {
        (submitData as UpdateProductData).stock_intake = intakeNum;
        if (stockIntakeNotes.trim()) (submitData as UpdateProductData).stock_intake_notes = stockIntakeNotes.trim();
        delete (submitData as Record<string, unknown>).stock_quantity;
      }
      
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
        setStockIntake('');
        setStockIntakeNotes('');
        if (imageFile && result.productId) {
          try {
            await uploadImage(imageFile, result.productId);
          } catch (error) {
            console.error('Error uploading image after product update:', error);
            // No lanzar error, el producto ya se creó/actualizó
          }
        }
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
    setStockIntake('');
    setStockIntakeNotes('');
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

  const sectionTitle = 'text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 block';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto z-50 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
        <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? t('products.editProduct') : t('products.addProduct')}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditing ? t('products.editProductDescription') : t('products.addProductDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8">
          {isEditing && (
            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              formData.is_active
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                {formData.is_active ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    {t('products.isActive')}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.is_active ? 'Visible en el catálogo' : 'Oculto'}
                  </p>
                </div>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          )}

          {/* Sección: Información del producto */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Información del producto</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.image')}</Label>
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                  {/* Preview: altura fija, proporción de producto */}
                  <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                        loading="lazy"
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 280px"
                        unoptimized={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-60" strokeWidth={1.5} />
                        <span className="text-xs font-medium">{t('products.noImage')}</span>
                        <span className="text-[11px] mt-0.5 opacity-80">JPG o PNG, máx. 5 MB</span>
                      </div>
                    )}
                  </div>
                  <label className="block border-t border-gray-200 dark:border-gray-600">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" disabled={isSubmitting || uploadingImage} />
                    <span className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <ImageIcon className="h-4 w-4" />
                      {previewUrl ? t('products.changeImage') : t('products.selectImage')}
                    </span>
                  </label>
                </div>
              </div>
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.name')} <span className="text-red-500">*</span></Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder={t('products.namePlaceholder')} required className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.category')} <span className="text-red-500">*</span></Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))} disabled={loadingCategories || isSubmitting}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg">
                        <SelectValue placeholder={t('products.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent position="item-aligned" className="z-[100]">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon iconName={cat.icon} categoryName={cat.name} className="w-4 h-4" color={cat.color} />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.descriptionLabel')}</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder={t('products.descriptionPlaceholder')} rows={3} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg resize-none" />
                </div>
                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="venue_id" className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{t('products.venue')} <span className="text-red-500">*</span></Label>
                    <Select value={formData.venue_id} onValueChange={(value) => setFormData(prev => ({ ...prev, venue_id: value }))} disabled={loadingVenues || isSubmitting} required>
                      <SelectTrigger className="h-9 w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg">
                        <SelectValue placeholder={t('products.selectVenue')} />
                      </SelectTrigger>
                      <SelectContent position="item-aligned" className="z-[100]">
                        {venues.filter(v => v.is_active).map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">{t('products.isFeatured')}</Label>
                    <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))} className="data-[state=checked]:bg-amber-500" />
                  </div>
                  {(!formData.venue_id || formData.venue_id === 'none') && <p className="text-xs text-red-500">{t('products.venueRequired')}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Identificación y precios */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Identificación y precios</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.sku')}</Label>
              <Input id="sku" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} placeholder={t('products.skuPlaceholder')} className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.barcode')}</Label>
              <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))} placeholder={t('products.barcodePlaceholder')} className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.price')} <span className="text-red-500">*</span></Label>
              <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} required className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.costPrice')}</Label>
              <Input id="cost_price" type="number" step="0.01" min="0" value={formData.cost_price} onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))} className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg" />
            </div>
          </div>
          </div>

          {/* Sección: Inventario */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Inventario</h3>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="track_inventory" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
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
                          className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg max-w-[140px] disabled:opacity-60"
                        />
                        {isClothingCategory && sizes.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            El stock total se calcula automáticamente sumando el stock de todos los talles
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stock_alert_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Alerta de stock mínimo
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
                            className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg max-w-[100px]"
                            placeholder="Mín."
                          />
                        )}
                      </div>
                      {/* Ingreso de stock: solo en edición */}
                      {isEditing && (
                        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <Label htmlFor="stock_intake" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.stockIntake')}</Label>
                          <Input id="stock_intake" type="number" min={0} placeholder={t('products.stockIntakePlaceholder')} value={stockIntake} onChange={(e) => setStockIntake(e.target.value)} className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg max-w-[120px]" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('products.stockIntakeHelp')}</p>
                          <Label htmlFor="stock_intake_notes" className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.stockIntakeNotes')}</Label>
                          <Input id="stock_intake_notes" type="text" placeholder={t('products.stockIntakeNotesPlaceholder')} value={stockIntakeNotes} onChange={(e) => setStockIntakeNotes(e.target.value)} className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg" />
                        </div>
                      )}
                    </div>
                  )}
            </div>
          </div>

          {/* Sección: Talles (Indumentaria) */}
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

          {/* Sección: Variantes */}
          {!isClothingCategory && (
            <div className="space-y-4">
              <h3 className={sectionTitle}>Variantes de producto</h3>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label htmlFor="has_variants" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gray-500" />
                        Usar variantes
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Atributos ej: Color, Sabor, Tamaño
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
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Agrega atributos y valores, luego genera las variantes</p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || uploadingImage} className="min-w-[100px]">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingImage || !formData.name.trim() || !formData.category_id || !formData.venue_id || formData.venue_id === 'none'} className="min-w-[120px] bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">
              {isSubmitting || uploadingImage ? t('common.saving') : (isEditing ? t('common.update') : t('common.save'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

