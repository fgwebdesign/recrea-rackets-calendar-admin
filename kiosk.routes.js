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
  // Reportes básicos
  getSalesSummary,
  getTopProducts,
  getInventoryMovements,
  // Reportes avanzados
  getDashboardStats,
  getMonthlyReport,
  getVenueComparisonReport,
  getCategoryReport,
  getLowStockAlerts,
  getSalesTrend,
  // Imágenes
  uploadProductImage,
  deleteProductImage,
  uploadCategoryImage,
  // Kiosk por Venue
  getVenueKioskSummary,
  copyProductsToVenue,
  getAllVenuesKioskComparison
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
// RUTAS DE ADMIN - Reportes Básicos
// =====================================================

router.get('/reports/summary', verifyToken, verifyAdmin, getSalesSummary);
router.get('/reports/top-products', verifyToken, verifyAdmin, getTopProducts);
router.get('/inventory/movements', verifyToken, verifyAdmin, getInventoryMovements);

// =====================================================
// RUTAS DE ADMIN - Reportes Avanzados
// =====================================================

// Dashboard principal con estadísticas consolidadas
router.get('/reports/dashboard', verifyToken, verifyAdmin, getDashboardStats);

// Reporte mensual con desglose diario
router.get('/reports/monthly', verifyToken, verifyAdmin, getMonthlyReport);

// Comparativa de ventas por sede
router.get('/reports/venues', verifyToken, verifyAdmin, getVenueComparisonReport);

// Ventas por categoría de producto
router.get('/reports/categories', verifyToken, verifyAdmin, getCategoryReport);

// Tendencia de ventas (últimos N días)
router.get('/reports/trend', verifyToken, verifyAdmin, getSalesTrend);

// Alertas de stock bajo
router.get('/inventory/alerts', verifyToken, verifyAdmin, getLowStockAlerts);

// =====================================================
// RUTAS DE ADMIN - Imágenes
// =====================================================

router.post('/products/:id/image', verifyToken, verifyAdmin, uploadProductImage);
router.delete('/products/:id/image', verifyToken, verifyAdmin, deleteProductImage);
router.post('/categories/:id/image', verifyToken, verifyAdmin, uploadCategoryImage);

// =====================================================
// RUTAS DE KIOSK POR VENUE
// =====================================================

// Obtener resumen del kiosk de un venue específico
router.get('/venue/:venue_id/summary', verifyToken, verifyAdmin, getVenueKioskSummary);

// Comparativa de todos los kiosks (para dashboard admin)
router.get('/venues/comparison', verifyToken, verifyAdmin, getAllVenuesKioskComparison);

// Copiar productos de un venue a otro (útil para inicializar nuevo kiosk)
router.post('/venues/copy-products', verifyToken, verifyAdmin, copyProductsToVenue);

export default router;

