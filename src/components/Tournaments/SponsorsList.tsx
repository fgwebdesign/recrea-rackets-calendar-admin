import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { X } from 'lucide-react';

interface Sponsor {
  name: string;
  logo: string;
}

interface SponsorsListProps {
  sponsors: Sponsor[];
  onSponsorsChange: (sponsors: Sponsor[]) => void;
}

export function SponsorsList({ sponsors, onSponsorsChange }: SponsorsListProps) {
  const [newSponsor, setNewSponsor] = useState<Sponsor>({ name: '', logo: '' });

  const handleAddSponsor = () => {
    if (newSponsor.name.trim() && newSponsor.logo) {
      onSponsorsChange([...sponsors, newSponsor]);
      setNewSponsor({ name: '', logo: '' });
    }
  };

  const handleRemoveSponsor = (index: number) => {
    const newSponsors = sponsors.filter((_, i) => i !== index);
    onSponsorsChange(newSponsors);
  };

  const handleLogoChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSponsor(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setNewSponsor(prev => ({ ...prev, logo: '' }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista de patrocinadores actuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sponsors.map((sponsor, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="w-12 h-12 object-contain"
            />
            <div className="flex-1">
              <p className="font-medium text-foreground dark:text-foreground">{sponsor.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveSponsor(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Formulario para agregar nuevo patrocinador */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <Label htmlFor="sponsor-name">Nombre del Patrocinador</Label>
          <Input
            id="sponsor-name"
            value={newSponsor.name}
            onChange={(e) => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Empresa XYZ"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Logo del Patrocinador</Label>
          <ImageUpload
            onImageChange={handleLogoChange}
            currentImage={newSponsor.logo}
            maxSizeMB={2}
            recommendedSize="200x200px"
            aspectRatio="cuadrado"
            label="Click para subir el logo"
          />
        </div>

        <Button
          type="button"
          onClick={handleAddSponsor}
          disabled={!newSponsor.name.trim() || !newSponsor.logo}
          className="w-full"
        >
          Agregar Patrocinador
        </Button>
      </div>
    </div>
  );
}
