import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Category } from "@/types/category";
import { useTranslations } from '@/contexts/TranslationContext';

interface CategoryFilterTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export function CategoryFilterTabs({
  categories,
  selectedCategory,
  onCategoryChange,
  showAllOption = true,
  className = ""
}: CategoryFilterTabsProps) {
  const t = useTranslations('dashboard');
  
  // Determinar si el className incluye px-0 (padding cero)
  const hasZeroPadding = className.includes('px-0');
  const basePadding = hasZeroPadding ? '' : 'px-4 sm:px-6';
  
  return (
    <div className={`${basePadding} pt-3 sm:pt-4 ${className}`}>
      <Tabs defaultValue={selectedCategory} value={selectedCategory} onValueChange={onCategoryChange}>
        <div className={`overflow-x-auto scrollbar-hide ${hasZeroPadding ? '-mx-4 sm:mx-0 px-4 sm:px-0' : ''}`}>
          <TabsList className="mb-3 sm:mb-4 h-auto bg-transparent p-0 inline-flex overflow-x-auto whitespace-nowrap scrollbar-hide">
            {showAllOption && (
              <TabsTrigger value="all" className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                {t('allCategories')}
              </TabsTrigger>
            )}
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
} 