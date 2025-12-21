import { Router } from 'express'
import { createLeague, joinLeague, getLeaguesByUser, getLeagueById, getAllLeagues, generateStandings, getStandings, getStandingById, updateMatchResult, updateMatchSchedule, getMatchesByUserId, getMatchesByRound, getMatchesByLeague, removeTeamFromLeague, updateInscriptionPaymentStatus, updateLeague, getAvailablePlayers, getPlayerById, recalculateStandings } from '../controllers/leagues.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

// Add CORS headers
router.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

/**
 * @swagger
 * /leagues/createLeague:
 *   post:
 *     summary: Crea una nueva liga
 *     tags: [Ligas]
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
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 */
router.post('/createLeague', verifyToken, verifyAdmin, createLeague)

/**
 * @swagger
 * /leagues/all:
 *   get:
 *     summary: Obtiene todas las ligas
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/all', verifyToken, getAllLeagues);

/**
 * @swagger
 * /leagues/byId/{id}:
 *   get:
 *     summary: Obtiene una liga por ID
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la liga
 */
router.get('/byId/:id', verifyToken, getLeagueById);

/**
 * @swagger
 * /leagues/user/{userId}:
 *   get:
 *     summary: Obtiene las ligas de un usuario
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID del usuario
 */
router.get('/user/:userId', verifyToken, getLeaguesByUser);

/**
 * @swagger
 * /leagues/matches/user/{userId}:
 *   get:
 *     summary: Obtiene los partidos de un usuario
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID del usuario
 */
router.get('/matches/user/:userId', verifyToken, getMatchesByUserId);

/**
 * @swagger
 * /leagues/matches/round/{leagueId}:
 *   get:
 *     summary: Obtiene los partidos de una ronda
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         description: ID de la liga
 */
router.get('/matches/round/:leagueId', verifyToken, getMatchesByRound);

/**
 * @swagger
 * /leagues/matches/league/{leagueId}:
 *   get:
 *     summary: Obtiene los partidos de una liga
 *     tags: [Ligas]
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         description: ID de la liga
 */
router.get('/matches/league/:leagueId', getMatchesByLeague);

/**
 * @swagger
 * /leagues/join:
 *   post:
 *     summary: Une un equipo a una liga
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leagueId
 *               - teamId
 *             properties:
 *               leagueId:
 *                 type: string
 *               teamId:
 *                 type: string
 */
router.post('/join', verifyToken, joinLeague);

/**
 * @swagger
 * /leagues/generateStandings/{uuid}:
 *   post:
 *     summary: Genera la clasificación de una liga
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         description: UUID de la liga
 */
router.post('/generateStandings/:uuid', verifyToken, verifyAdmin, generateStandings);

/**
 * @swagger
 * /leagues/standings/{league_id}:
 *   get:
 *     summary: Obtiene la clasificación de una liga
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: league_id
 *         required: true
 *         description: ID de la liga
 */
router.get('/standings/:league_id', verifyToken, getStandings);

/**
 * @swagger
 * /leagues/standing/{id}:
 *   get:
 *     summary: Obtiene una clasificación específica
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la clasificación
 */
router.get('/standing/:id', verifyToken, getStandingById);

/**
 * @swagger
 * /leagues/match/result/{id}:
 *   post:
 *     summary: Actualiza el resultado de un partido
 *     tags: [Ligas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del partido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score1
 *               - score2
 *             properties:
 *               score1:
 *                 type: integer
 *               score2:
 *                 type: integer
 */
router.post('/match/result/:id', updateMatchResult);

/**
 * @swagger
 * /leagues/match/schedule/{id}:
 *   put:
 *     summary: Actualiza el horario de un partido
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del partido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 */
router.put('/match/schedule/:id', verifyToken, verifyAdmin, updateMatchSchedule);

/**
 * @swagger
 * /leagues/remove-team:
 *   delete:
 *     summary: Elimina un equipo de una liga
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leagueId
 *               - teamId
 *             properties:
 *               leagueId:
 *                 type: string
 *               teamId:
 *                 type: string
 */
router.delete('/remove-team', verifyToken, verifyAdmin, removeTeamFromLeague);

/**
 * @swagger
 * /leagues/inscription-payment:
 *   put:
 *     summary: Actualiza el estado de pago de inscripción
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leagueId
 *               - teamId
 *               - status
 *             properties:
 *               leagueId:
 *                 type: string
 *               teamId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, paid, rejected]
 */
router.put('/inscription-payment', verifyToken, verifyAdmin, updateInscriptionPaymentStatus);

/**
 * @swagger
 * /leagues/update/{id}:
 *   put:
 *     summary: Actualiza la información de una liga
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la liga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 */
router.put('/update/:id', verifyToken, verifyAdmin, updateLeague);

/**
 * @swagger
 * /leagues/players/available:
 *   get:
 *     summary: Obtiene jugadores disponibles para formar equipo
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 */
router.get('/players/available', verifyToken, getAvailablePlayers);

/**
 * @swagger
 * /leagues/players/{playerId}:
 *   get:
 *     summary: Obtiene un jugador por su ID
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         description: ID del jugador
 */
router.get('/players/:playerId', verifyToken, getPlayerById);

/**
 * @swagger
 * /leagues/recalculate-standings/{league_id}:
 *   post:
 *     summary: Recalcula los standings de una liga
 *     tags: [Ligas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: league_id
 *         required: true
 *         description: ID de la liga
 */
router.post('/recalculate-standings/:league_id', verifyToken, verifyAdmin, recalculateStandings);

export default router