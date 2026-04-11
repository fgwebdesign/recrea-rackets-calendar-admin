"use client";

import { useState, useEffect } from "react";
import { User, GraduationCap, Upload, X, ChevronDown, Award, Calendar, Wallet, Phone } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Professor, UpdateProfessorData } from '@/types/professor';
import { useTranslations } from '@/contexts/TranslationContext';

interface EditProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateProfessorData) => void;
  professor: Professor | null;
}

const SPECIALIZATIONS_BY_GROUP = [
  {
    label: 'Pádel',
    items: [
      'Todos los niveles', 'Principiantes', 'Nivel Intermedio', 'Avanzado',
      'Entrenamiento personalizado', 'Clases grupales', 'Técnica básica',
      'Técnica avanzada', 'Torneos y competencias',
    ],
  },
  {
    label: 'Fútbol',
    items: [
      'Entrenador de fútbol', 'Preparador físico', 'Técnica de fútbol',
      'Táctica de fútbol', 'Fútbol juvenil', 'Fútbol competitivo',
      'Entrenamiento de porteros',
    ],
  },
  {
    label: 'Salud y Bienestar',
    items: [
      'Fisioterapeuta', 'Masajista deportivo', 'Rehabilitación deportiva',
      'Prevención de lesiones', 'Nutrición deportiva', 'Psicología deportiva',
    ],
  },
  {
    label: 'Otros',
    items: [
      'Coordinador deportivo', 'Árbitro de pádel', 'Árbitro de fútbol',
      'Instructor de fitness', 'Yoga para deportistas', 'Pilates terapéutico',
    ],
  },
];

const DAYS_OF_WEEK = [
  { value: 'monday',    label: 'Lun' },
  { value: 'tuesday',   label: 'Mar' },
  { value: 'wednesday', label: 'Mié' },
  { value: 'thursday',  label: 'Jue' },
  { value: 'friday',    label: 'Vie' },
  { value: 'saturday',  label: 'Sáb' },
  { value: 'sunday',    label: 'Dom' },
];

export default function EditProfessorModal({ isOpen, onClose, onSubmit, professor }: EditProfessorModalProps) {
  const t = useTranslations('professors');
  const [formData, setFormData] = useState<UpdateProfessorData>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    specializations: false,
    availability: false,
    rates: false,
    contact: false,
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (professor) {
      setFormData({
        name: professor.name,
        description: professor.description,
        specializations: professor.specializations,
        experience_years: professor.experience_years,
        availability_days: professor.availability_days,
        availability_hours: professor.availability_hours,
        hourly_rate: professor.hourly_rate ?? 0,
        commission_percent: professor.commission_percent ?? null,
        instagram_handle: professor.instagram_handle || "",
        whatsapp_number: professor.whatsapp_number || "",
        is_active: professor.is_active,
        photo: undefined,
      });
      setPreviewUrl(professor.photo_url || null);
      setOpenSections({ specializations: false, availability: false, rates: false, contact: false });
    }
  }, [professor]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: t('imageTooLarge') }));
      return;
    }
    setFormData(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, photo: "" }));
  };

  const toggleSpec = (spec: string) => {
    const current = formData.specializations || [];
    setFormData(prev => ({
      ...prev,
      specializations: current.includes(spec) ? current.filter(s => s !== spec) : [...current, spec],
    }));
  };

  const toggleDay = (day: string) => {
    const current = formData.availability_days || [];
    setFormData(prev => ({
      ...prev,
      availability_days: current.includes(day) ? current.filter(d => d !== day) : [...current, day],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formData.name !== undefined && !formData.name.trim()) newErrors.name = t('nameRequired');
    if (formData.description !== undefined && !formData.description.trim()) newErrors.description = t('descriptionRequired');
    if (formData.availability_hours !== undefined && !formData.availability_hours.trim()) newErrors.availability_hours = t('availabilityHoursRequired');
    if (formData.specializations !== undefined && formData.specializations.length === 0) newErrors.specializations = t('specializationsRequired');
    if (formData.availability_days !== undefined && formData.availability_days.length === 0) newErrors.availability_days = t('availabilityDaysRequired');
    setErrors(newErrors);
    // Abrir secciones con errores automáticamente
    if (newErrors.specializations) setOpenSections(p => ({ ...p, specializations: true }));
    if (newErrors.availability_days || newErrors.availability_hours) setOpenSections(p => ({ ...p, availability: true }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professor || !validateForm()) return;
    setIsLoading(true);
    try {
      await onSubmit(professor.id, formData);
      handleClose();
    } catch (err) {
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : t('errorUpdatingProfessor'),
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

  const selectedSpecs = formData.specializations || [];
  const selectedDays = formData.availability_days || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">

        {/* ── Header ───────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            {t('editProfessor')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="divide-y divide-border">

          {/* ── Sección fija: Información principal ──────────── */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start gap-4">
              {/* Avatar upload */}
              <label className="shrink-0 cursor-pointer group">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-dashed border-border group-hover:border-violet-400 transition-colors bg-muted">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="64px"
                      unoptimized={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                </div>
                <Input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>

              {/* Nombre + Experiencia */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <div>
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('fullName')} *</Label>
                    <Input id="name" value={formData.name || ""}
                      onChange={(e) => { setFormData(p => ({ ...p, name: e.target.value })); if (errors.name) setErrors(p => ({ ...p, name: "" })); }}
                      className={`mt-1 h-8 text-sm ${errors.name ? 'border-destructive' : ''}`} />
                    {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="exp" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exp.</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input id="exp" type="number" min="0" value={formData.experience_years || 0}
                        onChange={(e) => setFormData(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-sm" />
                      <span className="text-xs text-muted-foreground shrink-0">años</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('description')} *</Label>
                  <Textarea id="description" value={formData.description || ""}
                    onChange={(e) => { setFormData(p => ({ ...p, description: e.target.value })); if (errors.description) setErrors(p => ({ ...p, description: "" })); }}
                    placeholder={t('descriptionPlaceholder')}
                    className={`mt-1 resize-none text-sm ${errors.description ? 'border-destructive' : ''}`} rows={2} />
                  {errors.description && <p className="text-xs text-destructive mt-0.5">{errors.description}</p>}
                </div>
              </div>
            </div>

            {/* Foto: revertir + error */}
            {previewUrl && previewUrl !== (professor.photo_url || null) && (
              <button type="button" onClick={() => { setFormData(p => ({ ...p, photo: undefined })); setPreviewUrl(professor.photo_url || null); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3 w-3" /> Revertir foto
              </button>
            )}
            {errors.photo && <p className="text-xs text-destructive">{errors.photo}</p>}

            {/* Estado activo inline */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
              <span className="text-sm font-medium text-foreground">{t('professorActive')}</span>
              <Switch
                id="is_active"
                checked={formData.is_active !== undefined ? formData.is_active : professor.is_active}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
              />
            </div>
          </div>

          {/* ── Acordeón: Especialidades ─────────────────────── */}
          <AccordionSection
            id="specializations"
            open={openSections.specializations}
            onToggle={() => toggleSection('specializations')}
            icon={<Award className="h-3.5 w-3.5" />}
            label="Especialidades"
            required
            badge={selectedSpecs.length > 0 ? `${selectedSpecs.length} seleccionadas` : undefined}
            hasError={!!errors.specializations}
          >
            <div className="space-y-3">
              {SPECIALIZATIONS_BY_GROUP.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((spec) => {
                      const active = selectedSpecs.includes(spec);
                      return (
                        <button key={spec} type="button" onClick={() => toggleSpec(spec)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-background text-muted-foreground border-border hover:border-violet-400 hover:text-foreground'
                          }`}>
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {errors.specializations && <p className="text-xs text-destructive mt-2">{errors.specializations}</p>}
          </AccordionSection>

          {/* ── Acordeón: Disponibilidad ─────────────────────── */}
          <AccordionSection
            id="availability"
            open={openSections.availability}
            onToggle={() => toggleSection('availability')}
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Disponibilidad"
            badge={selectedDays.length > 0 ? selectedDays.map(d => DAYS_OF_WEEK.find(x => x.value === d)?.label).join(', ') : undefined}
            hasError={!!(errors.availability_days || errors.availability_hours)}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Días *</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = selectedDays.includes(day.value);
                    return (
                      <button key={day.value} type="button" onClick={() => toggleDay(day.value)}
                        className={`w-11 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-background text-muted-foreground border-border hover:border-violet-400 hover:text-foreground'
                        }`}>
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {errors.availability_days && <p className="text-xs text-destructive mt-1">{errors.availability_days}</p>}
              </div>

              <div>
                <Label htmlFor="availability_hours" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Horario *</Label>
                <Textarea id="availability_hours" value={formData.availability_hours || ""}
                  onChange={(e) => { setFormData(p => ({ ...p, availability_hours: e.target.value })); if (errors.availability_hours) setErrors(p => ({ ...p, availability_hours: "" })); }}
                  placeholder={t('availabilityHoursPlaceholder')}
                  className={`mt-1 resize-none text-sm ${errors.availability_hours ? 'border-destructive' : ''}`} rows={2} />
                {errors.availability_hours && <p className="text-xs text-destructive mt-1">{errors.availability_hours}</p>}
              </div>
            </div>
          </AccordionSection>

          {/* ── Acordeón: Tarifas ────────────────────────────── */}
          <AccordionSection
            id="rates"
            open={openSections.rates}
            onToggle={() => toggleSection('rates')}
            icon={<Wallet className="h-3.5 w-3.5" />}
            label="Tarifas"
            badge={(formData.hourly_rate ?? 0) > 0 ? `$${formData.hourly_rate}/hr` : undefined}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor por hora ($)</Label>
                <Input id="hourly_rate" type="number" min={0} step={0.01} value={formData.hourly_rate ?? ''}
                  onChange={(e) => setFormData(p => ({ ...p, hourly_rate: parseFloat(e.target.value) || 0 }))}
                  placeholder="0" className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label htmlFor="commission_percent" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comisión club (%)</Label>
                <Input id="commission_percent" type="number" min={0} max={100} step={0.5} value={formData.commission_percent ?? ''}
                  onChange={(e) => { const v = e.target.value; setFormData(p => ({ ...p, commission_percent: v === '' ? null : parseFloat(v) || null })); }}
                  placeholder="Default del club" className="mt-1 h-8 text-sm" />
                <p className="text-xs text-muted-foreground mt-1">Vacío = default del club</p>
              </div>
            </div>
          </AccordionSection>

          {/* ── Acordeón: Contacto ───────────────────────────── */}
          <AccordionSection
            id="contact"
            open={openSections.contact}
            onToggle={() => toggleSection('contact')}
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Contacto"
            badge={formData.instagram_handle || formData.whatsapp_number ? 'Configurado' : undefined}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagram_handle" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('instagramOptional')}</Label>
                <Input id="instagram_handle" value={formData.instagram_handle || ""}
                  onChange={(e) => setFormData(p => ({ ...p, instagram_handle: e.target.value }))}
                  placeholder={t('instagramPlaceholder')} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label htmlFor="whatsapp_number" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('whatsappOptional')}</Label>
                <Input id="whatsapp_number" value={formData.whatsapp_number || ""}
                  onChange={(e) => setFormData(p => ({ ...p, whatsapp_number: e.target.value }))}
                  placeholder={t('whatsappPlaceholder')} className="mt-1 h-8 text-sm" />
              </div>
            </div>
          </AccordionSection>

          {/* ── Footer ───────────────────────────────────────── */}
          <DialogFooter className="px-6 py-4 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold min-w-[110px]">
              {isLoading ? t('saving') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-componente acordeón ───────────────────────────────────────────
interface AccordionSectionProps {
  id: string;
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  badge?: string;
  hasError?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ open, onToggle, icon, label, required, badge, hasError, children }: AccordionSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className={hasError ? 'text-destructive' : 'text-muted-foreground'}>{icon}</span>
            <span className={`text-sm font-semibold ${hasError ? 'text-destructive' : 'text-foreground'}`}>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </span>
            {badge && !open && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium">
                {badge}
              </span>
            )}
            {hasError && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                Revisar
              </span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-6 pb-5 pt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
