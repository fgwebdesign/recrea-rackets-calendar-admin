import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Pencil, User, Instagram, Phone, Calendar, Award, Clock } from 'lucide-react';
import { Professor } from '@/types/professor';
import { useTranslations } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';

interface ProfessorCardProps {
  professor: Professor;
  onDelete: (professor: Professor) => void;
  onEdit: (professor: Professor) => void;
  priority?: boolean;
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

export default function ProfessorCard({ professor, onDelete, onEdit, priority = false }: ProfessorCardProps) {
  const t = useTranslations('professors');
  const tDateTime = useTranslations('datetime');

  const daysMap: Record<string, string> = {
    monday: tDateTime('monday'),
    tuesday: tDateTime('tuesday'),
    wednesday: tDateTime('wednesday'),
    thursday: tDateTime('thursday'),
    friday: tDateTime('friday'),
    saturday: tDateTime('saturday'),
    sunday: tDateTime('sunday'),
  };

  return (
    <article className="bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-lg hover:border-border transition-all duration-200 overflow-hidden group">
      {/* Foto */}
      <div className="relative w-full aspect-[4/3] bg-muted/50 overflow-hidden">
        {professor.photo_url ? (
          <Image
            src={getImageUrl(professor.photo_url)}
            alt={professor.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            quality={85}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/80">
            <User className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}

        <span
          className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${
            professor.is_active
              ? 'bg-emerald-500/90 text-white'
              : 'bg-slate-500/90 text-white'
          }`}
        >
          {professor.is_active ? t('active') : t('inactive')}
        </span>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-200">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(professor)}
              className="p-2.5 rounded-full bg-white/95 text-slate-700 hover:bg-primary hover:text-primary-foreground shadow-md transition-colors"
              type="button"
              aria-label={t('editProfessor')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(professor)}
              className="p-2.5 rounded-full bg-white/95 text-slate-700 hover:bg-destructive hover:text-destructive-foreground shadow-md transition-colors"
              type="button"
              aria-label="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Nombre y descripción */}
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {professor.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {professor.description}
          </p>
        </div>

        {/* Especialidades: tinte azul ordenado */}
        {professor.specializations?.length > 0 && (
          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 p-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              {t('specializations')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {professor.specializations.slice(0, 4).map((spec, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-blue-100/90 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200/60 dark:border-blue-800/40"
                >
                  {spec}
                </span>
              ))}
              {professor.specializations.length > 4 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  +{professor.specializations.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Experiencia y disponibilidad: bloque violeta/slate suave */}
        <div className="rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100/80 dark:border-violet-900/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100/80 dark:bg-violet-900/40">
              <Award className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-sm text-foreground">
              <strong>{professor.experience_years}</strong>{' '}
              <span className="text-muted-foreground">{t('yearsExperience')}</span>
            </span>
          </div>

          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100/80 dark:bg-teal-900/30">
              <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5">
                {professor.availability_days.map((day, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-md bg-teal-100/90 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-200/50 dark:border-teal-800/30"
                  >
                    {daysMap[day] || day}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {professor.availability_hours}
              </p>
            </div>
          </div>
        </div>

        {/* Valor por hora: destacado pero elegante */}
        {(professor.hourly_rate ?? 0) > 0 && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-3 py-2.5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-0.5">
              Valor por hora
            </p>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              ${professor.hourly_rate} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-500">/ hora</span>
            </p>
          </div>
        )}

        {/* CTA principal */}
        <Link href={`/professors/classes?professor_id=${professor.id}`} className="block">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 text-foreground"
          >
            <Clock className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
            Ver clases / Registrar clase
          </Button>
        </Link>

        {/* Contacto: tintes suaves por tipo */}
        {(professor.instagram_handle || professor.whatsapp_number) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
            {professor.instagram_handle && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-100/80 dark:border-rose-900/30">
                <Instagram className="h-3.5 w-3.5" />
                @{professor.instagram_handle}
              </span>
            )}
            {professor.whatsapp_number && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100/80 dark:border-emerald-900/30">
                <Phone className="h-3.5 w-3.5" />
                {professor.whatsapp_number}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
