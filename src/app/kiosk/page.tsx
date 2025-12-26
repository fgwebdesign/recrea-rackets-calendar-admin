'use client';

import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Wallet, Banknote } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useSales } from "@/hooks/useSales";
import { useVenues } from "@/hooks/useVenues";
import { Product, CreateSaleData } from "@/types/kiosk";
import { useTranslations } from '@/contexts/TranslationContext';
import { toast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { CategoryIcon } from "@/lib/categoryIcons";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  selectedSize?: {
    size: string;
    size_type: 'clothing' | 'shoes';
    size_id?: string;
    stock_quantity: number;
  };
}

export default function KioskPOSPage() {
  const t = useTranslations('kiosk');
  const tCommon = useTranslations('common');
  const { products, fetchProducts } = useProducts({ is_active: true });
  const { categories } = useProductCategories();
  const { createSale } = useSales();
  const { venues } = useVenues({ includeCourts: false });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'mercadopago' | 'pending'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [saleContext, setSaleContext] = useState<'general' | 'tournament' | 'league' | 'class' | 'booking'>('general');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [selectedSizeForAdd, setSelectedSizeForAdd] = useState<{size: string; size_type: 'clothing' | 'shoes'; size_id?: string; stock_quantity: number} | null>(null);
  
  const PRODUCTS_PER_PAGE = 8;

  useEffect(() => {
    fetchProducts({ is_active: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Establecer sede por defecto cuando las sedes se carguen
    if (venues.length > 0 && !selectedVenue) {
      const defaultVenue = venues.find(v => v.is_default) || venues[0];
      if (defaultVenue) {
        setSelectedVenue(defaultVenue.id);
      }
    }
  }, [venues, selectedVenue]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory && product.category_id !== selectedCategory) return false;
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (product.track_inventory && product.stock_quantity <= 0) return false;
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Calcular productos paginados
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll al inicio del grid de productos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: Product, selectedSize?: {size: string; size_type: 'clothing' | 'shoes'; size_id?: string; stock_quantity: number}) => {
    // Si el producto tiene talles, abrir modal de selección
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setProductToAdd(product);
      setShowSizeModal(true);
      return;
    }

    if (product.track_inventory) {
      // Si tiene talles, verificar stock del talle seleccionado
      if (product.sizes && product.sizes.length > 0 && selectedSize) {
        if (selectedSize.stock_quantity <= 0) {
          toast({
            title: t('common.error'),
            description: t('pos.noStockForSize').replace('{size}', selectedSize.size),
            variant: "destructive",
          });
          return;
        }
      } else if (product.stock_quantity <= 0) {
        toast({
          title: t('common.error'),
          description: t('pos.noStockAvailable'),
          variant: "destructive",
        });
        return;
      }
    }

    setCart(prev => {
      // Si tiene talles, buscar por producto Y talle
      if (product.sizes && product.sizes.length > 0 && selectedSize) {
        const existingItem = prev.find(item => 
          item.product.id === product.id && 
          item.selectedSize?.size === selectedSize.size &&
          item.selectedSize?.size_type === selectedSize.size_type
        );
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (selectedSize.stock_quantity < newQuantity) {
            toast({
              title: t('common.error'),
              description: t('pos.insufficientStockForSize').replace('{size}', selectedSize.size).replace('{available}', selectedSize.stock_quantity.toString()),
              variant: "destructive",
            });
            return prev;
          }
          return prev.map(item =>
            item.product.id === product.id && 
            item.selectedSize?.size === selectedSize.size &&
            item.selectedSize?.size_type === selectedSize.size_type
              ? { ...item, quantity: newQuantity }
              : item
          );
        } else {
          return [...prev, { 
            product, 
            quantity: 1, 
            unit_price: product.price,
            selectedSize: {
              size: selectedSize.size,
              size_type: selectedSize.size_type,
              size_id: selectedSize.size_id,
              stock_quantity: selectedSize.stock_quantity
            }
          }];
        }
      } else {
        // Producto sin talles
        const existingItem = prev.find(item => item.product.id === product.id && !item.selectedSize);
        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (product.track_inventory && newQuantity > product.stock_quantity) {
            return prev;
          }
          return prev.map(item =>
            item.product.id === product.id && !item.selectedSize
              ? { ...item, quantity: newQuantity }
              : item
          );
        } else {
          return [...prev, { product, quantity: 1, unit_price: product.price }];
        }
      }
    });
  };

  const handleSizeSelection = () => {
    if (productToAdd && selectedSizeForAdd) {
      addToCart(productToAdd, selectedSizeForAdd);
      setShowSizeModal(false);
      setProductToAdd(null);
      setSelectedSizeForAdd(null);
    }
  };

  const updateCartQuantity = (productId: string, delta: number, selectedSize?: {size: string; size_type: string}) => {
    setCart(prev => {
      const item = prev.find(i => 
        i.product.id === productId && 
        (!selectedSize || (i.selectedSize?.size === selectedSize.size && i.selectedSize?.size_type === selectedSize.size_type))
      );
      if (!item) return prev;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter(i => 
          !(i.product.id === productId && 
            (!selectedSize || (i.selectedSize?.size === selectedSize.size && i.selectedSize?.size_type === selectedSize.size_type)))
        );
      }

      // Verificar stock
      if (item.product.track_inventory) {
        if (item.selectedSize) {
          // Verificar stock del talle
          if (newQuantity > item.selectedSize.stock_quantity) {
            toast({
              title: t('common.error'),
              description: t('pos.insufficientStockForSize').replace('{size}', item.selectedSize.size).replace('{available}', item.selectedSize.stock_quantity.toString()),
              variant: "destructive",
            });
            return prev;
          }
        } else if (newQuantity > item.product.stock_quantity) {
          return prev;
        }
      }

      return prev.map(i =>
        i.product.id === productId && 
        (!selectedSize || (i.selectedSize?.size === selectedSize.size && i.selectedSize?.size_type === selectedSize.size_type))
          ? { ...i, quantity: newQuantity }
          : i
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const total = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedVenue) {
      toast({
        title: t('common.error'),
        description: t('pos.mustSelectVenue'),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const saleData: CreateSaleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_size_id: item.selectedSize?.size_id,
          size: item.selectedSize?.size,
          size_type: item.selectedSize?.size_type
        })),
        venue_id: selectedVenue,
        customer_name: customerName || undefined,
        payment_method: paymentMethod,
        sale_context: saleContext
      };

      await createSale(saleData);
      
      // Limpiar carrito
      setCart([]);
      setCustomerName('');
      setShowPaymentModal(false);
      
      // Refrescar productos para actualizar stock
      await fetchProducts({ is_active: true });
    } catch (error) {
      console.error('Error processing sale:', error);
      // El error ya se maneja en createSale con toast
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <Header
        title={t('pos.title')}
        description={t('pos.description')}
        icon={<ShoppingCart className="w-6 h-6" />}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 space-y-4">
            {/* Barra de búsqueda */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('pos.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
            
            {/* Selector de Categorías estilo PedidosYa con blur */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`
                group relative
                flex flex-col items-center justify-center gap-1.5
                px-4 py-3
                min-w-[90px]
                rounded-2xl
                transition-all duration-300
                whitespace-nowrap
                overflow-hidden
                ${selectedCategory === ''
                  ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-500/50'
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm'
                }
              `}
            >
              {/* Background blur effect */}
              {selectedCategory === '' && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm" />
              )}
              <div className={`
                relative z-10
                p-2 rounded-xl
                ${selectedCategory === ''
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm'
                }
              `}>
                <Package className={`w-4 h-4 ${selectedCategory === '' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
              </div>
              <span className={`relative z-10 text-xs font-semibold ${selectedCategory === '' ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                Todas
              </span>
            </button>
            {categories.filter(c => c.is_active).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  group relative
                  flex flex-col items-center justify-center gap-1.5
                  px-4 py-3
                  min-w-[90px]
                  rounded-2xl
                  transition-all duration-300
                  whitespace-nowrap
                  overflow-hidden
                  ${selectedCategory === cat.id
                    ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-500/50'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm'
                  }
                `}
              >
                {/* Background blur effect */}
                {selectedCategory === cat.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm" />
                )}
                <div className={`
                  relative z-10
                  p-2 rounded-xl
                  ${selectedCategory === cat.id
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm'
                  }
                `}>
                  <CategoryIcon
                    iconName={cat.icon}
                    categoryName={cat.name}
                    className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-white' : ''}`}
                    color={selectedCategory === cat.id ? undefined : cat.color}
                  />
                </div>
                <span className={`relative z-10 text-xs font-semibold ${selectedCategory === cat.id ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
          </div>

          {/* Grid de Productos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProducts.map((product, index) => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
                // Prioridad para las primeras 8 imágenes (primera página completa)
                const hasPriority = index < 8;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                      isOutOfStock
                        ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        : cartItem
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md'
                    }`}
                  >
                    {product.image_url && product.image_url.trim() !== '' ? (
                      <div className="relative w-full aspect-square mb-2 rounded overflow-hidden">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          priority={hasPriority}
                          loading={hasPriority ? undefined : "lazy"}
                          quality={85}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700"><svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square mb-2 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${product.price.toLocaleString('es-UY')}
                      </span>
                      {cartItem && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          {cartItem.quantity}
                        </span>
                      )}
                    </div>

                    {product.track_inventory && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tCommon('available')}: {product.stock_quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage === totalPages && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>

        {/* Panel del Carrito */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                {t('pos.cart')} ({cart.length})
              </h2>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('pos.emptyCart')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${item.unit_price.toLocaleString('es-UY')} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, -1, item.selectedSize)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, 1, item.selectedSize)}
                          disabled={
                            item.product.track_inventory && 
                            (item.selectedSize 
                              ? item.quantity >= item.selectedSize.stock_quantity
                              : item.quantity >= item.product.stock_quantity
                            )
                          }
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('pos.subtotal')}:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${subtotal.toLocaleString('es-UY')}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100">{t('pos.total')}:</span>
                    <span className="text-green-600 dark:text-green-400">
                      ${total.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => {
                      if (cart.length === 0) {
                        toast({
                          title: "Error",
                          description: "El carrito está vacío",
                          variant: "destructive",
                        });
                        return;
                      }
                      setShowPaymentModal(true);
                    }}
                    disabled={cart.length === 0}
                    className="w-full bg-green-600 text-white hover:bg-green-700 h-12 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('pos.checkout')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-white dark:bg-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{t('pos.paymentDetails')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">{t('pos.venue')} <span className="text-red-500">*</span></Label>
              <Select 
                value={selectedVenue || 'none'} 
                onValueChange={(value) => {
                  if (value !== 'none') {
                    setSelectedVenue(value);
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <SelectValue placeholder={t('pos.selectVenue')} />
                </SelectTrigger>
                <SelectContent>
                  {venues.filter(v => v.is_active).length === 0 ? (
                    <SelectItem value="none" disabled>{t('pos.noVenuesAvailable')}</SelectItem>
                  ) : (
                    venues.filter(v => v.is_active).map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!selectedVenue && venues.filter(v => v.is_active).length > 0 && (
                <p className="text-sm text-red-500">{t('pos.mustSelectVenue')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">{t('pos.customerName')}</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('pos.customerNamePlaceholder')}
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">{t('pos.paymentMethod')} <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className={`${paymentMethod === 'cash' ? 'bg-green-600' : ''} font-bold`}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  {t('pos.cash')}
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('transfer')}
                  className={`${paymentMethod === 'transfer' ? 'bg-green-600' : ''} font-bold`}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {t('pos.transfer')}
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className={`${paymentMethod === 'card' ? 'bg-green-600' : ''} font-bold`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('pos.card')}
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'mercadopago' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`${paymentMethod === 'mercadopago' ? 'bg-green-600' : ''} font-bold`}
                >
                  {t('pos.mercadopago')}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">{t('pos.saleContext')}</Label>
              <Select value={saleContext} onValueChange={(value: 'general' | 'tournament' | 'league' | 'class' | 'booking') => setSaleContext(value)}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{t('pos.contextGeneral')}</SelectItem>
                  <SelectItem value="tournament">{t('pos.contextTournament')}</SelectItem>
                  <SelectItem value="league">{t('pos.contextLeague')}</SelectItem>
                  <SelectItem value="class">{t('pos.contextClass')}</SelectItem>
                  <SelectItem value="booking">{t('pos.contextBooking')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('pos.total')}:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${total.toLocaleString('es-UY')}
                </span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isProcessing || !selectedVenue}
                className="w-full bg-green-600 text-white hover:bg-green-700 h-12 font-bold"
              >
                {isProcessing ? t('pos.processing') : t('pos.confirmSale')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Selección de Talle */}
      <Dialog open={showSizeModal} onOpenChange={setShowSizeModal}>
        <DialogContent className="bg-white dark:bg-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t('pos.selectSize')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {productToAdd?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {productToAdd?.sizes && productToAdd.sizes.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">{t('pos.selectSizeLabel')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {productToAdd.sizes.map((size) => (
                      <button
                        key={size.id || size.size}
                        type="button"
                        onClick={() => setSelectedSizeForAdd({
                          size: size.size,
                          size_type: size.size_type,
                          size_id: size.id,
                          stock_quantity: size.stock_quantity
                        })}
                        className={`
                          p-3 rounded-lg border-2 transition-all
                          ${selectedSizeForAdd?.size === size.size && selectedSizeForAdd?.size_type === size.size_type
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : size.stock_quantity > 0
                              ? 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 bg-white dark:bg-gray-700'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                          }
                        `}
                        disabled={size.stock_quantity <= 0}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">{size.size}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tCommon('available')}: {size.stock_quantity}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedSizeForAdd && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {t('pos.selectedSize')} <span className="font-semibold">{selectedSizeForAdd.size}</span>
                      {selectedSizeForAdd.stock_quantity > 0 && (
                        <span className="ml-2">({tCommon('available')}: {selectedSizeForAdd.stock_quantity})</span>
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('pos.noSizesAvailable')}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSizeModal(false);
                setProductToAdd(null);
                setSelectedSizeForAdd(null);
              }}
              className="border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSizeSelection}
              disabled={!selectedSizeForAdd || selectedSizeForAdd.stock_quantity <= 0}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Agregar al Carrito
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

