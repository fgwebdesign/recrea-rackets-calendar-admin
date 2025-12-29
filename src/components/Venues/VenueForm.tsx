"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Upload, X } from "lucide-react";
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
  
  // Estados para búsqueda
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  
  // Filtrar países relevantes (Latinoamérica + Estados Unidos) y por búsqueda
  const relevantCountries = useMemo(() => {
    if (!Country || !Country.getAllCountries) return [];
    
    const latamCodes = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE'];
    const allRelevantCountries = Country.getAllCountries().filter((country) => {
      return country.isoCode === 'US' || latamCodes.includes(country.isoCode);
    });
    
    if (!countrySearch.trim()) return allRelevantCountries;
    
    const searchLower = countrySearch.toLowerCase();
    return allRelevantCountries.filter(country => 
      country.name.toLowerCase().includes(searchLower)
    );
  }, [countrySearch]);
  
  // Filtrar estados por búsqueda
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return availableStates;
    const searchLower = stateSearch.toLowerCase();
    return availableStates.filter(state => 
      state.name.toLowerCase().includes(searchLower)
    );
  }, [availableStates, stateSearch]);
  
  // Filtrar ciudades por búsqueda
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    const searchLower = citySearch.toLowerCase();
    return availableCities.filter(city => 
      city.name.toLowerCase().includes(searchLower)
    );
  }, [availableCities, citySearch]);

  // Cargar estados cuando cambia el país
  useEffect(() => {
    if (selectedCountryCode && State && State.getStatesOfCountry) {
      const states = State.getStatesOfCountry(selectedCountryCode);
      setAvailableStates(states || []);
      setStateSearch(''); // Resetear búsqueda de estados
      
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
      setStateSearch('');
    }
  }, [selectedCountryCode, selectedStateCode]);

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    if (selectedCountryCode && selectedStateCode && City && City.getCitiesOfState) {
      const cities = City.getCitiesOfState(selectedCountryCode, selectedStateCode);
      setAvailableCities(cities || []);
      setCitySearch(''); // Resetear búsqueda de ciudades
    } else {
      setAvailableCities([]);
      setCitySearch('');
    }
  }, [selectedCountryCode, selectedStateCode]);

  useEffect(() => {
    if (venue) {
      // Intentar encontrar el código del país desde el nombre
      let countryCode = 'UY';
      if (Country && Country.getAllCountries) {
        const country = Country.getAllCountries().find((c) => 
          c.name === venue.country || c.name.toLowerCase() === venue.country?.toLowerCase()
        );
        countryCode = country?.isoCode || 'UY';
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
        country: venue.country || 'Uruguay',
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
      setSelectedCountryCode('UY');
      setSelectedStateCode('');
      setFormData({
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
    setFormData({
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
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 px-6 py-5 rounded-t-lg">
          <DialogHeader className="mb-0">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              {venue ? t('editVenue') : t('newVenue')}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagen de Perfil */}
          <div className="bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-xl p-5 border border-pink-100 dark:border-pink-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-pink-500"></span>
              Imagen de Perfil
            </h3>
            
            <div className="space-y-4">
              {/* Preview de imagen */}
              {(previewUrl || formData.photo_url) && (
                <div className="relative w-full max-w-xs mx-auto">
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md">
                    <Image
                      src={previewUrl || formData.photo_url || ''}
                      alt="Preview"
                      fill
                      className="object-cover"
                      priority
                      quality={90}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized={previewUrl?.startsWith('blob:') || previewUrl?.startsWith('data:')}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input de carga */}
              <div>
                <Label htmlFor="photo" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                  {previewUrl || formData.photo_url ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </Label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="photo"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-pink-500 dark:hover:border-pink-400 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {imageFile ? imageFile.name : 'Subir imagen'}
                    </span>
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                      <span>Subiendo...</span>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2 font-medium">{errors.image}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Tamaño máximo: 5MB. Formatos: JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Información Básica */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-blue-500"></span>
              {t('basicInfo')}
            </h3>
            
            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                  {t('venueName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('venueNamePlaceholder')}
                  className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all shadow-sm hover:shadow-md"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2 font-medium">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                  {t('address')}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('addressPlaceholder')}
                  className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-5 border border-green-100 dark:border-green-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-green-500"></span>
              {t('location')}
            </h3>
            
            <div className="space-y-5">
              <div>
                <Label htmlFor="country" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                  {t('country')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedCountryCode}
                  onValueChange={(value) => {
                    setSelectedCountryCode(value);
                    setSelectedStateCode('');
                    setCountrySearch('');
                    setStateSearch('');
                    setCitySearch('');
                    const country = Country && Country.getCountryByCode 
                      ? Country.getCountryByCode(value)
                      : null;
                    setFormData(prev => ({ 
                      ...prev, 
                      country: country?.name || 'Uruguay',
                      state: '',
                      city: ''
                    }));
                  }}
                >
                  <SelectTrigger className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all shadow-sm hover:shadow-md">
                    <SelectValue placeholder={t('countryPlaceholder')} />
                  </SelectTrigger>
              <SelectContent className="max-h-[350px]">
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          placeholder={t('searchCountry')}
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="pl-10 h-9 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                      {relevantCountries.length > 0 ? (
                        relevantCountries.map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode} className="cursor-pointer">
                            {country.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                          {countrySearch ? t('noStatesFound') : t('noCountriesAvailable')}
                        </div>
                      )}
                </div>
              </SelectContent>
            </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                    {t('state')}
                  </Label>
                  {availableStates.length > 0 ? (
                    <Select
                      value={selectedStateCode}
                      onValueChange={(value) => {
                        setSelectedStateCode(value);
                        setStateSearch('');
                        const state = State && State.getStateByCodeAndCountry
                          ? State.getStateByCodeAndCountry(value, selectedCountryCode)
                          : null;
                        setFormData(prev => ({ 
                          ...prev, 
                          state: state?.name || '',
                          city: ''
                        }));
                      }}
                    >
                      <SelectTrigger className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all shadow-sm hover:shadow-md">
                        <SelectValue placeholder={t('statePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[350px]">
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              placeholder={t('searchState')}
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              className="pl-10 h-9 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-sm"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto">
                          {filteredStates.length > 0 ? (
                            filteredStates.map((state) => (
                              <SelectItem key={state.isoCode} value={state.isoCode} className="cursor-pointer">
                                {state.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              {t('noStatesFound')}
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder={t('stateManualPlaceholder')}
                      className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all shadow-sm hover:shadow-md"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                    {t('city')}
                  </Label>
                  {availableCities.length > 0 ? (
                    <Select
                      value={formData.city}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, city: value }));
                        setCitySearch('');
                      }}
                    >
                      <SelectTrigger className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all shadow-sm hover:shadow-md">
                        <SelectValue placeholder={t('cityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[350px]">
                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                              placeholder={t('searchCity')}
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="pl-10 h-9 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-sm"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <SelectItem key={city.name} value={city.name} className="cursor-pointer">
                                {city.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              {t('noCitiesFound')}
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t('cityManualPlaceholder')}
                      className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 dark:focus:ring-green-400/20 transition-all shadow-sm hover:shadow-md"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-xl p-5 border border-purple-100 dark:border-purple-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-purple-500"></span>
              {t('contactInfo')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                  {t('phone')}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('phonePlaceholder')}
                  className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('emailPlaceholder')}
                  className="h-12 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-100 dark:border-amber-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-amber-500"></span>
              {t('descriptionSection')}
            </h3>
            
            <div>
              <Label htmlFor="description" className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 block">
                {t('descriptionField')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('descriptionPlaceholder')}
                className="bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 transition-all shadow-sm hover:shadow-md resize-none min-h-[100px]"
                rows={4}
              />
            </div>
          </div>

          {/* Opciones */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
                className="border-2 border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="is_default" className="text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer flex-1">
                {t('setAsDefault')}
              </Label>
            </div>
          </div>

          {/* Información */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2 font-medium">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">ℹ</span>
              <span><strong className="font-bold">{t('courtsInfo')}</strong> {t('courtsInfoDescription')}</span>
            </p>
          </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-11 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-all shadow-sm hover:shadow-md"
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || uploadingImage || !formData.name}
            className="h-11 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading || uploadingImage ? t('saving') : venue ? t('update') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

