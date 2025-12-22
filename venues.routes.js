// ========================================
// 🏟️ VENUE ROUTES
// ========================================
// Rutas para gestión de Sedes/Clubs
// ========================================

import { Router } from 'express';
import {
  getAllVenues,
  getVenueById,
  getDefaultVenue,
  getCourtsByVenue,
  createVenue,
  updateVenue,
  assignCourtToVenue,
  assignCourtsToVenue,
  deleteVenue,
  hardDeleteVenue,
  getVenueStats,
  uploadVenuePhoto,
  // Multi-sede para Torneos
  addVenuesToTournament,
  getTournamentVenues,
  removeVenueFromTournament,
  // Multi-sede para Ligas
  addVenuesToLeague,
  getLeagueVenues,
  removeVenueFromLeague
} from '../controllers/venue.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// ========================================
// 🔍 RUTAS PÚBLICAS (GET)
// ========================================

/**
 * @swagger
 * /api/venues:
 *   get:
 *     summary: Obtener todas las sedes
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: include_courts
 *         schema:
 *           type: boolean
 *         description: Incluir lista de canchas por sede
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de sedes
 */
router.get('/', getAllVenues);

/**
 * @swagger
 * /api/venues/default:
 *   get:
 *     summary: Obtener la sede por defecto
 *     tags: [Venues]
 *     responses:
 *       200:
 *         description: Sede por defecto
 *       404:
 *         description: No hay sede por defecto
 */
router.get('/default', getDefaultVenue);

/**
 * @swagger
 * /api/venues/:id:
 *   get:
 *     summary: Obtener una sede por ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la sede
 *       404:
 *         description: Sede no encontrada
 */
router.get('/:id', getVenueById);

/**
 * @swagger
 * /api/venues/:venueId/courts:
 *   get:
 *     summary: Obtener canchas de una sede
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de canchas de la sede
 */
router.get('/:venueId/courts', getCourtsByVenue);

/**
 * @swagger
 * /api/venues/:id/stats:
 *   get:
 *     summary: Obtener estadísticas de una sede
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estadísticas de la sede
 */
router.get('/:id/stats', getVenueStats);

// ========================================
// ✨ RUTAS PROTEGIDAS (Requieren autenticación)
// ========================================

/**
 * @swagger
 * /api/venues:
 *   post:
 *     summary: Crear una nueva sede
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               description:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Sede creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', verifyToken, verifyAdmin, createVenue);

/**
 * @swagger
 * /api/venues/:id:
 *   put:
 *     summary: Actualizar una sede
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sede actualizada
 *       404:
 *         description: Sede no encontrada
 */
router.put('/:id', verifyToken, verifyAdmin, updateVenue);

/**
 * @swagger
 * /api/venues/:id/photo:
 *   post:
 *     summary: Subir imagen de perfil para una sede
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Archivo inválido o muy grande
 *       404:
 *         description: Sede no encontrada
 */
router.post('/:id/photo', verifyToken, verifyAdmin, uploadVenuePhoto);

/**
 * @swagger
 * /api/venues/:venueId/assign-court:
 *   post:
 *     summary: Asignar una cancha a una sede
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - court_id
 *             properties:
 *               court_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Cancha asignada exitosamente
 */
router.post('/:venueId/assign-court', verifyToken, verifyAdmin, assignCourtToVenue);

/**
 * @swagger
 * /api/venues/:venueId/assign-courts:
 *   post:
 *     summary: Asignar múltiples canchas a una sede
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - court_ids
 *             properties:
 *               court_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Canchas asignadas exitosamente
 */
router.post('/:venueId/assign-courts', verifyToken, verifyAdmin, assignCourtsToVenue);

/**
 * @swagger
 * /api/venues/:id:
 *   delete:
 *     summary: Desactivar una sede (soft delete)
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Forzar desactivación aunque tenga eventos activos
 *     responses:
 *       200:
 *         description: Sede desactivada
 *       400:
 *         description: No se puede desactivar (tiene eventos activos)
 */
router.delete('/:id', verifyToken, verifyAdmin, deleteVenue);

/**
 * @swagger
 * /api/venues/:id/permanent:
 *   delete:
 *     summary: Eliminar permanentemente una sede (solo si no tiene datos)
 *     tags: [Venues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sede eliminada permanentemente
 *       400:
 *         description: No se puede eliminar (tiene datos asociados)
 */
router.delete('/:id/permanent', verifyToken, verifyAdmin, hardDeleteVenue);

// ========================================
// 🏆 RUTAS MULTI-SEDE PARA TORNEOS
// ========================================

/**
 * @swagger
 * /api/venues/tournaments/:tournamentId:
 *   get:
 *     summary: Obtener sedes y canchas de un torneo
 *     tags: [Venues - Tournaments]
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de sedes con sus canchas
 */
router.get('/tournaments/:tournamentId', getTournamentVenues);

/**
 * @swagger
 * /api/venues/tournaments/:tournamentId:
 *   post:
 *     summary: Agregar sedes y canchas a un torneo
 *     tags: [Venues - Tournaments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venues
 *             properties:
 *               venues:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     venue_id:
 *                       type: string
 *                       format: uuid
 *                     court_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                     is_primary:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Sedes y canchas agregadas exitosamente
 */
router.post('/tournaments/:tournamentId', verifyToken, verifyAdmin, addVenuesToTournament);

/**
 * @swagger
 * /api/venues/tournaments/:tournamentId/:venueId:
 *   delete:
 *     summary: Eliminar una sede de un torneo
 *     tags: [Venues - Tournaments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sede eliminada del torneo
 */
router.delete('/tournaments/:tournamentId/:venueId', verifyToken, verifyAdmin, removeVenueFromTournament);

// ========================================
// 🏅 RUTAS MULTI-SEDE PARA LIGAS
// ========================================

/**
 * @swagger
 * /api/venues/leagues/:leagueId:
 *   get:
 *     summary: Obtener sedes y canchas de una liga
 *     tags: [Venues - Leagues]
 */
router.get('/leagues/:leagueId', getLeagueVenues);

/**
 * @swagger
 * /api/venues/leagues/:leagueId:
 *   post:
 *     summary: Agregar sedes y canchas a una liga
 *     tags: [Venues - Leagues]
 *     security:
 *       - bearerAuth: []
 */
router.post('/leagues/:leagueId', verifyToken, verifyAdmin, addVenuesToLeague);

/**
 * @swagger
 * /api/venues/leagues/:leagueId/:venueId:
 *   delete:
 *     summary: Eliminar una sede de una liga
 *     tags: [Venues - Leagues]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/leagues/:leagueId/:venueId', verifyToken, verifyAdmin, removeVenueFromLeague);

export default router;

