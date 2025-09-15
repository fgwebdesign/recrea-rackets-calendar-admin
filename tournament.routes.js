import { Router } from 'express'
import { 
    getTournaments, 
    getTournamentById, 
    createTournament, 
    updateTournament, 
    deleteTournament, 
    changeTournamentType,
    joinTournament, 
    getMatchesByTournamentId, 
    generateLeagueMatches,
    generateEliminationBracket,
    getTournamentTeams,
    getAvailableHoursForRegistration,
    getAvailableTimeSlotsForRegistration,
    getAvailablePlayersForTournament,
    validateScheduleEndpoint,
    getTournamentsByUserId,
    generateGroupsPhase,
    generateGroupsManual,
    getGroups,
    getTournamentPaymentStats,
    getTournamentPeriodStats,
    getTournamentOverviewStats,
    validateGroupScheduleConflicts,
    scheduleMatchesByGroupAndDayEndpoint,
    getGroupStandings,
    updateTeamPaymentStatus,
    adminRegisterTeam
} from '../controllers/tournament.controller.js'
import { updateMatchResult } from '../controllers/match.controller.js'
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
 * /tournaments/{id}/change-type:
 *   put:
 *     summary: Cambia el tipo de torneo (9 o 12 jugadores) antes de cerrar inscripciones
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_tournament_type
 *             properties:
 *               new_tournament_type:
 *                 type: string
 *                 enum: [NINE_PLAYERS, TWELVE_PLAYERS]
 *                 description: Nuevo tipo de torneo
 *     responses:
 *       200:
 *         description: Tipo de torneo cambiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     old_type:
 *                       type: string
 *                     new_type:
 *                       type: string
 *                     old_max_teams:
 *                       type: number
 *                     new_max_teams:
 *                       type: number
 *                 impact:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     new_capacity:
 *                       type: number
 *                     available_for_registration:
 *                       type: boolean
 *       400:
 *         description: No se puede cambiar el tipo (equipos inscritos, grupos generados, etc.)
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id/change-type', verifyToken, verifyAdmin, changeTournamentType)

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
 * /tournaments/{id}/admin-register-team:
 *   post:
 *     summary: Registra un equipo en un torneo desde el panel de administración
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId1
 *               - userId2
 *               - unavailable_time_slot
 *             properties:
 *               userId1:
 *                 type: string
 *                 description: ID del primer jugador
 *               userId2:
 *                 type: string
 *                 description: ID del segundo jugador
 *               unavailable_time_slot:
 *                 type: string
 *                 description: Slot de tiempo no disponible para el equipo
 *     responses:
 *       200:
 *         description: Equipo registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament_team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     tournament_id:
 *                       type: string
 *                     team_id:
 *                       type: string
 *                     payment_status:
 *                       type: string
 *                     players:
 *                       type: object
 *                       properties:
 *                         player1:
 *                           type: string
 *                         player2:
 *                           type: string
 *       400:
 *         description: Datos inválidos o jugadores ya registrados
 *       404:
 *         description: Torneo o usuarios no encontrados
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id/admin-register-team', verifyToken, verifyAdmin, adminRegisterTeam)

// RUTA ELIMINADA: Conflictaba con la nueva implementación de getGroupStandings

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
 * /tournaments/{id}/available-players:
 *   get:
 *     summary: Obtiene los jugadores disponibles para inscribir en un torneo
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
 *     responses:
 *       200:
 *         description: Lista de jugadores disponibles para el torneo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   is_registered:
 *                     type: boolean
 *                     description: Indica si el jugador ya está inscrito en el torneo
 *                   status:
 *                     type: string
 *                     enum: [Ya inscrito, Disponible]
 *                     description: Estado del jugador en el torneo
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/available-players', verifyToken, verifyAdmin, getAvailablePlayersForTournament)

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


/**
 * @swagger
 * /tournaments/{id}/schedule-matches-by-group:
 *   post:
 *     summary: Programa automáticamente los partidos por grupo y día
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
 *     responses:
 *       200:
 *         description: Partidos programados exitosamente por grupo y día
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                 programming_summary:
 *                   type: object
 *                   properties:
 *                     total_matches:
 *                       type: number
 *                     programming_period:
 *                       type: object
 *                     matches_by_day:
 *                       type: object
 *                     matches_by_court:
 *                       type: object
 *                     matches_by_group:
 *                       type: object
 *                     available_courts:
 *                       type: number
 *                 scheduled_matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       group:
 *                         type: string
 *                       teams:
 *                         type: string
 *                       date:
 *                         type: string
 *                       time:
 *                         type: string
 *                       court:
 *                         type: number
 *                       conflicts_avoided:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: No hay partidos pendientes de programación
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error en la programación por grupo y día
 */
router.post('/:id/schedule-matches-by-group', verifyToken, verifyAdmin, scheduleMatchesByGroupAndDayEndpoint)

/**
 * @swagger
 * /tournaments/{id}/standings:
 *   get:
 *     summary: Obtener tabla de posiciones por grupo
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *     responses:
 *       200:
 *         description: Tabla de posiciones calculada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament:
 *                   type: object
 *                 standings:
 *                   type: object
 *                 classification_summary:
 *                   type: object
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error calculando standings
 */
router.get('/:id/standings', getGroupStandings)

/**
 * @swagger
 * /tournaments/{id}/generate-elimination-bracket:
 *   post:
 *     summary: Generar cuadro eliminatorio automáticamente
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *     responses:
 *       200:
 *         description: Cuadro eliminatorio generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament:
 *                   type: object
 *                 bracket:
 *                   type: object
 *                 elimination_matches:
 *                   type: array
 *                 qualified_teams:
 *                   type: array
 *       400:
 *         description: No hay equipos clasificados
 *       500:
 *         description: Error generando cuadro eliminatorio
 */
router.post('/:id/generate-elimination-bracket', verifyToken, verifyAdmin, generateEliminationBracket)

/**
 * @swagger
 * /tournaments/{tournamentId}/teams/{teamId}/payment:
 *   put:
 *     summary: Actualizar estado de pago de un equipo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_status
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *                 description: Estado del pago
 *               payment_amount:
 *                 type: number
 *                 description: Monto del pago (opcional, si no se especifica usa inscription_cost del torneo)
 *     responses:
 *       200:
 *         description: Estado de pago actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Equipo no encontrado en el torneo
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:tournamentId/teams/:teamId/payment', verifyToken, verifyAdmin, updateTeamPaymentStatus)

/**
 * @swagger
 * /tournaments/{id}/payment-stats:
 *   get:
 *     summary: Obtener estadísticas de pagos del torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *     responses:
 *       200:
 *         description: Estadísticas de pagos obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     inscription_cost:
 *                       type: number
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_teams:
 *                       type: number
 *                     paid_teams:
 *                       type: number
 *                     pending_teams:
 *                       type: number
 *                     failed_teams:
 *                       type: number
 *                     total_revenue:
 *                       type: number
 *                     pending_revenue:
 *                       type: number
 *                     completion_percentage:
 *                       type: number
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/payment-stats', verifyToken, verifyAdmin, getTournamentPaymentStats)

// ========================================
// 📊 RUTAS DE ESTADÍSTICAS
// ========================================

/**
 * @swagger
 * /tournaments/stats/payments/{tournamentId}:
 *   get:
 *     summary: Obtener estadísticas de pagos de un torneo
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: ID de la categoría (opcional)
 *     responses:
 *       200:
 *         description: Estadísticas de pagos obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament_name:
 *                   type: string
 *                 tournament_type:
 *                   type: string
 *                 inscription_cost:
 *                   type: number
 *                 total_categories:
 *                   type: number
 *                 total_teams:
 *                   type: number
 *                 total_potential_revenue:
 *                   type: number
 *                 paid_teams:
 *                   type: number
 *                 pending_teams:
 *                   type: number
 *                 failed_teams:
 *                   type: number
 *                 actual_revenue:
 *                   type: number
 *                 pending_revenue:
 *                   type: number
 *                 payment_rate:
 *                   type: number
 *                 categories_breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/payments/:tournamentId', verifyToken, verifyAdmin, getTournamentPaymentStats)

/**
 * @swagger
 * /tournaments/stats/period:
 *   get:
 *     summary: Obtener estadísticas de torneos por período
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly, daily]
 *         description: Período de agrupación
 *     responses:
 *       200:
 *         description: Estadísticas del período obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 total_tournaments:
 *                   type: number
 *                 total_categories:
 *                   type: number
 *                 total_teams:
 *                   type: number
 *                 total_revenue:
 *                   type: number
 *                 average_payment_rate:
 *                   type: number
 *                 monthly_breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Parámetros de fecha requeridos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/period', verifyToken, verifyAdmin, getTournamentPeriodStats)

/**
 * @swagger
 * /tournaments/stats/overview:
 *   get:
 *     summary: Obtener estadísticas generales de torneos
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_tournaments:
 *                   type: number
 *                 active_tournaments:
 *                   type: number
 *                 completed_tournaments:
 *                   type: number
 *                 upcoming_tournaments:
 *                   type: number
 *                 total_teams:
 *                   type: number
 *                 paid_teams:
 *                   type: number
 *                 payment_rate:
 *                   type: number
 *                 tournament_types:
 *                   type: object
 *       500:
 *         description: Error interno del servidor
 */
router.get('/stats/overview', verifyToken, verifyAdmin, getTournamentOverviewStats)

/**
 * @swagger
 * /tournaments/{tournamentId}/matches/{matchId}/result:
 *   put:
 *     summary: Actualizar resultado de un partido eliminatorio
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del torneo
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del partido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - set1
 *               - set2
 *             properties:
 *               set1:
 *                 type: object
 *                 properties:
 *                   team1:
 *                     type: number
 *                   team2:
 *                     type: number
 *                   tiebreak:
 *                     type: object
 *               set2:
 *                 type: object
 *                 properties:
 *                   team1:
 *                     type: number
 *                   team2:
 *                     type: number
 *                   tiebreak:
 *                     type: object
 *               superTiebreak:
 *                 type: object
 *                 properties:
 *                   team1:
 *                     type: number
 *                   team2:
 *                     type: number
 *     responses:
 *       200:
 *         description: Resultado actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Partido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:tournamentId/matches/:matchId/result', verifyToken, verifyAdmin, updateMatchResult)

export default router