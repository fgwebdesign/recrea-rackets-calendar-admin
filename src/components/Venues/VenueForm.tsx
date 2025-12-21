"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Venue } from "@/types/venue";

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
      newErrors.name = 'El nombre de la sede es requerido';
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
      <DialogContent className="bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {venue ? 'Editar Sede' : 'Nueva Sede'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium">
              Nombre de la Sede *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Sede Centro"
              className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1.5">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address" className="text-gray-700 dark:text-gray-300 font-medium">
              Dirección
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Av. Principal 1234"
              className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          <div>
            <Label htmlFor="country" className="text-gray-700 dark:text-gray-300 font-medium">
              País *
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
              <SelectTrigger className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent className="max-h-[350px]">
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Buscar país..."
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
                      {countrySearch ? 'No se encontraron países' : 'Instala country-state-city para ver países'}
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state" className="text-gray-700 dark:text-gray-300">
                Estado/Departamento
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
                  <SelectTrigger className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[350px]">
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          placeholder="Buscar estado..."
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
                          No se encontraron estados
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
                  placeholder="Ingresa el estado/departamento"
                  className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              )}
            </div>
            <div>
              <Label htmlFor="city" className="text-gray-700 dark:text-gray-300">
                Ciudad
              </Label>
              {availableCities.length > 0 ? (
                <Select
                  value={formData.city}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, city: value }));
                    setCitySearch('');
                  }}
                >
                  <SelectTrigger className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[350px]">
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          placeholder="Buscar ciudad..."
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
                          No se encontraron ciudades
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
                  placeholder="Ingresa la ciudad"
                  className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium">
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+598 99 123 456"
                className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="sede@club.com"
                className="mt-2 h-11 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-medium">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Nuestra sede ubicada en el centro de la ciudad..."
              className="mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
            />
            <Label htmlFor="is_default" className="text-gray-700 dark:text-gray-300 cursor-pointer">
              Establecer como sede por defecto
            </Label>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              🎾 <strong>Canchas de esta sede:</strong> Las canchas se asignan desde la sección Canchas.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
            >
              {isLoading ? 'Guardando...' : venue ? 'Actualizar Sede' : 'Guardar Sede'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

