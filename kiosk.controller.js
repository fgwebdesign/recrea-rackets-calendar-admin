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
        venue:venues(id, name),
        sizes:product_sizes(id, size, size_type, stock_quantity)
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
        venue:venues(id, name),
        sizes:product_sizes(id, size, size_type, stock_quantity)
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
      venue_id,
      sizes // Array de talles: [{ size: "S", size_type: "clothing", stock_quantity: 10 }, ...]
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

    // Calcular stock total si hay talles
    let totalStock = stock_quantity || 0;
    if (sizes && Array.isArray(sizes) && sizes.length > 0) {
      totalStock = sizes.reduce((sum, size) => sum + (size.stock_quantity || 0), 0);
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
        stock_quantity: totalStock, // Usar el stock total de talles si existen
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

    // Si hay talles, insertarlos
    if (sizes && Array.isArray(sizes) && sizes.length > 0) {
      const sizesToInsert = sizes.map(size => ({
        product_id: data.id,
        size: size.size,
        size_type: size.size_type || 'clothing',
        stock_quantity: size.stock_quantity || 0
      }));

      const { error: sizesError } = await supabase
        .from('product_sizes')
        .insert(sizesToInsert);

      if (sizesError) {
        console.error('Error al insertar talles:', sizesError);
        // No fallar la creación del producto, solo loguear el error
      } else {
        // Obtener los talles insertados para incluirlos en la respuesta
        const { data: insertedSizes } = await supabase
          .from('product_sizes')
          .select('*')
          .eq('product_id', data.id);

        data.sizes = insertedSizes || [];
      }
    }

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
      venue_id,
      sizes // Array de talles para actualizar
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

    // Calcular stock total si hay talles
    if (sizes && Array.isArray(sizes) && sizes.length > 0) {
      const totalStock = sizes.reduce((sum, size) => sum + (size.stock_quantity || 0), 0);
      updateData.stock_quantity = totalStock;
    }

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

    // Si se enviaron talles, actualizar/eliminar/crear según corresponda
    if (sizes !== undefined) {
      // Eliminar todos los talles existentes
      await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', id);

      // Insertar los nuevos talles si hay alguno
      if (Array.isArray(sizes) && sizes.length > 0) {
        const sizesToInsert = sizes.map(size => ({
          product_id: id,
          size: size.size,
          size_type: size.size_type || 'clothing',
          stock_quantity: size.stock_quantity || 0
        }));

        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizesToInsert);

        if (sizesError) {
          console.error('Error al actualizar talles:', sizesError);
        }
      }

      // Obtener los talles actualizados
      const { data: updatedSizes } = await supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', id);

      data.sizes = updatedSizes || [];
    }

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

    // Obtener información de los productos con sus talles
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        sku, 
        price, 
        stock_quantity, 
        track_inventory,
        sizes:product_sizes(id, size, size_type, stock_quantity)
      `)
      .in('id', productIds);

    if (productsError) throw productsError;

    // Validar que todos los productos existan y verificar stock
    const productMap = new Map(products.map(p => [p.id, p]));
    for (const item of items) {
      if (!productMap.has(item.product_id)) {
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${item.product_id} no encontrado`
        });
      }

      const product = productMap.get(item.product_id);
      
      // Si el item tiene un talle específico, validar stock del talle
      if (item.product_size_id || item.size) {
        const productSizes = product.sizes || [];
        const selectedSize = item.product_size_id 
          ? productSizes.find(s => s.id === item.product_size_id)
          : productSizes.find(s => s.size === item.size && s.size_type === item.size_type);
        
        if (!selectedSize) {
          return res.status(400).json({
            success: false,
            message: `Talle ${item.size || 'seleccionado'} no encontrado para ${product.name}`
          });
        }
        
        if (product.track_inventory && selectedSize.stock_quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${product.name} talle ${selectedSize.size}. Disponible: ${selectedSize.stock_quantity}`
          });
        }
      } else if (product.track_inventory && product.stock_quantity < item.quantity) {
        // Validar stock general si no tiene talles
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
        product_sku: product.sku,
        product_size_id: item.product_size_id || undefined,
        size: item.size || undefined,
        size_type: item.size_type || undefined
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
          product_sku,
          quantity,
          unit_price,
          discount_amount,
          total,
          product_size_id,
          size,
          size_type,
          product:products(id, image_url)
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
          total,
          product_size_id,
          size,
          size_type,
          product:products(id, image_url)
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
// REPORTES AVANZADOS
// =====================================================

/**
 * Dashboard de estadísticas del kiosco
 * Devuelve métricas consolidadas para el dashboard principal
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { venue_id } = req.query;
    
    // Fechas para comparaciones
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();

    // Query base para ventas completadas
    const baseQuery = () => {
      let q = supabase.from('sales').select('*').eq('payment_status', 'completed');
      if (venue_id) q = q.eq('venue_id', venue_id);
      return q;
    };

    // Ventas de hoy
    const { data: todaySales } = await baseQuery()
      .gte('sale_date', todayStart)
      .lte('sale_date', todayEnd);

    // Ventas de esta semana
    const { data: weekSales } = await baseQuery()
      .gte('sale_date', thisWeekStart);

    // Ventas de este mes
    const { data: monthSales } = await baseQuery()
      .gte('sale_date', thisMonthStart);

    // Ventas del mes pasado (para comparación)
    const { data: lastMonthSales } = await baseQuery()
      .gte('sale_date', lastMonthStart)
      .lte('sale_date', lastMonthEnd);

    // Productos con stock bajo
    let lowStockQuery = supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_alert, category:product_categories(name)')
      .eq('track_inventory', true)
      .eq('is_active', true);
    
    if (venue_id) lowStockQuery = lowStockQuery.eq('venue_id', venue_id);
    
    const { data: allProducts } = await lowStockQuery;
    const lowStockProducts = allProducts?.filter(p => p.stock_quantity <= p.min_stock_alert) || [];

    // Calcular métricas
    const calculateMetrics = (sales) => ({
      count: sales?.length || 0,
      total: sales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0,
      average: sales?.length ? sales.reduce((sum, s) => sum + parseFloat(s.total), 0) / sales.length : 0
    });

    const todayMetrics = calculateMetrics(todaySales);
    const weekMetrics = calculateMetrics(weekSales);
    const monthMetrics = calculateMetrics(monthSales);
    const lastMonthMetrics = calculateMetrics(lastMonthSales);

    // Calcular variación porcentual mes a mes
    const monthVariation = lastMonthMetrics.total > 0 
      ? ((monthMetrics.total - lastMonthMetrics.total) / lastMonthMetrics.total * 100).toFixed(1)
      : 0;

    // Por método de pago (este mes)
    const paymentMethods = monthSales?.reduce((acc, sale) => {
      const method = sale.payment_method;
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count++;
      acc[method].total += parseFloat(sale.total);
      return acc;
    }, {}) || {};

    return res.status(200).json({
      success: true,
      dashboard: {
        today: {
          sales_count: todayMetrics.count,
          total_revenue: todayMetrics.total,
          average_ticket: todayMetrics.average
        },
        week: {
          sales_count: weekMetrics.count,
          total_revenue: weekMetrics.total,
          average_ticket: weekMetrics.average
        },
        month: {
          sales_count: monthMetrics.count,
          total_revenue: monthMetrics.total,
          average_ticket: monthMetrics.average,
          variation_percent: parseFloat(monthVariation),
          previous_month_total: lastMonthMetrics.total
        },
        payment_methods: paymentMethods,
        low_stock_count: lowStockProducts.length,
        low_stock_products: lowStockProducts.slice(0, 5) // Top 5 con bajo stock
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};

/**
 * Reporte mensual de ventas con desglose diario
 * @query year - Año (default: actual)
 * @query month - Mes 1-12 (default: actual)
 * @query venue_id - Filtrar por sede
 */
export const getMonthlyReport = async (req, res) => {
  try {
    const { venue_id, year, month } = req.query;
    
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || (now.getMonth() + 1); // 1-12
    
    // Calcular rango de fechas del mes
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();
    
    // Mes anterior para comparación
    const prevMonthStart = new Date(targetYear, targetMonth - 2, 1).toISOString();
    const prevMonthEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59).toISOString();

    // Query ventas del mes
    let query = supabase
      .from('sales')
      .select(`
        id, sale_date, subtotal, discount_amount, total, 
        payment_method, payment_status, sale_context,
        venue:venues(id, name)
      `)
      .eq('payment_status', 'completed')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: true });

    if (venue_id) query = query.eq('venue_id', venue_id);

    const { data: sales, error } = await query;
    if (error) throw error;

    // Query mes anterior
    let prevQuery = supabase
      .from('sales')
      .select('total')
      .eq('payment_status', 'completed')
      .gte('sale_date', prevMonthStart)
      .lte('sale_date', prevMonthEnd);
    
    if (venue_id) prevQuery = prevQuery.eq('venue_id', venue_id);
    const { data: prevSales } = await prevQuery;

    // Agrupar por día
    const dailyData = {};
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    // Inicializar todos los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyData[dateStr] = {
        date: dateStr,
        day_name: new Date(targetYear, targetMonth - 1, day).toLocaleDateString('es-ES', { weekday: 'short' }),
        sales_count: 0,
        total: 0,
        cash: 0,
        transfer: 0,
        card: 0
      };
    }

    // Llenar con datos reales
    sales?.forEach(sale => {
      const dateStr = sale.sale_date.split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].sales_count++;
        dailyData[dateStr].total += parseFloat(sale.total);
        if (sale.payment_method === 'cash') dailyData[dateStr].cash += parseFloat(sale.total);
        if (sale.payment_method === 'transfer') dailyData[dateStr].transfer += parseFloat(sale.total);
        if (sale.payment_method === 'card') dailyData[dateStr].card += parseFloat(sale.total);
      }
    });

    // Calcular totales
    const totalRevenue = sales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;
    const totalSales = sales?.length || 0;
    const prevMonthTotal = prevSales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;
    
    // Por método de pago
    const byPaymentMethod = sales?.reduce((acc, s) => {
      const method = s.payment_method;
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count++;
      acc[method].total += parseFloat(s.total);
      return acc;
    }, {}) || {};

    // Por contexto (torneo, liga, general)
    const byContext = sales?.reduce((acc, s) => {
      const context = s.sale_context || 'general';
      if (!acc[context]) acc[context] = { count: 0, total: 0 };
      acc[context].count++;
      acc[context].total += parseFloat(s.total);
      return acc;
    }, {}) || {};

    // Mejores días
    const dailyArray = Object.values(dailyData).filter(d => d.total > 0);
    const bestDay = dailyArray.length > 0 
      ? dailyArray.reduce((best, day) => day.total > best.total ? day : best)
      : null;

    return res.status(200).json({
      success: true,
      report: {
        period: {
          year: targetYear,
          month: targetMonth,
          month_name: new Date(targetYear, targetMonth - 1).toLocaleDateString('es-ES', { month: 'long' }),
          start_date: startDate.split('T')[0],
          end_date: endDate.split('T')[0]
        },
        summary: {
          total_sales: totalSales,
          total_revenue: totalRevenue,
          average_daily: totalRevenue / daysInMonth,
          average_ticket: totalSales > 0 ? totalRevenue / totalSales : 0,
          comparison: {
            previous_month_total: prevMonthTotal,
            variation_amount: totalRevenue - prevMonthTotal,
            variation_percent: prevMonthTotal > 0 
              ? ((totalRevenue - prevMonthTotal) / prevMonthTotal * 100).toFixed(1)
              : 0
          }
        },
        by_payment_method: byPaymentMethod,
        by_context: byContext,
        best_day: bestDay,
        daily_breakdown: Object.values(dailyData)
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte mensual:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reporte mensual',
      error: error.message
    });
  }
};

/**
 * Reporte de ventas por sede (comparativa)
 * @query start_date - Fecha inicio
 * @query end_date - Fecha fin
 */
export const getVenueComparisonReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default: último mes
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEnd = now.toISOString();
    
    const startFilter = start_date || defaultStart;
    const endFilter = end_date || defaultEnd;

    // Obtener todas las sedes activas
    const { data: venues } = await supabase
      .from('venues')
      .select('id, name')
      .eq('is_active', true);

    // Obtener ventas con sede
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        id, total, payment_method, sale_context, sale_date, venue_id,
        venue:venues(id, name)
      `)
      .eq('payment_status', 'completed')
      .gte('sale_date', startFilter)
      .lte('sale_date', endFilter);

    if (error) throw error;

    // Agrupar por sede
    const venueStats = {};
    
    // Inicializar todas las sedes
    venues?.forEach(venue => {
      venueStats[venue.id] = {
        venue_id: venue.id,
        venue_name: venue.name,
        sales_count: 0,
        total_revenue: 0,
        average_ticket: 0,
        by_payment_method: {},
        by_context: {}
      };
    });

    // Ventas sin sede asignada
    venueStats['unassigned'] = {
      venue_id: null,
      venue_name: 'Sin sede asignada',
      sales_count: 0,
      total_revenue: 0,
      average_ticket: 0,
      by_payment_method: {},
      by_context: {}
    };

    // Procesar ventas
    sales?.forEach(sale => {
      const venueId = sale.venue_id || 'unassigned';
      if (!venueStats[venueId]) return;
      
      venueStats[venueId].sales_count++;
      venueStats[venueId].total_revenue += parseFloat(sale.total);
      
      // Por método de pago
      const method = sale.payment_method;
      if (!venueStats[venueId].by_payment_method[method]) {
        venueStats[venueId].by_payment_method[method] = { count: 0, total: 0 };
      }
      venueStats[venueId].by_payment_method[method].count++;
      venueStats[venueId].by_payment_method[method].total += parseFloat(sale.total);
      
      // Por contexto
      const context = sale.sale_context || 'general';
      if (!venueStats[venueId].by_context[context]) {
        venueStats[venueId].by_context[context] = { count: 0, total: 0 };
      }
      venueStats[venueId].by_context[context].count++;
      venueStats[venueId].by_context[context].total += parseFloat(sale.total);
    });

    // Calcular promedios y ordenar
    const venueArray = Object.values(venueStats)
      .map(v => ({
        ...v,
        average_ticket: v.sales_count > 0 ? v.total_revenue / v.sales_count : 0
      }))
      .filter(v => v.sales_count > 0 || v.venue_id !== null) // Quitar "sin sede" si no tiene ventas
      .sort((a, b) => b.total_revenue - a.total_revenue);

    // Totales globales
    const globalTotal = venueArray.reduce((sum, v) => sum + v.total_revenue, 0);
    const globalSales = venueArray.reduce((sum, v) => sum + v.sales_count, 0);

    // Calcular porcentaje de cada sede
    venueArray.forEach(v => {
      v.percentage_of_total = globalTotal > 0 
        ? ((v.total_revenue / globalTotal) * 100).toFixed(1) 
        : 0;
    });

    return res.status(200).json({
      success: true,
      report: {
        period: {
          start_date: startFilter.split('T')[0],
          end_date: endFilter.split('T')[0]
        },
        global: {
          total_venues: venueArray.filter(v => v.venue_id).length,
          total_sales: globalSales,
          total_revenue: globalTotal,
          average_ticket: globalSales > 0 ? globalTotal / globalSales : 0
        },
        venues: venueArray
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte por sede:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reporte por sede',
      error: error.message
    });
  }
};

/**
 * Reporte de ventas por categoría de producto
 */
export const getCategoryReport = async (req, res) => {
  try {
    const { venue_id, start_date, end_date } = req.query;
    
    // Default: último mes
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEnd = now.toISOString();
    
    const startFilter = start_date || defaultStart;
    const endFilter = end_date || defaultEnd;

    // Obtener ventas válidas primero
    let salesQuery = supabase
      .from('sales')
      .select('id')
      .eq('payment_status', 'completed')
      .gte('sale_date', startFilter)
      .lte('sale_date', endFilter);

    if (venue_id) salesQuery = salesQuery.eq('venue_id', venue_id);
    
    const { data: validSales } = await salesQuery;
    const validSaleIds = validSales?.map(s => s.id) || [];

    if (validSaleIds.length === 0) {
      return res.status(200).json({
        success: true,
        report: {
          period: { start_date: startFilter.split('T')[0], end_date: endFilter.split('T')[0] },
          categories: [],
          total_revenue: 0
        }
      });
    }

    // Obtener items de ventas con categoría
    const { data: items, error } = await supabase
      .from('sale_items')
      .select(`
        quantity, total, product_name,
        product:products(
          id, category_id,
          category:product_categories(id, name, icon, color)
        )
      `)
      .in('sale_id', validSaleIds);

    if (error) throw error;

    // Agrupar por categoría
    const categoryStats = {};
    
    items?.forEach(item => {
      const category = item.product?.category;
      const categoryId = category?.id || 'uncategorized';
      const categoryName = category?.name || 'Sin categoría';
      
      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          category_id: category?.id || null,
          category_name: categoryName,
          icon: category?.icon || '📦',
          color: category?.color || '#6B7280',
          items_sold: 0,
          total_revenue: 0,
          products: {}
        };
      }
      
      categoryStats[categoryId].items_sold += item.quantity;
      categoryStats[categoryId].total_revenue += parseFloat(item.total);
      
      // Top productos por categoría
      const productName = item.product_name;
      if (!categoryStats[categoryId].products[productName]) {
        categoryStats[categoryId].products[productName] = { quantity: 0, total: 0 };
      }
      categoryStats[categoryId].products[productName].quantity += item.quantity;
      categoryStats[categoryId].products[productName].total += parseFloat(item.total);
    });

    // Convertir a array y calcular porcentajes
    const totalRevenue = Object.values(categoryStats).reduce((sum, c) => sum + c.total_revenue, 0);
    
    const categoryArray = Object.values(categoryStats)
      .map(c => ({
        ...c,
        percentage: totalRevenue > 0 ? ((c.total_revenue / totalRevenue) * 100).toFixed(1) : 0,
        top_products: Object.entries(c.products)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 3)
      }))
      .map(({ products, ...rest }) => rest) // Remover el objeto products, ya tenemos top_products
      .sort((a, b) => b.total_revenue - a.total_revenue);

    return res.status(200).json({
      success: true,
      report: {
        period: {
          start_date: startFilter.split('T')[0],
          end_date: endFilter.split('T')[0]
        },
        total_revenue: totalRevenue,
        total_items: categoryArray.reduce((sum, c) => sum + c.items_sold, 0),
        categories: categoryArray
      }
    });
  } catch (error) {
    console.error('Error al obtener reporte por categoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reporte por categoría',
      error: error.message
    });
  }
};

/**
 * Alertas de inventario - Productos con stock bajo
 */
export const getLowStockAlerts = async (req, res) => {
  try {
    const { venue_id, category_id, include_out_of_stock = 'true' } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id, name, sku, stock_quantity, min_stock_alert, price, image_url,
        category:product_categories(id, name, icon, color),
        venue:venues(id, name)
      `)
      .eq('track_inventory', true)
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true });

    if (venue_id) query = query.eq('venue_id', venue_id);
    if (category_id) query = query.eq('category_id', category_id);

    const { data: products, error } = await query;
    if (error) throw error;

    // Filtrar productos con stock bajo
    const lowStockProducts = products?.filter(p => p.stock_quantity <= p.min_stock_alert) || [];
    
    // Separar sin stock y bajo stock
    const outOfStock = lowStockProducts.filter(p => p.stock_quantity === 0);
    const lowStock = lowStockProducts.filter(p => p.stock_quantity > 0);

    // Calcular valor del inventario en riesgo
    const valueAtRisk = lowStockProducts.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

    return res.status(200).json({
      success: true,
      alerts: {
        summary: {
          total_alerts: lowStockProducts.length,
          out_of_stock_count: outOfStock.length,
          low_stock_count: lowStock.length,
          value_at_risk: valueAtRisk
        },
        out_of_stock: outOfStock.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock_quantity: p.stock_quantity,
          min_stock_alert: p.min_stock_alert,
          category: p.category?.name,
          venue: p.venue?.name,
          urgency: 'critical'
        })),
        low_stock: lowStock.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock_quantity: p.stock_quantity,
          min_stock_alert: p.min_stock_alert,
          category: p.category?.name,
          venue: p.venue?.name,
          urgency: p.stock_quantity <= p.min_stock_alert / 2 ? 'high' : 'medium'
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener alertas de inventario',
      error: error.message
    });
  }
};

/**
 * Tendencia de ventas (últimos N días)
 */
export const getSalesTrend = async (req, res) => {
  try {
    const { venue_id, days = 30 } = req.query;
    const numDays = Math.min(parseInt(days), 90); // Máximo 90 días
    
    // Calcular rango
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    let query = supabase
      .from('sales')
      .select('sale_date, total, payment_method')
      .eq('payment_status', 'completed')
      .gte('sale_date', startDate.toISOString())
      .lte('sale_date', endDate.toISOString())
      .order('sale_date', { ascending: true });

    if (venue_id) query = query.eq('venue_id', venue_id);

    const { data: sales, error } = await query;
    if (error) throw error;

    // Crear mapa de días
    const dailyMap = {};
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = {
        date: dateStr,
        day_name: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        sales_count: 0,
        total: 0
      };
    }

    // Llenar con datos
    sales?.forEach(sale => {
      const dateStr = sale.sale_date.split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].sales_count++;
        dailyMap[dateStr].total += parseFloat(sale.total);
      }
    });

    const trend = Object.values(dailyMap);
    
    // Calcular promedio móvil de 7 días
    const movingAverage = trend.map((day, index) => {
      if (index < 6) return { ...day, moving_avg: null };
      const last7 = trend.slice(index - 6, index + 1);
      const avg = last7.reduce((sum, d) => sum + d.total, 0) / 7;
      return { ...day, moving_avg: avg };
    });

    // Estadísticas de la tendencia
    const totals = trend.reduce((acc, day) => {
      acc.total += day.total;
      acc.sales += day.sales_count;
      return acc;
    }, { total: 0, sales: 0 });

    const nonZeroDays = trend.filter(d => d.total > 0);
    const avgPerActiveDay = nonZeroDays.length > 0 ? totals.total / nonZeroDays.length : 0;

    return res.status(200).json({
      success: true,
      trend: {
        period: {
          days: numDays,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        summary: {
          total_revenue: totals.total,
          total_sales: totals.sales,
          average_per_day: totals.total / numDays,
          average_per_active_day: avgPerActiveDay,
          active_days: nonZeroDays.length
        },
        data: movingAverage
      }
    });
  } catch (error) {
    console.error('Error al obtener tendencia de ventas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tendencia',
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

