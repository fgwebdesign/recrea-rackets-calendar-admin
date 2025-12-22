import { Edit2, Trash2 } from "lucide-react";
import { ProductCategory } from "@/types/kiosk";
import { CategoryIcon } from "@/lib/categoryIcons";

interface ProductCategoryCardProps {
  category: ProductCategory;
  onDelete: (category: ProductCategory) => void;
  onEdit: (category: ProductCategory) => void;
}

export default function ProductCategoryCard({ category, onDelete, onEdit }: ProductCategoryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color ? `${category.color}20` : '#3B82F620' }}
            >
              <CategoryIcon 
                iconName={category.icon} 
                categoryName={category.name}
                className="w-6 h-6"
                color={category.color || '#3B82F6'}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(category)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            category.is_active 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            {category.is_active ? 'Activa' : 'Inactiva'}
          </span>
          {category.color && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Color:</span>
              <div 
                className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: category.color }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

