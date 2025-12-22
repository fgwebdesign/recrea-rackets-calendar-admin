import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';
import {
  // Categorías
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  // Productos
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  // Ventas
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  // Reportes
  getSalesSummary,
  getTopProducts,
  getInventoryMovements,
  // Imágenes
  uploadProductImage,
  deleteProductImage,
  uploadCategoryImage
} from '../controllers/kiosk.controller.js';

const router = Router();

// =====================================================
// RUTAS PÚBLICAS (requieren autenticación básica)
// =====================================================

// Categorías de productos - Lectura pública
router.get('/categories', getProductCategories);

// Productos - Lectura pública
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// =====================================================
// RUTAS DE ADMIN - Categorías
// =====================================================

router.post('/categories', verifyToken, verifyAdmin, createProductCategory);
router.put('/categories/:id', verifyToken, verifyAdmin, updateProductCategory);
router.delete('/categories/:id', verifyToken, verifyAdmin, deleteProductCategory);

// =====================================================
// RUTAS DE ADMIN - Productos
// =====================================================

router.post('/products', verifyToken, verifyAdmin, createProduct);
router.put('/products/:id', verifyToken, verifyAdmin, updateProduct);
router.delete('/products/:id', verifyToken, verifyAdmin, deleteProduct);
router.patch('/products/:id/stock', verifyToken, verifyAdmin, updateProductStock);

// =====================================================
// RUTAS DE ADMIN - Ventas
// =====================================================

router.post('/sales', verifyToken, verifyAdmin, createSale);
router.get('/sales', verifyToken, verifyAdmin, getSales);
router.get('/sales/:id', verifyToken, verifyAdmin, getSaleById);
router.post('/sales/:id/cancel', verifyToken, verifyAdmin, cancelSale);

// =====================================================
// RUTAS DE ADMIN - Reportes
// =====================================================

router.get('/reports/summary', verifyToken, verifyAdmin, getSalesSummary);
router.get('/reports/top-products', verifyToken, verifyAdmin, getTopProducts);
router.get('/inventory/movements', verifyToken, verifyAdmin, getInventoryMovements);

// =====================================================
// RUTAS DE ADMIN - Imágenes
// =====================================================

router.post('/products/:id/image', verifyToken, verifyAdmin, uploadProductImage);
router.delete('/products/:id/image', verifyToken, verifyAdmin, deleteProductImage);
router.post('/categories/:id/image', verifyToken, verifyAdmin, uploadCategoryImage);

export default router;

