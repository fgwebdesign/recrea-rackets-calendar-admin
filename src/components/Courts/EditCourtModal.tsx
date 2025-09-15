import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useTranslations } from '@/contexts/TranslationContext';

interface EditCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; name: string; photo: File | null }) => Promise<void>;
  court: {
    id: string;
    name: string;
    photo_url: string;
  } | null;
}

export default function EditCourtModal({ isOpen, onClose, onSubmit, court }: EditCourtModalProps) {
  const t = useTranslations('courts');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (court) {
      setName(court.name);
      setPreviewUrl(court.photo_url);
    }
  }, [court]);

  const handleClose = () => {
    setName('');
    setPhoto(null);
    setPreviewUrl('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!court) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        id: court.id,
        name,
        photo
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('editCourt')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
              {t('courtName')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('courtNamePlaceholder')}
              disabled={isSubmitting}
              required
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-gray-700 dark:text-gray-300">
              {t('courtPhoto')}
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-900">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <div className="relative w-full h-40 mb-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                )}
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 dark:focus-within:ring-offset-gray-800"
                  >
                    <span>{t('uploadPhoto')}</span>
                    <input
                      id="photo-upload"
                      name="photo-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*"
                      disabled={isSubmitting}
                    />
                  </label>
                  <p className="pl-1">{t('dragAndDrop')}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('fileFormatEdit')}</p>
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#6B8AFF] text-white hover:bg-[#5A75E6] dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 