"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2 } from "lucide-react";
import { Venue } from "@/types/venue";
import { useTranslations } from '@/contexts/TranslationContext';

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
      });
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
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
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
            disabled={isLoading || !formData.name}
            className="h-11 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? t('saving') : venue ? t('update') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

