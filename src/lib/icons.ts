/**
 * Sistema de Iconografía Profesional
 * Reemplaza emojis con iconos de Lucide React para mayor profesionalidad
 */

import React from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Shirt, 
  Target, 
  Zap, 
  Activity, 
  Award, 
  Star, 
  Flame, 
  Sparkles,
  PartyPopper,
  Gamepad2,
  Timer,
  Shield,
  Crown,
  Medal,
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  FileText,
  Settings,
  Bell,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Minus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  Upload,
  Share,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  RefreshCw,
  RotateCcw,
  Save,
  Loader2,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  Percent,
  Calculator,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X,
  Check,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Wind,
  Mountain,
  Home,
  Building,
  Store,
  School,
  Factory,
  Tent,
  Umbrella,
  Construction,
  Building2,
  User,
  Music,
  Guitar,
  Piano,
  Film,
  Ticket,
  Headphones,
  Palette,
  GraduationCap,
  Ribbon,
  Sliders,
  Fish,
  TreePine,
  Gift,
  Cake,
  Lightbulb
} from 'lucide-react';

/**
 * Mapeo de emojis a iconos de Lucide React
 * Mantiene la semántica pero con iconos profesionales
 */
export const ICON_MAP = {
  // Deportes y Padel
  '🎾': Trophy,           // Tenis/Padel
  '🏆': Trophy,           // Trofeo
  '🥇': Medal,            // Medalla de oro
  '🥈': Medal,            // Medalla de plata
  '🥉': Medal,            // Medalla de bronce
  '🏅': Award,            // Premio
  '👕': Shirt,            // Camiseta/Remera
  '👥': Users,            // Jugadores/Equipo
  '🎯': Target,           // Objetivo/Meta
  
  // Éxito y Celebración
  '🎉': PartyPopper,      // Celebración
  '✅': CheckCircle,      // Éxito/Confirmado
  '❌': XCircle,          // Error/Cancelado
  '🌟': Star,             // Destacado
  '⭐': Star,             // Estrella
  '🔥': Flame,            // Popularidad/Éxito
  '💯': Target,           // Perfecto/100%
  '🎊': Sparkles,         // Celebración especial
  
  // Acciones y Estados
  '🚀': Zap,              // Lanzamiento/Acción rápida
  '💪': Shield,           // Fuerza/Protección
  '🔧': Settings,         // Configuración/Herramientas
  '📊': BarChart3,        // Estadísticas/Datos
  '🔍': Search,           // Búsqueda/Investigación
  '🎨': Palette,          // Diseño/Creatividad
  '💡': Lightbulb,        // Idea/Inspiración
  
  // Tiempo y Calendario
  '⏰': Clock,            // Tiempo/Hora
  '📅': Calendar,        // Fecha/Calendario
  '🕒': Clock,           // Reloj
  '⏱️': Timer,           // Cronómetro
  
  // Usuarios y Personas
  '👤': User,             // Usuario individual
  '👨': User,             // Hombre
  '👩': User,             // Mujer
  '👶': User,             // Niño
  
  // Dinero y Pagos
  '💰': DollarSign,       // Dinero
  '💳': CreditCard,       // Tarjeta de crédito
  '💵': DollarSign,       // Billete
  '💸': DollarSign,       // Gasto
  
  // Comunicación
  '📧': Mail,             // Email
  '📱': Phone,            // Teléfono
  '💬': MessageCircle,    // Mensaje
  '📢': Bell,             // Notificación
  
  // Ubicación y Navegación
  '📍': MapPin,           // Ubicación
  '🌍': Globe,            // Mundo/Global
  '🏠': Home,             // Casa/Inicio
  
  // Seguridad y Acceso
  '🔒': Lock,             // Bloqueado
  '🔓': Unlock,           // Desbloqueado
  '👁️': Eye,              // Ver
  '👁️‍🗨️': EyeOff,         // Ocultar
  
  // Acciones de Archivo
  '📁': Folder,           // Carpeta
  '📄': FileText,         // Documento
  '💾': Save,             // Guardar
  '📤': Upload,           // Subir
  '📥': Download,         // Descargar
  
  // Estados de Sistema
  '⚡': Zap,              // Rápido/Energía
  '🔄': RefreshCw,        // Actualizar
  '⏳': Loader2,          // Cargando
  '⚠️': AlertTriangle,    // Advertencia
  '❓': HelpCircle,       // Ayuda
  'ℹ️': Info,             // Información
  
  // Emociones y Reacciones
  '👍': ThumbsUp,         // Me gusta
  '👎': ThumbsDown,       // No me gusta
  '❤️': Heart,            // Amor/Favorito
  '🎈': PartyPopper,     // Celebración
  '🎁': Gift,             // Regalo
  '🎂': Cake,             // Cumpleaños
  
  // Deportes específicos
  '🏀': Trophy,           // Baloncesto
  '⚽': Trophy,           // Fútbol
  '🎮': Gamepad2,         // Videojuego
  
  // Música y Entretenimiento
  '🎵': Music,            // Música
  '🎶': Music,            // Notas musicales
  '🎸': Guitar,           // Guitarra
  '🎹': Piano,            // Piano
  '🎧': Headphones,       // Auriculares
  
  // Construcción y Lugares
  '🏗': Construction,     // Construcción
  '🏘': Building,         // Edificios
  '🏙': Building2,        // Ciudad
  '🏚': Home,             // Casa abandonada
  '🏛': Building,         // Edificio clásico
  '🏜': Mountain,         // Desierto
  '🏞': Mountain,         // Parque nacional
  '🏡': Home,             // Casa con jardín
  '🏢': Building,         // Oficina
  '🏥': Building,         // Hospital
  '🏦': Building,         // Banco
  '🏨': Building,         // Hotel
  '🏪': Store,            // Tienda
  '🏫': School,          // Escuela
  '🏬': Building,         // Grandes almacenes
  '🏭': Factory,          // Fábrica
  
  // Otros importantes
  '🏷': Tag,              // Etiqueta
  '🎓': GraduationCap,    // Graduación
  '🎖': Medal,            // Medalla
  '🎗': Ribbon,           // Cinta
  '🎙': Mic,              // Micrófono
  '🎚': Sliders,          // Controles
  '🎛': Sliders,          // Controles
  '🎜': Sliders,          // Controles
  '🎝': Sliders,          // Controles
  '🎞': Film,             // Película
  '🎟': Ticket,           // Boleto
  '🎣': Fish,             // Pesca
  '🎤': Mic,              // Micrófono
  '🎥': Video,            // Cámara de video
  '🎦': Video,            // Proyector
  '🎫': Ticket,           // Boleto
  '🎬': Film,             // Claqueta
  '🎭': Circle,           // Máscara
  '🎱': Circle,           // Bola 8
  '🎲': Circle,           // Dado
  '🎴': Circle,           // Cartas
  '🎽': Shirt,            // Camiseta deportiva
  '🏁': Flag,             // Bandera de meta
  '🏃': User,             // Correr
  '🏄': User,             // Surf
  '🏊': User,             // Natación
  '🏋': User,             // Levantamiento de pesas
  '🏌': User,             // Golf   
  '🏍': Trophy,           // Motocicleta
  '🏎': Trophy,           // Carrera de autos
  '🏏': Trophy,           // Cricket
  '🏐': Trophy,           // Voleibol
  '🏑': Trophy,           // Hockey
  '🏒': Trophy,           // Hockey sobre hielo
  '🏓': Trophy,           // Ping pong
  '🏔': Mountain,         // Montaña
  '🏕': Tent,             // Camping
  '🏖': Umbrella,         // Playa
  '🏟': Building,         // Estadio
  '🏮': Circle,           // Linterna
  '🏯': Building,         // Castillo japonés
  '🏰': Building,         // Castillo
  '🏱': Flag,             // Bandera blanca
  '🏲': Flag,             // Bandera negra
  '🏳': Flag,             // Bandera blanca
  '🏴': Flag,             // Bandera negra
  '🏵': Medal,            // Medalla
  '🏶': Flag,             // Bandera
  '🏸': Trophy,           // Bádminton
  '🏹': Trophy,           // Arco y flecha
  '🏺': Circle,           // Jarrón
  '🏻': User,              // Mano clara
  '🏼': User,              // Mano medio clara
  '🏽': User,              // Mano medio
  '🏾': User,              // Mano medio oscura
  '🏿': User,              // Mano oscura
} as const;

/**
 * Función helper para obtener el icono apropiado
 */
export function getIcon(emoji: string) {
  return ICON_MAP[emoji as keyof typeof ICON_MAP] || Info;
}

/**
 * Función helper para renderizar iconos con tamaño consistente
 */
export function renderIcon(emoji: string, size: number = 16, className?: string) {
  const IconComponent = getIcon(emoji);
  return React.createElement(IconComponent, { size, className });
}