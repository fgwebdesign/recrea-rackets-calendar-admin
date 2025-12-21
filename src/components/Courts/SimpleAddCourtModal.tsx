"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from '@/contexts/TranslationContext';
import { useVenues } from "@/hooks/useVenues";

interface SimpleAddCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; photo: File | null; venue_id?: string }) => void;
}

export default function SimpleAddCourtModal({ isOpen, onClose, onSubmit }: SimpleAddCourtModalProps) {
  const t = useTranslations('courts');
  const { venues, loading: loadingVenues } = useVenues({ includeCourts: false });
  const [formData, setFormData] = useState({
    name: "",
    photo: null as File | null,
    venue_id: ""
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('imageTooLarge'));
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!formData.name || !formData.photo) {
        throw new Error(t('nameAndPhotoRequired'));
      }

      await onSubmit({
        name: formData.name,
        photo: formData.photo,
        venue_id: formData.venue_id || undefined
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorCreatingCourt'));
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : t('errorCreatingCourt'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", photo: null, venue_id: "" });
    setPreviewUrl(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{t('addNewCourt')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">{t('courtName')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('courtNamePlaceholder')}
              className="mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="venue_id" className="text-gray-700 dark:text-gray-300">Sede *</Label>
            <Select
              value={formData.venue_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, venue_id: value }))}
            >
              <SelectTrigger className="mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Selecciona una sede" />
              </SelectTrigger>
              <SelectContent>
                {loadingVenues ? (
                  <SelectItem value="loading" disabled>Cargando sedes...</SelectItem>
                ) : venues.length === 0 ? (
                  <SelectItem value="none" disabled>No hay sedes disponibles</SelectItem>
                ) : (
                  venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {venues.length === 0 && !loadingVenues && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                ⚠️ Primero debes crear una sede en la pestaña "Sedes"
              </p>
            )}
          </div>

          <div>
            <Label className="text-gray-700 dark:text-gray-300">{t('courtPhoto')}</Label>
            <div className="mt-2 mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ImageIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {t('imageRecommendation')}
                  </h4>
                  <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• {t('recommendedSize')}</li>
                    <li>• {t('format')}</li>
                    <li>• {t('maxSize')}</li>
                  </ul>
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    {t('imageDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex flex-col items-center">
                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-40 w-40 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, photo: null }));
                          setPreviewUrl(null);
                        }}
                        className="text-white hover:text-red-400"
                      >
                        {t('changeImage')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full cursor-pointer">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('clickToUpload')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {t('fileFormat')}
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.photo}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
            >
              {isLoading ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}