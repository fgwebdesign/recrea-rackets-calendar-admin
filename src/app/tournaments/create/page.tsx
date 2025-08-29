'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, TrophyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { tournamentService } from '@/services/tournamentService'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

interface Court {
  id: string
  name: string
}

interface FormErrors {
  name?: string
  categories?: string
  start_date?: string
  end_date?: string
  courts_available?: string
  tournament_type?: string
  description?: string
  inscription_cost?: string
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    name: '',
    categories: [] as string[],
    start_date: '',
    end_date: '',
    courts_available: 1,
    tournament_type: 'NINE_PLAYERS' as 'NINE_PLAYERS' | 'TWELVE_PLAYERS',
    description: '',
    tournament_location: '',
    tournament_address: '',
    tournament_club_name: 'Recrea Padel Club',
    inscription_cost: 0,
    time_slots: [
      [9, 13],   // mañana
      [14, 22],  // tarde/noche
    ],
    group_time_slots: [
      { id: 'fri_night', day: 'friday', start: '18:00', end: '23:30', label: 'Viernes noche' },
      { id: 'sat_morning', day: 'saturday', start: '09:00', end: '13:00', label: 'Sábado mañana' },
      { id: 'sat_afternoon', day: 'saturday', start: '14:00', end: '22:00', label: 'Sábado tarde' },
    ]
  })

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
        if (!categoriesResponse.ok) throw new Error('Error al cargar categorías')
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)

        // Fetch courts
        const courtsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courts`)
        if (!courtsResponse.ok) throw new Error('Error al cargar canchas')
        const courtsData = await courtsResponse.json()
        setCourts(courtsData)
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos iniciales"
        })
      }
    }

    fetchInitialData()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Selecciona al menos una categoría'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es requerida'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'La fecha de fin es requerida'
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio'
    }

    if (!formData.courts_available || formData.courts_available < 1) {
      newErrors.courts_available = 'Debe haber al menos una cancha disponible'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }

    if (formData.inscription_cost < 0) {
      newErrors.inscription_cost = 'El costo no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, completa todos los campos requeridos correctamente"
      })
      return
    }

    setLoading(true)

    try {
      // Estructurar datos según espera el backend
      const tournamentData = {
        name: formData.name,
        category_id: formData.categories[0], // Por ahora usamos la primera categoría
        start_date: formData.start_date,
        end_date: formData.end_date,
        courts_available: formData.courts_available,
        tournament_type: formData.tournament_type,
        time_slots: formData.time_slots,
        group_time_slots: formData.group_time_slots,
        tournament_info: {
          description: formData.description,
          tournament_location: formData.tournament_location,
          tournament_address: formData.tournament_address,
          tournament_club_name: formData.tournament_club_name,
          inscription_cost: formData.inscription_cost,
          rules: formData.description, // Usamos la descripción como reglas por ahora
          signup_limit_date: formData.start_date,
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tournaments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(tournamentData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear el torneo')
      }

      toast({
        title: "¡Éxito!",
        description: "El torneo se ha creado correctamente"
      })

      router.push('/tournaments')
    } catch (error) {
      console.error('Error creating tournament:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al crear el torneo'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-semibold">Crear Nuevo Torneo</h1>
            <p className="text-sm text-muted-foreground">
              Configure los detalles de su nuevo torneo.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={cn(errors.name && "text-destructive")}>
                Nombre del Torneo
                <span className="text-destructive"> *</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: Torneo de Verano 2024"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className={cn(errors.categories && "text-destructive")}>
                Categorías
                <span className="text-destructive"> *</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={formData.categories.includes(category.id) ? "default" : "outline"}
                    className="w-full"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
              {errors.categories && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {errors.categories}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className={cn(errors.start_date && "text-destructive")}>
                  Fecha de Inicio
                  <span className="text-destructive"> *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className={cn(errors.start_date && "border-destructive")}
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.start_date && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.start_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className={cn(errors.end_date && "text-destructive")}>
                  Fecha de Fin
                  <span className="text-destructive"> *</span>
                </Label>
                <div className="relative">
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className={cn(errors.end_date && "border-destructive")}
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.end_date && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courts" className={cn(errors.courts_available && "text-destructive")}>
                  Canchas Disponibles
                  <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={formData.courts_available.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, courts_available: parseInt(value) }))}
                >
                  <SelectTrigger className={cn(errors.courts_available && "border-destructive")}>
                    <SelectValue placeholder="Selecciona las canchas" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court, index) => (
                      <SelectItem key={court.id} value={(index + 1).toString()}>
                        {index + 1} {index === 0 ? 'cancha' : 'canchas'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.courts_available && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.courts_available}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className={cn(errors.tournament_type && "text-destructive")}>
                  Tipo de Torneo
                  <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={formData.tournament_type}
                  onValueChange={(value: 'NINE_PLAYERS' | 'TWELVE_PLAYERS') => 
                    setFormData(prev => ({ ...prev, tournament_type: value }))
                  }
                >
                  <SelectTrigger className={cn(errors.tournament_type && "border-destructive")}>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NINE_PLAYERS">9 Jugadores</SelectItem>
                    <SelectItem value="TWELVE_PLAYERS">12 Jugadores</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tournament_type && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.tournament_type}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={cn(errors.description && "text-destructive")}>
                Descripción
                <span className="text-destructive"> *</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe los detalles importantes del torneo..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={cn("min-h-[100px]", errors.description && "border-destructive")}
              />
              {errors.description && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscription_cost" className={cn(errors.inscription_cost && "text-destructive")}>
                Costo de Inscripción
                <span className="text-destructive"> *</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input
                  id="inscription_cost"
                  type="number"
                  min="0"
                  value={formData.inscription_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, inscription_cost: parseInt(e.target.value) }))}
                  className={cn("pl-7", errors.inscription_cost && "border-destructive")}
                />
              </div>
              {errors.inscription_cost && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {errors.inscription_cost}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Torneo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}