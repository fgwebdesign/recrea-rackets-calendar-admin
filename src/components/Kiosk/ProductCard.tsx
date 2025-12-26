import Image from 'next/image';
import { Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import { Product } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';

interface ProductCardProps {
  product: Product;
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  priority?: boolean; // Para las primeras imágenes visibles
}

export default function ProductCard({ product, onDelete, onEdit, priority = false }: ProductCardProps) {
  const t = useTranslations('kiosk');
  const tCommon = useTranslations('common');
  const isLowStock = product.track_inventory && product.stock_quantity <= product.min_stock_alert;
  const stockPercentage = product.track_inventory && product.min_stock_alert > 0
    ? (product.stock_quantity / (product.min_stock_alert * 3)) * 100
    : 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Imagen del producto */}
      <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {product.image_url && product.image_url.trim() !== '' ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            quality={85}
            onError={() => {
              console.error('Error loading product image:', product.image_url);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        {product.is_featured && (
          <div className="absolute top-1.5 right-1.5 bg-yellow-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
            {t('products.isFeatured')}
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t('products.lowStock')}
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Header con nombre y acciones */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {product.name}
            </h3>
            {product.category && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ 
                    backgroundColor: product.category.color ? `${product.category.color}20` : '#3B82F620',
                    color: product.category.color || '#3B82F6'
                  }}
                >
                  {product.category.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-1 ml-2 flex-shrink-0">
            <button
              onClick={() => onEdit(product)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(product)}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Descripción */}
        {product.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Información de precio y stock */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">{tCommon('price')}:</span>
            <span className="text-base font-bold text-green-600 dark:text-green-400">
              ${product.price.toLocaleString('es-UY')}
            </span>
          </div>

          {product.track_inventory && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tCommon('available')}:</span>
                <span className={`font-semibold text-xs ${
                  isLowStock 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {product.stock_quantity}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    stockPercentage > 50 
                      ? 'bg-green-500' 
                      : stockPercentage > 25 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {product.sku && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {tCommon('sku')}: {product.sku}
            </div>
          )}

          {/* Estado */}
          <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              product.is_active 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {product.is_active ? t('products.isActive') : t('products.isInactive')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

