'use client';

import { useState, useEffect } from "react";
import { PlusCircle, Search, Filter } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/Kiosk/ProductCard";
import ProductModal from "@/components/Kiosk/ProductModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useProducts } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useVenues } from "@/hooks/useVenues";
import { Product, CreateProductData, UpdateProductData, ProductFilters } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';

export default function ProductsPage() {
  const t = useTranslations('kiosk');
  const [filters, setFilters] = useState<ProductFilters>({
    category_id: '',
    venue_id: '',
    is_active: true,
    search: '',
    low_stock: false
  });
  
  const { products, isLoading, createProduct, updateProduct, deleteProduct, fetchProducts } = useProducts(filters);
  const { categories } = useProductCategories();
  const { venues } = useVenues({ includeCourts: false });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    product: null as Product | null
  });

  useEffect(() => {
    fetchProducts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (data: CreateProductData | UpdateProductData, imageFile?: File | null): Promise<{ success: boolean; productId?: string }> => {
    try {
      if (editingProduct) {
        const success = await updateProduct(editingProduct.id, data);
        if (success) {
          setIsModalOpen(false);
          setEditingProduct(null);
          await fetchProducts(filters);
        }
        return { success, productId: editingProduct.id };
      } else {
        const result = await createProduct(data as CreateProductData);
        if (result.success && result.product) {
          setIsModalOpen(false);
          setEditingProduct(null);
          await fetchProducts(filters);
          return { success: true, productId: result.product.id };
        }
        return { success: false };
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      return { success: false };
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteModal.product) {
      const success = await deleteProduct(deleteModal.product.id);
      if (success) {
        setDeleteModal({ isOpen: false, product: null });
      }
    }
  };

  const filteredProducts = products.filter(product => {
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('products.title')}
        description={t('products.description')}
        icon={<PlusCircle className="w-6 h-6" />}
      />

      {/* Filtros */}
      <div className="mt-6 mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('products.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
          
          <Select
            value={filters.category_id || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, category_id: value === 'all' ? '' : value }))}
          >
            <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder={t('products.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('products.allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.venue_id || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, venue_id: value === 'all' ? '' : value }))}
          >
            <SelectTrigger className="w-[200px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder={t('products.allVenues')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('products.allVenues')}</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, low_stock: !prev.low_stock }))}
            className={filters.low_stock ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('products.lowStock')}
          </Button>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('products.addProduct')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
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
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {t('products.addProduct')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={(prod) => setDeleteModal({ isOpen: true, product: prod })}
            />
          ))}
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
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

