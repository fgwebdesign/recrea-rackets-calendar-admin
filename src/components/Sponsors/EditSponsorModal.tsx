import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

interface EditSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; name: string; logo: File | null }) => Promise<void>;
  sponsor: {
    id: string;
    name: string;
    logo_url: string;
  } | null;
}

export default function EditSponsorModal({ isOpen, onClose, onSubmit, sponsor }: EditSponsorModalProps) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sponsor) {
      setName(sponsor.name);
      setPreviewUrl(sponsor.logo_url);
    }
  }, [sponsor]);

  const handleClose = () => {
    setName('');
    setLogo(null);
    setPreviewUrl('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsor) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        id: sponsor.id,
        name,
        logo
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        aria-describedby="edit-sponsor-description"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Editar patrocinador
          </DialogTitle>
          <p id="edit-sponsor-description" className="sr-only">
            Formulario para editar la información del patrocinador, incluyendo nombre y logo
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
              Nombre del patrocinador
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingresa el nombre del patrocinador"
              disabled={isSubmitting}
              required
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo" className="text-gray-700 dark:text-gray-300">
              Logo del patrocinador
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-900">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <div className="relative w-full h-40 mb-4">
                    <img
                      src={previewUrl}
                      alt="Preview del logo"
                      className="w-full h-full object-contain rounded-md"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                )}
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="logo-upload"
                    className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:focus-within:ring-offset-gray-800"
                  >
                    <span>Subir un logo</span>
                    <input
                      id="logo-upload"
                      name="logo-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*"
                      disabled={isSubmitting}
                    />
                  </label>
                  <p className="pl-1">o arrastra y suelta</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF hasta 5MB</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="bg-transparent dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#6B8AFF] text-white hover:bg-[#5A75E6] dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}