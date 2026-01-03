"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ComboboxInput } from "@/components/ui/combobox";
import { Building2, Upload, X } from "lucide-react";
import { Venue } from "@/types/venue";
import { useTranslations } from '@/contexts/TranslationContext';
import { supabase } from '@/lib/supabase';

// Tipos locales para country-state-city
interface CountryType {
  isoCode: string;
  name: string;
  flag: string;
}

interface StateType {
  isoCode: string;
  name: string;
}

interface CityType {
  name: string;
}

// Importación condicional de country-state-city
let Country: {
  getAllCountries: () => CountryType[];
  getCountryByCode: (code: string) => CountryType | undefined;
} | undefined;

let State: {
  getStatesOfCountry: (countryCode: string) => StateType[];
  getStateByCodeAndCountry: (stateCode: string, countryCode: string) => StateType | undefined;
} | undefined;

let City: {
  getCitiesOfState: (countryCode: string, stateCode: string) => CityType[];
} | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const csc = require("country-state-city");
  Country = csc.Country;
  State = csc.State;
  City = csc.City;
} catch {
  console.warn("country-state-city no está instalado. Instala con: npm install --legacy-peer-deps country-state-city");
}

interface VenueFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Venue>) => Promise<void>;
  venue?: Venue | null;
}

export default function VenueForm({ isOpen, onClose, onSubmit, venue }: VenueFormProps) {
  const t = useTranslations('venues');
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'Uruguay',
    postal_code: '',
    phone: '',
    email: '',
    description: '',
    is_default: false,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Estados para países, estados y ciudades
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('UY'); // Uruguay por defecto
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<StateType[]>([]);
  const [availableCities, setAvailableCities] = useState<CityType[]>([]);
  
  // Países relevantes (Latinoamérica + Estados Unidos)
  const relevantCountries = useMemo(() => {
    if (!Country || !Country.getAllCountries) return [];
    
    const latamCodes = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE'];
    return Country.getAllCountries().filter((country) => {
      return country.isoCode === 'US' || latamCodes.includes(country.isoCode);
    });
  }, []);

  // Cargar estados cuando cambia el país
  useEffect(() => {
    if (selectedCountryCode && State && State.getStatesOfCountry) {
      const states = State.getStatesOfCountry(selectedCountryCode);
      setAvailableStates(states || []);
      
      // Si hay un estado seleccionado, mantenerlo si existe
      if (selectedStateCode) {
        const stateExists = states?.find((s) => s.isoCode === selectedStateCode);
        if (!stateExists) {
          setSelectedStateCode('');
          setFormData(prev => ({ ...prev, state: '' }));
        }
      }
    } else {
      setAvailableStates([]);
      setSelectedStateCode('');
      setFormData(prev => ({ ...prev, state: '' }));
    }
  }, [selectedCountryCode, selectedStateCode]);

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    if (selectedCountryCode && selectedStateCode && City && City.getCitiesOfState) {
      const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode);
      setAvailableCities(cities || []);
    } else {
      setAvailableCities([]);
    }
  }, [selectedCountryCode, selectedStateCode]);

  useEffect(() => {
    if (venue) {
      // Intentar encontrar el código del país desde el nombre
      let countryCode = '';
      if (venue.country && Country && Country.getAllCountries) {
        const country = Country.getAllCountries().find((c) => 
          c.name === venue.country || c.name.toLowerCase() === venue.country?.toLowerCase()
        );
        countryCode = country?.isoCode || '';
      }
      
      setSelectedCountryCode(countryCode);
      
      // Intentar encontrar el estado
      if (venue.state && State && State.getStatesOfCountry) {
        const states = State.getStatesOfCountry(countryCode);
        const state = states?.find((s) => 
          s.name === venue.state || s.name.toLowerCase() === venue.state?.toLowerCase()
        );
        if (state) {
          setSelectedStateCode(state.isoCode);
        }
      }
      
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        city: venue.city || '',
        state: venue.state || '',
        country: venue.country || '',
        postal_code: venue.postal_code || '',
        phone: venue.phone || '',
        email: venue.email || '',
        description: venue.description || '',
        is_default: venue.is_default || false,
        is_active: venue.is_active !== undefined ? venue.is_active : true,
        photo_url: venue.photo_url || '',
      });
      setPreviewUrl(venue.photo_url || null);
      setImageFile(null);
    } else {
      setSelectedCountryCode('');
      setSelectedStateCode('');
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        phone: '',
        email: '',
        description: '',
        is_default: false,
        is_active: true,
        photo_url: '',
      });
      setPreviewUrl(null);
      setImageFile(null);
    }
    setErrors({});
  }, [venue, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = t('nameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no debe superar los 5MB' }));
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'El archivo debe ser una imagen' }));
        return;
      }

      setImageFile(file);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };

  const uploadImage = async (file: File, venueId?: string): Promise<string> => {
    try {
      setUploadingImage(true);
      
      // Si hay un venueId (edición), usar el endpoint del backend
      if (venueId) {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No estás autenticado');

        const formData = new FormData();
        formData.append('file', file);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999';
        const response = await fetch(`${API_URL}/venues/${venueId}/photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al subir la imagen');
        }

        const data = await response.json();
        return data.photo_url;
      }

      // Si no hay venueId (creación), intentar subir directamente
      // Intentar diferentes buckets en orden de preferencia
      const bucketsToTry = ['courts-bucket','venues-bucket', , 'tournament-thumbnails'];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `venues/${fileName}`;

      let lastError: Error | null = null;
      
      for (const bucketName of bucketsToTry) {
        try {
          const { error: uploadError } = await supabase.storage
            .from(bucketName as string)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!uploadError) {
            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName as string)
              .getPublicUrl(filePath);
            
            return publicUrl;
          } else {
            lastError = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          continue;
        }
      }

      // Si todos los buckets fallaron, lanzar el último error
      throw lastError || new Error('No se pudo subir la imagen. Verifica que el bucket de almacenamiento esté configurado.');
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      // Si hay una imagen nueva, subirla primero
      let photoUrl = formData.photo_url;
      if (imageFile) {
        try {
          // Si estamos editando, usar el endpoint del backend
          photoUrl = await uploadImage(imageFile, venue?.id);
        } catch (uploadError: unknown) {
          console.error('Error uploading image:', uploadError);
          const errorMessage = uploadError instanceof Error 
            ? uploadError.message 
            : 'Error al subir la imagen. Por favor, intenta nuevamente.';
          setErrors(prev => ({ 
            ...prev, 
            image: errorMessage
          }));
          setIsLoading(false);
          return;
        }
      }

      // Enviar datos con la URL de la imagen
      await onSubmit({ ...formData, photo_url: photoUrl });
      handleClose();
    } catch (error) {
      console.error('Error submitting venue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCountryCode('');
    setSelectedStateCode('');
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      phone: '',
      email: '',
      description: '',
      is_default: false,
      is_active: true,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-gray-800 w-[calc(100%-2rem)] sm:w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-5 lg:p-6 rounded-lg custom-scrollbar">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900 dark:text-white font-bold">
            {venue ? t('editVenue') : t('newVenue')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {venue ? 'Actualiza los detalles de la sede' : 'Completa los detalles para crear una nueva sede'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Layout horizontal: Imagen a la izquierda, Información básica a la derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {/* Imagen - Columna izquierda */}
            <div className="space-y-2 lg:col-span-1">
              <Label className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-bold">Imagen de Perfil</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                {(previewUrl || formData.photo_url) ? (
                  <div className="relative w-full h-40 sm:h-48 mb-3 rounded-md overflow-hidden">
                    <Image
                      src={previewUrl || formData.photo_url || ''}
                      alt="Preview"
                      fill
                      className="object-cover rounded-md"
                      priority
                      quality={90}
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      unoptimized={previewUrl?.startsWith('blob:') || previewUrl?.startsWith('data:')}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 sm:h-48 mb-3">
                    <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sin imagen</p>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isLoading || uploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo')?.click()}
                    disabled={isLoading || uploadingImage}
                    className="w-full text-xs sm:text-sm border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 h-auto"
                  >
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    {previewUrl || formData.photo_url ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Button>
                </label>
                {uploadingImage && (
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-gray-500"></div>
                    <span>Subiendo...</span>
                  </div>
                )}
                {errors.image && (
                  <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 mt-2">{errors.image}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Tamaño máximo: 5MB. Formatos: JPG, PNG, WebP
                </p>
              </div>
            </div>

            {/* Información básica - Columnas derechas */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                    {t('venueName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('venueNamePlaceholder')}
                    required
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9 sm:h-10"
                  />
                  {errors.name && (
                    <p className="text-xs sm:text-sm text-red-500 dark:text-red-400">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="address" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                    {t('address')}
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={t('addressPlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9 sm:h-10"
                  />
                </div>
              </div>
              
              {/* Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="phone" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                    {t('phone')}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('phonePlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('emailPlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9 sm:h-10"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                  {t('descriptionField')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="country" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                {t('country')} <span className="text-red-500">*</span>
              </Label>
              <ComboboxInput
                id="country"
                value={formData.country}
                onValueChange={(value) => {
                  // Extraer el nombre del país (quitar la bandera si está presente)
                  // Las banderas son emojis, así que buscamos el nombre después del primer espacio
                  const parts = value.split(' ');
                  const countryName = parts.length > 1 ? parts.slice(1).join(' ') : value;
                  
                  // Buscar el país por nombre para obtener su código
                  const country = relevantCountries.find((c) => c.name === countryName);
                  if (country) {
                    setSelectedCountryCode(country.isoCode);
                    setFormData(prev => ({ 
                      ...prev, 
                      country: country.name,
                      state: '',
                      city: ''
                    }));
                  } else {
                    setFormData(prev => ({ 
                      ...prev, 
                      country: countryName || '',
                      state: '',
                      city: ''
                    }));
                    setSelectedCountryCode('');
                  }
                  // Limpiar el estado cuando cambia el país
                  setSelectedStateCode('');
                  setAvailableStates([]);
                  setAvailableCities([]);
                }}
                options={relevantCountries.map((country) => ({
                  value: country.isoCode,
                  label: `${country.flag} ${country.name}`,
                }))}
                placeholder={t('countryPlaceholder')}
                className="text-sm sm:text-base bg-white dark:bg-gray-700 h-9 sm:h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="state" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                  {t('state')}
                </Label>
                {availableStates.length > 0 ? (
                  <ComboboxInput
                    id="state"
                    value={formData.state}
                    onValueChange={(value) => {
                      // Si el valor coincide con un estado de la lista, actualizar también el código
                      const state = availableStates.find((s) => {
                        const stateName = s.name.replace(' Department', '');
                        return s.name === value || stateName === value;
                      });
                      if (state) {
                        setSelectedStateCode(state.isoCode);
                      } else {
                        // Si el valor no coincide con ningún estado de la lista, limpiar el código
                        setSelectedStateCode('');
                      }
                      setFormData(prev => ({ 
                        ...prev, 
                        state: value,
                        city: state ? '' : prev.city // Resetear ciudad solo si se seleccionó un estado válido
                      }));
                    }}
                    options={availableStates.map((state) => ({
                      value: state.isoCode,
                      label: state.name.replace(' Department', ''),
                    }))}
                    placeholder={t('statePlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 h-9 sm:h-10"
                  />
                ) : (
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder={t('stateManualPlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9 sm:h-10"
                  />
                )}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="city" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold">
                  {t('city')}
                </Label>
                {availableCities.length > 0 ? (
                  <ComboboxInput
                    id="city"
                    value={formData.city}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, city: value }));
                    }}
                    options={availableCities.map((city) => ({
                      value: city.name,
                      label: city.name,
                    }))}
                    placeholder={t('cityPlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 h-9 sm:h-10"
                  />
                ) : (
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('cityManualPlaceholder')}
                    className="text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 h-9 sm:h-10"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
            />
            <Label htmlFor="is_default" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold cursor-pointer">
              {t('setAsDefault')}
            </Label>
          </div>

          {/* Información */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">ℹ</span>
              <span><strong>{t('courtsInfo')}</strong> {t('courtsInfoDescription')}</span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-5 lg:pt-6 mt-4 sm:mt-5 lg:mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm sm:text-base border-gray-300 dark:border-gray-600 h-9 sm:h-10"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || uploadingImage || !formData.name}
              className="w-full sm:w-auto text-sm sm:text-base bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white h-9 sm:h-10"
            >
              {isLoading || uploadingImage ? t('saving') : venue ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

