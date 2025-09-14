"use client";

import { useState, useEffect } from "react";
import { User, ImageIcon, GraduationCap, Trophy, Heart, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Professor, UpdateProfessorData } from '@/types/professor';

interface EditProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateProfessorData) => void;
  professor: Professor | null;
}

const SPECIALIZATIONS = [
  // Pádel
  'Todos los niveles', 'Principiantes', 'Nivel Intermedio', 'Avanzado',
  'Entrenamiento personalizado', 'Clases grupales', 'Técnica básica', 
  'Técnica avanzada', 'Torneos y competencias',
  // Fútbol
  'Entrenador de fútbol', 'Preparador físico', 'Técnica de fútbol', 
  'Táctica de fútbol', 'Fútbol juvenil', 'Fútbol competitivo', 
  'Entrenamiento de porteros',
  // Salud y Bienestar
  'Fisioterapeuta', 'Masajista deportivo', 'Rehabilitación deportiva',
  'Prevención de lesiones', 'Nutrición deportiva', 'Psicología deportiva',
  // Otros Servicios
  'Coordinador deportivo', 'Árbitro de pádel', 'Árbitro de fútbol',
  'Instructor de fitness', 'Yoga para deportistas', 'Pilates terapéutico'
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

export default function EditProfessorModal({ isOpen, onClose, onSubmit, professor }: EditProfessorModalProps) {
  const [formData, setFormData] = useState<UpdateProfessorData>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (professor) {
      setFormData({
        name: professor.name,
        description: professor.description,
        specializations: professor.specializations,
        experience_years: professor.experience_years,
        availability_days: professor.availability_days,
        availability_hours: professor.availability_hours,
        instagram_handle: professor.instagram_handle || "",
        whatsapp_number: professor.whatsapp_number || "",
        is_active: professor.is_active,
        photo: undefined
      });
      setPreviewUrl(professor.photo_url || null);
    }
  }, [professor]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: "La imagen no debe superar los 5MB" }));
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, photo: "" }));
    }
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    const currentSpecializations = formData.specializations || [];
    setFormData(prev => ({
      ...prev,
      specializations: checked 
        ? [...currentSpecializations, specialization]
        : currentSpecializations.filter(s => s !== specialization)
    }));
  };

  const handleDayChange = (day: string, checked: boolean) => {
    const currentDays = formData.availability_days || [];
    setFormData(prev => ({
      ...prev,
      availability_days: checked 
        ? [...currentDays, day]
        : currentDays.filter(d => d !== day)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }
    if (formData.description !== undefined && !formData.description.trim()) {
      newErrors.description = "La descripción es requerida";
    }
    if (formData.availability_hours !== undefined && !formData.availability_hours.trim()) {
      newErrors.availability_hours = "Los horarios de disponibilidad son requeridos";
    }
    if (formData.specializations !== undefined && formData.specializations.length === 0) {
      newErrors.specializations = "Debe seleccionar al menos una especialidad";
    }
    if (formData.availability_days !== undefined && formData.availability_days.length === 0) {
      newErrors.availability_days = "Debe seleccionar al menos un día de disponibilidad";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!professor) return;
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(professor.id, formData);
      handleClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar el profesor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setPreviewUrl(null);
    setErrors({});
    onClose();
  };

  if (!professor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 max-w-4xl max-h-[95vh] overflow-y-auto border-2 border-blue-200 dark:border-blue-800 shadow-2xl custom-scrollbar">
        <DialogHeader className="pb-8 px-8 pt-8">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            Editar profesor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 px-8 pb-8">
          {/* Información Personal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información Personal</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium">
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                  }}
                  placeholder="Ingresa el nombre completo del profesor"
                  className={`mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500 dark:border-red-400' : ''
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Años de experiencia */}
              <div>
                <Label htmlFor="experience_years" className="text-gray-700 dark:text-gray-300 font-medium">
                  Años de experiencia
                </Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  className="mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-6">
              <Label htmlFor="description" className="text-gray-700 dark:text-gray-300 font-medium">
                Descripción *
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                }}
                placeholder="Describe la experiencia y especialidades del profesor"
                className={`mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500 dark:border-red-400' : ''
                }`}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Especialidades */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Especialidades *</h3>
            </div>
            
            <div className="space-y-6">
              {/* Pádel */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-blue-800 dark:text-blue-300">Pádel</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SPECIALIZATIONS.slice(0, 9).map((spec) => (
                    <div key={spec} className="flex items-center space-x-3 bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                      <Checkbox
                        id={spec}
                        checked={(formData.specializations || []).includes(spec)}
                        onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                        className="border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <Label htmlFor={spec} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                        {spec}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fútbol */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-green-500 rounded-lg">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-green-800 dark:text-green-300">Fútbol</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SPECIALIZATIONS.slice(9, 16).map((spec) => (
                    <div key={spec} className="flex items-center space-x-3 bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors">
                      <Checkbox
                        id={spec}
                        checked={(formData.specializations || []).includes(spec)}
                        onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                        className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <Label htmlFor={spec} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                        {spec}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salud y Bienestar */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-purple-500 rounded-lg">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-purple-800 dark:text-purple-300">Salud y Bienestar</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SPECIALIZATIONS.slice(16, 22).map((spec) => (
                    <div key={spec} className="flex items-center space-x-3 bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                      <Checkbox
                        id={spec}
                        checked={(formData.specializations || []).includes(spec)}
                        onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                        className="border-purple-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label htmlFor={spec} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                        {spec}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Otros Servicios */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-orange-500 rounded-lg">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-orange-800 dark:text-orange-300">Otros Servicios</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SPECIALIZATIONS.slice(22).map((spec) => (
                    <div key={spec} className="flex items-center space-x-3 bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
                      <Checkbox
                        id={spec}
                        checked={(formData.specializations || []).includes(spec)}
                        onCheckedChange={(checked) => handleSpecializationChange(spec, checked as boolean)}
                        className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor={spec} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                        {spec}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {errors.specializations && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-3">{errors.specializations}</p>
            )}
          </div>

          {/* Disponibilidad y Contacto */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disponibilidad y Contacto</h3>
            </div>
            
            <div className="space-y-6">
              {/* Días de disponibilidad */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300 font-medium">
                  Días de disponibilidad *
                </Label>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                      <Checkbox
                        id={day.value}
                        checked={(formData.availability_days || []).includes(day.value)}
                        onCheckedChange={(checked) => handleDayChange(day.value, checked as boolean)}
                        className="border-indigo-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                      />
                      <Label htmlFor={day.value} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.availability_days && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">{errors.availability_days}</p>
                )}
              </div>

              {/* Horarios de disponibilidad */}
              <div>
                <Label htmlFor="availability_hours" className="text-gray-700 dark:text-gray-300 font-medium">
                  Horarios de disponibilidad *
                </Label>
                <Textarea
                  id="availability_hours"
                  value={formData.availability_hours || ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, availability_hours: e.target.value }));
                    if (errors.availability_hours) setErrors(prev => ({ ...prev, availability_hours: "" }));
                  }}
                  placeholder="Ej: Lunes a Viernes: 9:00 - 18:00, Sábados: 10:00 - 14:00"
                  className={`mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.availability_hours ? 'border-red-500 dark:border-red-400' : ''
                  }`}
                  rows={2}
                />
                {errors.availability_hours && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.availability_hours}</p>
                )}
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="instagram_handle" className="text-gray-700 dark:text-gray-300 font-medium">
                    Instagram (opcional)
                  </Label>
                  <Input
                    id="instagram_handle"
                    value={formData.instagram_handle || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
                    placeholder="@usuario_instagram"
                    className="mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp_number" className="text-gray-700 dark:text-gray-300 font-medium">
                    WhatsApp (opcional)
                  </Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="+54 9 11 1234-5678"
                    className="mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Estado activo */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <Label htmlFor="is_active" className="text-gray-700 dark:text-gray-300 font-medium">
                  Profesor activo
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active !== undefined ? formData.is_active : professor.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Foto */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-pink-100 dark:border-pink-900/30 hover:border-pink-200 dark:hover:border-pink-800 transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Foto del profesor</h3>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ImageIcon className="h-5 w-5 text-pink-500 dark:text-pink-400 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-pink-800 dark:text-pink-300">
                    Recomendación para la imagen:
                  </h4>
                  <ul className="mt-1 text-sm text-pink-700 dark:text-pink-400 space-y-1">
                    <li>• Tamaño recomendado: 400 x 400 píxeles</li>
                    <li>• Formato: PNG o JPG</li>
                    <li>• Máximo 5MB</li>
                  </ul>
                  <p className="mt-2 text-sm text-pink-600 dark:text-pink-400">
                    Usar estas dimensiones asegurará que la foto se vea perfectamente en el portal.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-pink-400 dark:hover:border-pink-500 transition-colors">
              <div className="flex flex-col items-center">
                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-40 w-40 object-cover rounded-lg shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, photo: undefined }));
                          setPreviewUrl(professor.photo_url || null);
                        }}
                        className="text-white hover:text-red-400 bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full mb-3">
                        <User className="h-12 w-12 text-pink-500 dark:text-pink-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Click para subir o arrastrar imagen
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        PNG, JPG (max. 5MB)
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
            {errors.photo && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-2">{errors.photo}</p>
            )}
          </div>

          <DialogFooter className="gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
