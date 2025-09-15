import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Pencil, User, Instagram, Phone, Calendar, Award } from "lucide-react";
import { Professor } from '@/types/professor';
import { useTranslations } from '@/contexts/TranslationContext';

interface ProfessorCardProps {
  professor: Professor;
  onDelete: (professor: Professor) => void;
  onEdit: (professor: Professor) => void;
}

const DEFAULT_PROFESSOR_IMAGE = '/assets/user.png';

function getImageUrl(photoUrl: string | null) {
  if (!photoUrl) return DEFAULT_PROFESSOR_IMAGE;
  try {
    if (photoUrl.includes('supabase.co')) return photoUrl;
    return DEFAULT_PROFESSOR_IMAGE;
  } catch {
    return DEFAULT_PROFESSOR_IMAGE;
  }
}

export default function ProfessorCard({ professor, onDelete, onEdit }: ProfessorCardProps) {
  const t = useTranslations('professors');
  const tDateTime = useTranslations('datetime');
  
  const daysMap = {
    monday: tDateTime('monday'),
    tuesday: tDateTime('tuesday'), 
    wednesday: tDateTime('wednesday'),
    thursday: tDateTime('thursday'),
    friday: tDateTime('friday'),
    saturday: tDateTime('saturday'),
    sunday: tDateTime('sunday')
  };

  // Función para determinar el color de las especialidades basado en el tipo
  const getSpecializationColor = (spec: string) => {
    const padelSpecs = ['Todos los niveles', 'Principiantes', 'Nivel Intermedio', 'Avanzado', 'Entrenamiento personalizado', 'Clases grupales', 'Técnica básica', 'Técnica avanzada', 'Torneos y competencias'];
    const futbolSpecs = ['Entrenador de fútbol', 'Preparador físico', 'Técnica de fútbol', 'Táctica de fútbol', 'Fútbol juvenil', 'Fútbol competitivo', 'Entrenamiento de porteros'];
    const saludSpecs = ['Fisioterapeuta', 'Masajista deportivo', 'Rehabilitación deportiva', 'Prevención de lesiones', 'Nutrición deportiva', 'Psicología deportiva'];
    
    if (padelSpecs.includes(spec)) {
      return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
    } else if (futbolSpecs.includes(spec)) {
      return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 border border-green-200 dark:border-green-800';
    } else if (saludSpecs.includes(spec)) {
      return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 dark:from-purple-900/30 dark:to-violet-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800';
    } else {
      return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-200 border border-orange-200 dark:border-orange-800';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg hover:shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 group">
      {/* Header con foto */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        {professor.photo_url ? (
          <Image
            src={getImageUrl(professor.photo_url)}
            alt={professor.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full">
              <User className="h-16 w-16 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        )}
        
        {/* Status badge mejorado */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
            professor.is_active 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-800' 
              : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-200 dark:shadow-red-800'
          }`}>
            {professor.is_active ? t('active') : t('inactive')}
          </span>
        </div>

        {/* Overlay con botones de acción */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-3">
            <button
              onClick={() => onEdit(professor)}
              className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all duration-200"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(professor)}
              className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido de la tarjeta */}
      <div className="p-6">
        {/* Nombre y descripción */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {professor.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {professor.description}
          </p>
        </div>

        {/* Especialidades mejoradas */}
        {professor.specializations && professor.specializations.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="p-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg mr-2">
                <Award className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('specializations')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {professor.specializations.map((spec, index) => (
                <span 
                  key={index}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getSpecializationColor(spec)}`}
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experiencia mejorada */}
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center">
            <div className="p-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-2">
              <Award className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
              <strong className="text-lg">{professor.experience_years}</strong> {t('yearsExperience')}
            </span>
          </div>
        </div>

        {/* Disponibilidad mejorada */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-2">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('available')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {professor.availability_days.map((day, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-medium rounded-full dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 border border-green-200 dark:border-green-800"
              >
                {daysMap[day as keyof typeof daysMap] || day}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
            {professor.availability_hours}
          </p>
        </div>

        {/* Contacto mejorado */}
        <div className="space-y-2">
          {professor.instagram_handle && (
            <div className="flex items-center p-2 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <div className="p-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg mr-2">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-pink-800 dark:text-pink-200">@{professor.instagram_handle}</span>
            </div>
          )}
          {professor.whatsapp_number && (
            <div className="flex items-center p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-2">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">{professor.whatsapp_number}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}