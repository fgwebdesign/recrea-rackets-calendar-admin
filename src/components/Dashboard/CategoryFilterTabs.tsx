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
  return (
    <div className={`px-4 sm:px-6 pt-4 ${className}`}>
      <Tabs defaultValue={selectedCategory} value={selectedCategory} onValueChange={onCategoryChange}>
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="mb-4 w-max min-w-full sm:w-auto sm:min-w-0">
            {showAllOption && (
              <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">
                {t('allCategories')}
              </TabsTrigger>
            )}
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="text-xs sm:text-sm whitespace-nowrap"
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