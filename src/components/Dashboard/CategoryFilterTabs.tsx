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
    <div className={`px-6 pt-4 ${className}`}>
      <Tabs defaultValue={selectedCategory} value={selectedCategory} onValueChange={onCategoryChange}>
        <TabsList className="mb-4">
          {showAllOption && (
            <TabsTrigger value="all" className="text-sm">
              {t('allCategories')}
            </TabsTrigger>
          )}
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-sm"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
} 