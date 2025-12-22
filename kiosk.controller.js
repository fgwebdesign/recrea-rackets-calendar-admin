import { supabase } from '../config/supabaseClient.js';

// Nombre del bucket para imágenes de productos
const PRODUCTS_BUCKET = 'kiosk-products';

// =====================================================
// CATEGORÍAS DE PRODUCTOS
// =====================================================

/**
 * Obtener todas las categorías de productos
 */
export const getProductCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      categories: data
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categorías de productos',
      error: error.message
    });
  }
};

/**
 * Crear nueva categoría de producto
 */
export const createProductCategory = async (req, res) => {
  try {
    const { name, description, icon, color, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    // Generar slug
    const slug = name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        name,
        slug,
        description,
        icon,
        color: color || '#3B82F6',
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      category: data
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

/**
 * Actualizar categoría de producto
 */
export const updateProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, sort_order, is_active } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('product_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      category: data
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

/**
 * Eliminar categoría de producto
 */
export const deleteProductCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay productos en esta categoría
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (products && products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
};

// =====================================================
// PRODUCTOS
// =====================================================

/**
 * Obtener todos los productos
 */
export const getProducts = async (req, res) => {
  try {
    const { category_id, venue_id, is_active, search, low_stock } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name, slug, icon, color),
        venue:venues(id, name)
      `)
      .order('name', { ascending: true });

    if (category_id) query = query.eq('category_id', category_id);
    if (venue_id) query = query.eq('venue_id', venue_id);
    if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
    if (search) query = query.ilike('name', `%${search}%`);
    if (low_stock === 'true') {
      query = query.eq('track_inventory', true);
      // Filtrar después porque necesitamos comparar columnas
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filtrar productos con stock bajo si se solicitó
    let products = data;
    if (low_stock === 'true') {
      products = data.filter(p => p.stock_quantity <= p.min_stock_alert);
    }

    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

/**
 * Obtener producto por ID
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name, slug, icon, color),
        venue:venues(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      product: data
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

/**
 * Crear nuevo producto
 */
export const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      sku,
      barcode,
      price,
      cost_price,
      stock_quantity,
      min_stock_alert,
      track_inventory,
      image_url,
      is_active,
      is_featured,
      venue_id
    } = req.body;

    // Validaciones
    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'La categoría es requerida'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del producto es requerido'
      });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio es requerido y debe ser mayor o igual a 0'
      });
    }

    // Verificar que la categoría existe
    const { data: categoryExists } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        category_id,
        name,
        description,
        sku,
        barcode,
        price,
        cost_price: cost_price || 0,
        stock_quantity: stock_quantity || 0,
        min_stock_alert: min_stock_alert || 5,
        track_inventory: track_inventory !== false,
        image_url,
        is_active: is_active !== false,
        is_featured: is_featured || false,
        venue_id
      })
      .select(`
        *,
        category:product_categories(id, name, slug, icon, color)
      `)
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product: data
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

/**
 * Actualizar producto
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      sku,
      barcode,
      price,
      cost_price,
      stock_quantity,
      min_stock_alert,
      track_inventory,
      image_url,
      is_active,
      is_featured,
      venue_id
    } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (category_id !== undefined) updateData.category_id = category_id;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (price !== undefined) updateData.price = price;
    if (cost_price !== undefined) updateData.cost_price = cost_price;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (min_stock_alert !== undefined) updateData.min_stock_alert = min_stock_alert;
    if (track_inventory !== undefined) updateData.track_inventory = track_inventory;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (venue_id !== undefined) updateData.venue_id = venue_id;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:product_categories(id, name, slug, icon, color)
      `)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product: data
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

/**
 * Eliminar producto
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el producto tiene ventas
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (saleItems && saleItems.length > 0) {
      // En lugar de eliminar, desactivar
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'El producto tiene ventas asociadas, se ha desactivado en lugar de eliminarse',
        product: data
      });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

/**
 * Actualizar stock de producto
 */
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, movement_type, notes } = req.body;
    const user_id = req.user?.id;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad es requerida'
      });
    }

    // Obtener el stock actual
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity, name, venue_id')
      .eq('id', id)
      .single();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const previousStock = product.stock_quantity;
    const newStock = previousStock + quantity;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }

    // Actualizar stock
    const { data, error } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar movimiento de inventario
    await supabase
      .from('inventory_movements')
      .insert({
        product_id: id,
        movement_type: movement_type || 'adjustment',
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        notes,
        user_id,
        venue_id: product.venue_id
      });

    return res.status(200).json({
      success: true,
      message: 'Stock actualizado exitosamente',
      product: data,
      movement: {
        previous_stock: previousStock,
        quantity_change: quantity,
        new_stock: newStock
      }
    });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar stock',
      error: error.message
    });
  }
};

// =====================================================
// VENTAS
// =====================================================

/**
 * Crear nueva venta
 */
export const createSale = async (req, res) => {
  try {
    const {
      items, // Array de { product_id, quantity, unit_price?, discount_amount? }
      venue_id,
      customer_id,
      customer_name,
      payment_method,
      payment_reference,
      sale_context,
      tournament_id,
      league_id,
      discount_amount,
      discount_percent,
      notes
    } = req.body;

    const user_id = req.user?.id;

    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un producto en la venta'
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        success: false,
        message: 'El método de pago es requerido'
      });
    }

    // Obtener información de los productos
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, stock_quantity, track_inventory')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Validar que todos los productos existan
    const productMap = new Map(products.map(p => [p.id, p]));
    for (const item of items) {
      if (!productMap.has(item.product_id)) {
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${item.product_id} no encontrado`
        });
      }

      const product = productMap.get(item.product_id);
      if (product.track_inventory && product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}`
        });
      }
    }

    // Calcular totales
    let subtotal = 0;
    const saleItems = items.map(item => {
      const product = productMap.get(item.product_id);
      const unitPrice = item.unit_price !== undefined ? item.unit_price : product.price;
      const itemDiscount = item.discount_amount || 0;
      const itemTotal = (unitPrice * item.quantity) - itemDiscount;
      subtotal += itemTotal;

      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount_amount: itemDiscount,
        total: itemTotal,
        product_name: product.name,
        product_sku: product.sku
      };
    });

    // Aplicar descuento general
    const generalDiscount = discount_amount || 0;
    const percentDiscount = discount_percent ? (subtotal * discount_percent / 100) : 0;
    const totalDiscount = generalDiscount + percentDiscount;
    const total = subtotal - totalDiscount;

    // Crear la venta
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        venue_id,
        user_id,
        customer_id,
        customer_name,
        subtotal,
        discount_amount: totalDiscount,
        discount_percent: discount_percent || 0,
        total,
        payment_method,
        payment_status: payment_method === 'pending' ? 'pending' : 'completed',
        payment_reference,
        sale_context: sale_context || 'general',
        tournament_id,
        league_id,
        notes
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // Crear los items de la venta
    const itemsToInsert = saleItems.map(item => ({
      ...item,
      sale_id: sale.id
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // El trigger de la base de datos actualizará el stock automáticamente

    return res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      sale: {
        ...sale,
        items: saleItems
      }
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar venta',
      error: error.message
    });
  }
};

/**
 * Obtener ventas con filtros
 */
export const getSales = async (req, res) => {
  try {
    const { 
      venue_id, 
      payment_method, 
      payment_status,
      sale_context,
      start_date, 
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    let query = supabase
      .from('sales')
      .select(`
        *,
        venue:venues(id, name),
        seller:users!sales_user_id_fkey(id, first_name, last_name),
        customer:users!sales_customer_id_fkey(id, first_name, last_name),
        items:sale_items(
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          discount_amount,
          total
        )
      `, { count: 'exact' })
      .order('sale_date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (venue_id) query = query.eq('venue_id', venue_id);
    if (payment_method) query = query.eq('payment_method', payment_method);
    if (payment_status) query = query.eq('payment_status', payment_status);
    if (sale_context) query = query.eq('sale_context', sale_context);
    if (start_date) query = query.gte('sale_date', start_date);
    if (end_date) query = query.lte('sale_date', end_date);

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      sales: data,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ventas',
      error: error.message
    });
  }
};

/**
 * Obtener venta por ID
 */
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        venue:venues(id, name),
        seller:users!sales_user_id_fkey(id, first_name, last_name, email),
        customer:users!sales_customer_id_fkey(id, first_name, last_name, email),
        items:sale_items(
          id,
          product_id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          discount_amount,
          total
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      sale: data
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener venta',
      error: error.message
    });
  }
};

/**
 * Cancelar/Reembolsar venta
 */
export const cancelSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, restore_stock = true } = req.body;
    const user_id = req.user?.id;

    // Obtener la venta con sus items
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(product_id, quantity)
      `)
      .eq('id', id)
      .single();

    if (saleError) throw saleError;

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    if (sale.payment_status === 'cancelled' || sale.payment_status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Esta venta ya fue cancelada o reembolsada'
      });
    }

    // Restaurar stock si se solicita
    if (restore_stock && sale.items) {
      for (const item of sale.items) {
        // Obtener producto
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, venue_id, track_inventory')
          .eq('id', item.product_id)
          .single();

        if (product && product.track_inventory) {
          const previousStock = product.stock_quantity;
          const newStock = previousStock + item.quantity;

          // Actualizar stock
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          // Registrar movimiento
          await supabase
            .from('inventory_movements')
            .insert({
              product_id: item.product_id,
              movement_type: 'return',
              quantity: item.quantity,
              previous_stock: previousStock,
              new_stock: newStock,
              reference_type: 'sale_cancellation',
              reference_id: id,
              notes: reason || 'Cancelación de venta',
              user_id,
              venue_id: product.venue_id
            });
        }
      }
    }

    // Actualizar estado de la venta
    const { data, error } = await supabase
      .from('sales')
      .update({
        payment_status: 'cancelled',
        notes: sale.notes 
          ? `${sale.notes}\n\nCANCELADO: ${reason || 'Sin motivo especificado'}`
          : `CANCELADO: ${reason || 'Sin motivo especificado'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Venta cancelada exitosamente',
      sale: data,
      stock_restored: restore_stock
    });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cancelar venta',
      error: error.message
    });
  }
};

// =====================================================
// REPORTES
// =====================================================

/**
 * Obtener resumen de ventas
 */
export const getSalesSummary = async (req, res) => {
  try {
    const { venue_id, start_date, end_date, group_by = 'day' } = req.query;

    // Obtener ventas completadas
    let query = supabase
      .from('sales')
      .select('*')
      .eq('payment_status', 'completed');

    if (venue_id) query = query.eq('venue_id', venue_id);
    if (start_date) query = query.gte('sale_date', start_date);
    if (end_date) query = query.lte('sale_date', end_date);

    const { data: sales, error } = await query;

    if (error) throw error;

    // Calcular totales
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Por método de pago
    const byPaymentMethod = sales.reduce((acc, s) => {
      const method = s.payment_method;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += parseFloat(s.total);
      return acc;
    }, {});

    // Por contexto
    const byContext = sales.reduce((acc, s) => {
      const context = s.sale_context;
      if (!acc[context]) {
        acc[context] = { count: 0, total: 0 };
      }
      acc[context].count++;
      acc[context].total += parseFloat(s.total);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      summary: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        average_ticket: averageTicket,
        by_payment_method: byPaymentMethod,
        by_context: byContext
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de ventas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de ventas',
      error: error.message
    });
  }
};

/**
 * Obtener productos más vendidos
 */
export const getTopProducts = async (req, res) => {
  try {
    const { venue_id, start_date, end_date, limit = 10 } = req.query;

    // Primero obtener ventas válidas
    let salesQuery = supabase
      .from('sales')
      .select('id')
      .eq('payment_status', 'completed');

    if (venue_id) salesQuery = salesQuery.eq('venue_id', venue_id);
    if (start_date) salesQuery = salesQuery.gte('sale_date', start_date);
    if (end_date) salesQuery = salesQuery.lte('sale_date', end_date);

    const { data: validSales } = await salesQuery;
    const validSaleIds = validSales?.map(s => s.id) || [];

    if (validSaleIds.length === 0) {
      return res.status(200).json({
        success: true,
        products: []
      });
    }

    // Obtener items de esas ventas
    const { data: items, error } = await supabase
      .from('sale_items')
      .select(`
        product_id,
        product_name,
        quantity,
        total
      `)
      .in('sale_id', validSaleIds);

    if (error) throw error;

    // Agrupar por producto
    const productStats = items.reduce((acc, item) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = {
          product_id: item.product_id,
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      acc[item.product_id].total_quantity += item.quantity;
      acc[item.product_id].total_revenue += parseFloat(item.total);
      return acc;
    }, {});

    // Convertir a array y ordenar
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      products: topProducts
    });
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener productos más vendidos',
      error: error.message
    });
  }
};

/**
 * Obtener movimientos de inventario
 */
export const getInventoryMovements = async (req, res) => {
  try {
    const { product_id, venue_id, movement_type, start_date, end_date, limit = 50 } = req.query;

    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(id, name, sku),
        user:users(id, first_name, last_name),
        venue:venues(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (product_id) query = query.eq('product_id', product_id);
    if (venue_id) query = query.eq('venue_id', venue_id);
    if (movement_type) query = query.eq('movement_type', movement_type);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      movements: data
    });
  } catch (error) {
    console.error('Error al obtener movimientos de inventario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos de inventario',
      error: error.message
    });
  }
};

// =====================================================
// SUBIDA DE IMÁGENES
// =====================================================

/**
 * Subir imagen de producto
 */
export const uploadProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que se envió un archivo
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un archivo de imagen'
      });
    }

    const file = req.files.file;

    // Validar tipo de archivo
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe ser una imagen (jpg, png, gif, webp)'
      });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'La imagen no debe superar 5MB'
      });
    }

    // Si el producto ya tiene imagen, eliminar la anterior
    if (product.image_url) {
      try {
        const oldPath = product.image_url.split(`${PRODUCTS_BUCKET}/`)[1];
        if (oldPath) {
          await supabase.storage
            .from(PRODUCTS_BUCKET)
            .remove([oldPath]);
        }
      } catch (deleteError) {
        console.warn('No se pudo eliminar la imagen anterior:', deleteError);
      }
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${id}/${Date.now()}_${sanitizedName}`;

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(fileName, file.data, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
        error: uploadError.message
      });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(PRODUCTS_BUCKET)
      .getPublicUrl(fileName);

    // Actualizar el producto con la nueva URL
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        category:product_categories(id, name, slug, icon, color)
      `)
      .single();

    if (updateError) {
      // Si falla la actualización, eliminar la imagen subida
      await supabase.storage
        .from(PRODUCTS_BUCKET)
        .remove([fileName]);
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: 'Imagen subida exitosamente',
      product: updatedProduct,
      image_url: publicUrl
    });
  } catch (error) {
    console.error('Error al subir imagen de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir imagen',
      error: error.message
    });
  }
};

/**
 * Eliminar imagen de producto
 */
export const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (!product.image_url) {
      return res.status(400).json({
        success: false,
        message: 'El producto no tiene imagen'
      });
    }

    // Eliminar imagen del storage
    try {
      const imagePath = product.image_url.split(`${PRODUCTS_BUCKET}/`)[1];
      if (imagePath) {
        await supabase.storage
          .from(PRODUCTS_BUCKET)
          .remove([imagePath]);
      }
    } catch (deleteError) {
      console.warn('Error eliminando imagen del storage:', deleteError);
    }

    // Actualizar el producto (quitar la URL de imagen)
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        image_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error al eliminar imagen de producto:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar imagen',
      error: error.message
    });
  }
};

/**
 * Subir imagen de categoría
 */
export const uploadCategoryImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la categoría existe
    const { data: category, error: categoryError } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un archivo de imagen'
      });
    }

    const file = req.files.file;

    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe ser una imagen'
      });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `categories/${id}_${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .upload(fileName, file.data, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
        error: uploadError.message
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(PRODUCTS_BUCKET)
      .getPublicUrl(fileName);

    // Actualizar categoría con icono como URL de imagen
    const { data: updatedCategory, error: updateError } = await supabase
      .from('product_categories')
      .update({ 
        icon: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: 'Imagen de categoría subida exitosamente',
      category: updatedCategory,
      image_url: publicUrl
    });
  } catch (error) {
    console.error('Error al subir imagen de categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al subir imagen',
      error: error.message
    });
  }
};

