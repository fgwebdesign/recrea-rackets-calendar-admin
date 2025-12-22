/**
 * Sistema de Iconos para Categorías de Productos
 * Usa Lucide React para iconos profesionales
 */

import React from 'react';
import {
  GlassWater,
  Beer,
  UtensilsCrossed,
  Activity,
  CircleDot,
  Shirt,
  ShoppingBag,
  Gift,
  Package,
  Coffee,
  IceCream,
  Wine,
  Cookie,
  Candy,
  Pizza,
  Sandwich,
  Cake,
  CupSoda,
  Zap,
  Trophy,
  Medal,
  Award,
  Star,
  Heart,
  Flame,
  Crown,
} from 'lucide-react';

// Mapeo de nombres de categorías comunes a iconos
export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  // Bebidas
  'bebidas': GlassWater,
  'drinks': GlassWater,
  'bebida': GlassWater,
  'agua': GlassWater,
  'water': GlassWater,
  'jugos': GlassWater,
  'juice': GlassWater,
  'energizantes': Zap,
  'energy': Zap,
  
  // Cervezas y Alcohol
  'cervezas': Beer,
  'beers': Beer,
  'cerveza': Beer,
  'beer': Beer,
  'vino': Wine,
  'wine': Wine,
  'alcohol': Wine,
  'alcoholic': Wine,
  
  // Comida
  'comida': UtensilsCrossed,
  'food': UtensilsCrossed,
  'snacks': Cookie,
  'sandwiches': Sandwich,
  'sándwiches': Sandwich,
  'hamburguesas': UtensilsCrossed,
  'burgers': UtensilsCrossed,
  'pizza': Pizza,
  'pizzas': Pizza,
  'postres': Cake,
  'desserts': Cake,
  'dulces': Candy,
  'candies': Candy,
  'chocolate': Candy,
  'helados': IceCream,
  'ice cream': IceCream,
  'icecream': IceCream,
  
  // Paletas y Deportes
  'paletas': Activity,
  'rackets': Activity,
  'raquetas': Activity,
  'padel': Activity,
  'deportes': Trophy,
  'sports': Trophy,
  
  // Pelotas
  'pelotas': CircleDot,
  'balls': CircleDot,
  'pelota': CircleDot,
  'ball': CircleDot,
  'tubos': Package,
  'tubes': Package,
  
  // Indumentaria
  'indumentaria': Shirt,
  'apparel': Shirt,
  'ropa': Shirt,
  'clothing': Shirt,
  'remeras': Shirt,
  'shirts': Shirt,
  'shorts': Shirt,
  'gorras': Shirt,
  'caps': Shirt,
  'vestimenta': Shirt,
  
  // Accesorios
  'accesorios': ShoppingBag,
  'accessories': ShoppingBag,
  'grips': ShoppingBag,
  'muñequeras': ShoppingBag,
  'wristbands': ShoppingBag,
  'bolsos': ShoppingBag,
  'bags': ShoppingBag,
  
  // Merchandising
  'merchandising': Gift,
  'merch': Gift,
  'promocionales': Gift,
  'promotional': Gift,
  'souvenirs': Gift,
  
  // Otros
  'otros': Package,
  'other': Package,
  'others': Package,
  'varios': Package,
  'misc': Package,
};

// Lista de iconos disponibles para el selector
export const AVAILABLE_ICONS = [
  { name: 'Bebidas', icon: GlassWater, value: 'glass-water' },
  { name: 'Cerveza', icon: Beer, value: 'beer' },
  { name: 'Comida', icon: UtensilsCrossed, value: 'utensils-crossed' },
  { name: 'Paleta', icon: Activity, value: 'activity' },
  { name: 'Pelota', icon: CircleDot, value: 'circle-dot' },
  { name: 'Indumentaria', icon: Shirt, value: 'shirt' },
  { name: 'Accesorios', icon: ShoppingBag, value: 'shopping-bag' },
  { name: 'Merchandising', icon: Gift, value: 'gift' },
  { name: 'Otros', icon: Package, value: 'package' },
  { name: 'Café', icon: Coffee, value: 'coffee' },
  { name: 'Helado', icon: IceCream, value: 'ice-cream' },
  { name: 'Sandwich', icon: Sandwich, value: 'sandwich' },
  { name: 'Pizza', icon: Pizza, value: 'pizza' },
  { name: 'Postre', icon: Cake, value: 'cake' },
  { name: 'Dulces', icon: Candy, value: 'candy' },
  { name: 'Chocolate', icon: Candy, value: 'chocolate' },
  { name: 'Vino', icon: Wine, value: 'wine' },
  { name: 'Botella', icon: Wine, value: 'bottle' },
  { name: 'Jugo', icon: GlassWater, value: 'juice' },
  { name: 'Taza', icon: CupSoda, value: 'cup-soda' },
  { name: 'Té', icon: Coffee, value: 'tea' },
  { name: 'Energizante', icon: Zap, value: 'zap' },
  { name: 'Trophy', icon: Trophy, value: 'trophy' },
  { name: 'Medalla', icon: Medal, value: 'medal' },
  { name: 'Premio', icon: Award, value: 'award' },
  { name: 'Estrella', icon: Star, value: 'star' },
  { name: 'Corazón', icon: Heart, value: 'heart' },
  { name: 'Llama', icon: Flame, value: 'flame' },
  { name: 'Corona', icon: Crown, value: 'crown' },
] as const;

/**
 * Obtiene el icono apropiado para una categoría
 */
export function getCategoryIcon(iconName: string | undefined, categoryName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName && categoryName) {
    const normalizedName = categoryName.toLowerCase().trim();
    return CATEGORY_ICON_MAP[normalizedName] || Package;
  }
  
  if (!iconName) return Package;
  
  const icon = AVAILABLE_ICONS.find(i => i.value === iconName);
  return icon ? icon.icon : Package;
}

/**
 * Componente para renderizar el icono de una categoría
 */
export function CategoryIcon({ 
  iconName, 
  categoryName, 
  className = "w-6 h-6",
  color 
}: { 
  iconName?: string; 
  categoryName?: string;
  className?: string;
  color?: string;
}) {
  const IconComponent = getCategoryIcon(iconName, categoryName);
  return <IconComponent className={className} style={color ? { color } : undefined} />;
}
