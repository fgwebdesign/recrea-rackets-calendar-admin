import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@/hooks/useCategories";

interface LeagueFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  categories: Category[];
}

const STATUS = ['Todos', 'Inscribiendo', 'Activa', 'Finalizada'];

export function LeagueFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  categories
}: LeagueFiltersProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Inscribiendo':
        return 'Inscripciones abiertas';
      case 'Activa':
        return 'En Curso';
      case 'Finalizada':
        return 'Finalizada';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Buscar por categoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="flex gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {STATUS.map((statusValue) => (
            <Button
              key={statusValue}
              variant={selectedStatus === statusValue ? "default" : "outline"}
              onClick={() => setSelectedStatus(statusValue)}
              className={`whitespace-nowrap ${
                statusValue === 'Inscribiendo' ? 'text-emerald-700 dark:text-emerald-300' : 
                statusValue === 'Activa' ? 'text-blue-700 dark:text-blue-300' : ''
              }`}
            >
              {getStatusLabel(statusValue)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 