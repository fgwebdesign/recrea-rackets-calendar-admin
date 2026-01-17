'use client';

import { useState, useMemo, useCallback, useEffect } from "react";
import { PlusCircle, Search, Filter, Package } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/Kiosk/ProductCard";
import ProductModal from "@/components/Kiosk/ProductModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useProducts } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import { Product, CreateProductData, UpdateProductData, ProductFilters } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { useKioskVenue } from '@/contexts/KioskVenueContext';
import { CategoryIcon } from "@/lib/categoryIcons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

export default function ProductsPage() {
  const t = useTranslations('kiosk');
  const { selectedVenueId, selectedVenue, setSelectedVenueId, venues, loading: loadingVenues } = useKioskVenue();
  const [filters, setFilters] = useState<ProductFilters>({
    category_id: '',
    is_active: true,
    search: '',
    low_stock: false,
    venue_id: selectedVenueId
  });
  
  // Actualizar filtros cuando cambia el venue seleccionado
  useEffect(() => {
    setFilters(prev => ({ ...prev, venue_id: selectedVenueId }));
  }, [selectedVenueId]);
  
  // El hook useProducts ya maneja la carga automática cuando cambian los filtros
  const { products, isLoading, createProduct, updateProduct, deleteProduct, fetchProducts } = useProducts(filters);
  const { categories } = useProductCategories();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null as Product | null
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce para la búsqueda
  const [searchInput, setSearchInput] = useState('');
  
  const PRODUCTS_PER_PAGE = 10;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300); // Espera 300ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchInput]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = useCallback(async (data: CreateProductData | UpdateProductData, imageFile?: File | null): Promise<{ success: boolean; productId?: string }> => {
    try {
      // Asegurar que el venue_id esté presente al crear
      if (!editingProduct && !data.venue_id && selectedVenueId) {
        data.venue_id = selectedVenueId;
      }
      
      if (editingProduct) {
        const success = await updateProduct(editingProduct.id, data);
        if (success) {
          setIsModalOpen(false);
          setEditingProduct(null);
          // Refrescar productos después de actualizar (especialmente si se subió imagen)
          if (imageFile) {
            await fetchProducts(filters);
          }
        }
        return { success, productId: editingProduct.id };
      } else {
        // Validar que venue_id esté presente
        if (!data.venue_id) {
          throw new Error('venue_id es requerido para crear un producto');
        }
        
        const result = await createProduct(data as CreateProductData);
        if (result.success && result.product) {
          setIsModalOpen(false);
          setEditingProduct(null);
          // Refrescar productos después de crear (especialmente si se subió imagen)
          if (imageFile) {
            await fetchProducts(filters);
          }
          return { success: true, productId: result.product.id };
        }
        return { success: false };
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      return { success: false };
    }
  }, [editingProduct, updateProduct, createProduct, fetchProducts, filters, selectedVenueId]);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteModal.product) {
      const success = await deleteProduct(deleteModal.product.id);
      if (success) {
        setDeleteModal({ isOpen: false, product: null });
      }
    }
  }, [deleteModal.product, deleteProduct]);

  // Los productos ya vienen filtrados del backend, no necesitamos filtrar de nuevo
  // Solo mantenemos la lista tal cual viene del hook
  const displayProducts = useMemo(() => products, [products]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.category_id, filters.search, filters.low_stock]);

  // Calcular productos paginados
  const totalPages = Math.ceil(displayProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return displayProducts.slice(startIndex, endIndex);
  }, [displayProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll al inicio del grid de productos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('products.title')}
        description={t('products.description')}
        icon={<PlusCircle className="w-6 h-6" />}
      />

      {/* Selector de Venue o Venue Actual */}
      {!loadingVenues && venues.length > 0 && (
        <div className="mt-6 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              {venues.length > 1 ? (
                // Selector si hay múltiples venues
                <>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('products.venue')} <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedVenueId || 'none'} 
                    onValueChange={(value) => {
                      if (value !== 'none') {
                        setSelectedVenueId(value);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 w-64">
                      <SelectValue placeholder={t('products.selectVenue')} />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.filter(v => v.is_active).map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                // Mostrar venue actual si solo hay uno
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sede:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedVenue?.name || venues[0]?.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mostrar mensaje si no hay venue seleccionado */}
      {!loadingVenues && venues.length > 0 && !selectedVenueId && (
        <div className="mt-6 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            {t('products.mustSelectVenue')}
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="mt-6 mb-6 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 space-y-4">
          {/* Barra de búsqueda y otros filtros */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('products.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters(prev => ({ ...prev, low_stock: !prev.low_stock }))}
              className={filters.low_stock ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('products.lowStock')}
            </Button>
          </div>

          {/* Selector de Categorías estilo PedidosYa con blur */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, category_id: '' }))}
              className={`
                group relative
                flex flex-col items-center justify-center gap-1.5
                px-4 py-3
                min-w-[90px]
                rounded-2xl
                transition-all duration-300
                whitespace-nowrap
                overflow-hidden
                ${!filters.category_id
                  ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-500/50'
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm'
                }
              `}
            >
              {/* Background blur effect */}
              {!filters.category_id && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm" />
              )}
              <div className={`
                relative z-10
                p-2 rounded-xl
                ${!filters.category_id
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm'
                }
              `}>
                <Package className={`w-4 h-4 ${!filters.category_id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
              </div>
              <span className={`relative z-10 text-xs font-semibold ${!filters.category_id ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {t('products.all')}
              </span>
            </button>
            {categories.filter(c => c.is_active).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilters(prev => ({ ...prev, category_id: cat.id }))}
                className={`
                  group relative
                  flex flex-col items-center justify-center gap-1.5
                  px-4 py-3
                  min-w-[90px]
                  rounded-2xl
                  transition-all duration-300
                  whitespace-nowrap
                  overflow-hidden
                  ${filters.category_id === cat.id
                    ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-500/50'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm'
                  }
                `}
              >
                {/* Background blur effect */}
                {filters.category_id === cat.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm" />
                )}
                <div className={`
                  relative z-10
                  p-2 rounded-xl
                  ${filters.category_id === cat.id
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm'
                  }
                `}>
                  <CategoryIcon
                    iconName={cat.icon}
                    categoryName={cat.name}
                    className={`w-4 h-4 ${filters.category_id === cat.id ? 'text-white' : ''}`}
                    color={filters.category_id === cat.id ? undefined : cat.color}
                  />
                </div>
                <span className={`relative z-10 text-xs font-semibold ${filters.category_id === cat.id ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="bg-green-600 text-white hover:bg-green-700 font-bold"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('products.addProduct')}
        </Button>
      </div>

      {!selectedVenueId && venues.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('products.selectVenueFirst')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('products.selectVenueFirstDescription')}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('products.noProducts')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('products.noProductsDescription')}
          </p>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="bg-green-600 text-white hover:bg-green-700 font-bold"
          >
            {t('products.addProduct')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={(prod) => setDeleteModal({ isOpen: true, product: prod })}
                priority={index < 5} // Prioridad para las primeras 5 imágenes visibles
              />
            ))}
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    label={t('products.pagination.previous')}
                    className={cn(
                      "cursor-pointer",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    label={t('products.pagination.next')}
                    className={cn(
                      "cursor-pointer",
                      currentPage === totalPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
        onProductUpdated={() => {
          // Refrescar productos después de subir imagen
          fetchProducts(filters);
        }}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.product?.name || ''}
        itemType="producto"
      />
    </div>
  );
}

