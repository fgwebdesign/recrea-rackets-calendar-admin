import { Router } from 'express'
import { 
    getTournaments, 
    getTournamentById, 
    createTournament, 
    updateTournament, 
    deleteTournament, 
    joinTournament, 
    getStandings, 
    getMatchesByTournamentId, 
    generateLeagueMatches,
    generateEliminationBracket,
    getTournamentTeams,
    getAvailableHoursForRegistration,
    getAvailableTimeSlotsForRegistration,
    validateScheduleEndpoint,
    getTournamentsByUserId,
    generateGroupsPhase,
    generateGroupsManual,
    getGroups,
    validateGroupScheduleConflicts,
} from '../controllers/tournament.controller.js'
import { setTournamentRequiredInfo, setTournamentThumbnail, setTournamentPrize, setTournamentSponsors } from '../controllers/tournamentInfo.controller.js'
import { populateTournament } from '../helpers/tournament.helpers.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

/**
 * @swagger
 * /tournaments:
 *   get:
 *     summary: Obtiene todos los torneos
 *     tags: [Torneos]
 *     responses:
 *       200:
 *         description: Lista de torneos
 */
router.get('/', getTournaments)

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     summary: Obtiene un torneo por ID
 *     tags: [Torneos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del torneo
 */
router.get('/:id', getTournamentById)

/**
 * @swagger
 * /tournaments/create:
 *   post:
 *     summary: Crea un nuevo torneo
 *     tags: [Torneos]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               type:
 *                 type: string
 *                 enum: [league, elimination]
 */
router.post('/create', verifyToken, verifyAdmin, createTournament)

/**
 * @swagger
 * /tournaments/{id}:
 *   put:
 *     summary: Actualiza un torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', verifyToken, verifyAdmin, updateTournament)

/**
 * @swagger
 * /tournaments/{id}:
 *   delete:
 *     summary: Elimina un torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', verifyToken, verifyAdmin, deleteTournament)

/**
 * @swagger
 * /tournaments/{id}/join:
 *   post:
 *     summary: Une un equipo a un torneo
 *     tags: [Torneos]
 */
router.post('/:id/join', joinTournament)

/**
 * @swagger
 * /tournaments/{id}/standings:
 *   get:
 *     summary: Obtiene la clasificación del torneo
 *     tags: [Torneos]
 */
router.get('/:id/standings', getStandings)

/**
 * @swagger
 * /tournaments/{id}/generate-matches:
 *   post:
 *     summary: Genera los partidos de la liga
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/generate-matches', verifyToken, verifyAdmin, generateLeagueMatches)

/**
 * @swagger
 * /tournaments/{id}/matches:
 *   get:
 *     summary: Obtiene los partidos del torneo
 *     tags: [Torneos]
 */
router.get('/:id/matches', getMatchesByTournamentId)

/**
 * @swagger
 * /tournaments/{id}/required-info:
 *   post:
 *     summary: Establece información requerida del torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/required-info', verifyToken, verifyAdmin, setTournamentRequiredInfo)

/**
 * @swagger
 * /tournaments/{id}/thumbnail:
 *   post:
 *     summary: Establece la imagen del torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/thumbnail', verifyToken, verifyAdmin, setTournamentThumbnail)

/**
 * @swagger
 * /tournaments/{id}/prize:
 *   post:
 *     summary: Establece los premios del torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/prize', verifyToken, verifyAdmin, setTournamentPrize)

/**
 * @swagger
 * /tournaments/{id}/sponsors:
 *   post:
 *     summary: Establece los patrocinadores del torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/sponsors', verifyToken, verifyAdmin, setTournamentSponsors)

/**
 * @swagger
 * /tournaments/{id}/generate-bracket:
 *   post:
 *     summary: Genera el bracket de eliminación
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/generate-bracket', verifyToken, verifyAdmin, generateEliminationBracket)

/**
 * @swagger
 * /tournaments/{id}/populate:
 *   post:
 *     summary: Puebla el torneo con datos de prueba
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/populate', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await populateTournament(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

/**
 * @swagger
 * /tournaments/{id}/generate-groups:
 *   post:
 *     summary: Genera grupos automáticamente para un torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/generate-groups', verifyToken, verifyAdmin, generateGroupsPhase)

/**
 * @swagger
 * /tournaments/{id}/generate-groups-manual:
 *   post:
 *     summary: Genera grupos manualmente para un torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/generate-groups-manual', verifyToken, verifyAdmin, generateGroupsManual)

/**
 * @swagger
 * /tournaments/{id}/teams:
 *   get:
 *     summary: Obtiene los equipos del torneo
 *     tags: [Torneos]
 */
router.get('/:id/teams', getTournamentTeams)

/**
 * @swagger
 * /tournaments/{id}/available-hours:
 *   get:
 *     summary: Obtiene las horas disponibles (LEGACY)
 *     tags: [Torneos]
 */
router.get('/:id/available-hours', getAvailableHoursForRegistration)

/**
 * @swagger
 * /tournaments/{id}/available-time-slots:
 *   get:
 *     summary: Obtiene los time slots disponibles para inscripción
 *     tags: [Torneos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del torneo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Time slots disponibles con información de capacidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament_info:
 *                   type: object
 *                 available_slots:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slot_id:
 *                         type: string
 *                       label:
 *                         type: string
 *                       total_capacity:
 *                         type: number
 *                       current_usage:
 *                         type: number
 *                       remaining_slots:
 *                         type: number
 *                       is_available:
 *                         type: boolean
 *                       percentage_full:
 *                         type: number
 */
router.get('/:id/available-time-slots', getAvailableTimeSlotsForRegistration)

/**
 * @swagger
 * /tournaments/{id}/validate-schedule:
 *   get:
 *     summary: Valida el horario del torneo
 *     tags: [Torneos]
 */
router.get('/:id/validate-schedule', validateScheduleEndpoint)

/**
 * @swagger
 * /tournaments/user/{userId}:
 *   get:
 *     summary: Obtiene los torneos de un usuario
 *     tags: [Torneos]
 */
router.get('/user/:userId', getTournamentsByUserId)

/**
 * @swagger
 * /tournaments/{id}/groups:
 *   get:
 *     summary: Obtiene los grupos de un torneo
 *     tags: [Torneos]
 */
router.get('/:id/groups', getGroups)

/**
 * @swagger
 * /tournaments/{id}/validate-group-conflicts:
 *   post:
 *     summary: Valida conflictos horarios en grupos propuestos
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del torneo
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groups:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     group_number:
 *                       type: number
 *                     teams:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Validación completada con detalles de conflictos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                 validation_results:
 *                   type: array
 */
router.post('/:id/validate-group-conflicts', verifyToken, verifyAdmin, validateGroupScheduleConflicts)

export default router