import { Router } from 'express'
import {
    getTournaments,
    getTournamentById,
    createTournament,
    changeTournamentType,
    joinTournament,
    getMatchesByTournamentId,
    generateEliminationBracket,
    getTournamentTeams,
    getAvailablePlayersForTournament,
    getTournamentsByUserId,
    generateGroupsPhase,
    getGroups,
    getTournamentPaymentStats,
    getTournamentPeriodStats,
    getTournamentOverviewStats,
    getGroupStandings,
    updateTeamPaymentStatus,
    adminRegisterTeam,
    getAvailableGroupHours,
    scheduleMatchesController,
    getSchedulingStatusController,
    getSlotAvailabilityController,
    getTournamentVenues
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
 * /tournaments/{id}/venues:
 *   get:
 *     summary: Obtiene las sedes y canchas de un torneo
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
 *         description: Sedes y canchas del torneo obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 venues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       is_primary:
 *                         type: boolean
 *                       courts_count:
 *                         type: number
 *                       notes:
 *                         type: string
 *                       venue:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           address:
 *                             type: string
 *                           city:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           photo_url:
 *                             type: string
 *                       courts:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             photo_url:
 *                               type: string
 *                             is_available:
 *                               type: boolean
 *                             priority:
 *                               type: number
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_venues:
 *                       type: number
 *                     total_courts:
 *                       type: number
 *                     primary_venue:
 *                       type: string
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/venues', verifyToken, verifyAdmin, getTournamentVenues)

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

// RUTAS ELIMINADAS: updateTournament y deleteTournament ya no están disponibles
// Los torneos se crean automáticamente y no se modifican/eliminan manualmente

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

// ❌ RUTA ELIMINADA: generateLeagueMatches no existe
// router.post('/:id/generate-matches', verifyToken, verifyAdmin, generateLeagueMatches)

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

// RUTA ELIMINADA: generateGroupsManual ya no está disponible
// Los grupos se generan automáticamente con generateGroupsPhase

/**
 * @swagger
 * /tournaments/{id}/teams:
 *   get:
 *     summary: Obtiene los equipos del torneo
 *     tags: [Torneos]
 */
router.get('/:id/teams', getTournamentTeams)

// ❌ RUTA ELIMINADA: getAvailableHoursForRegistration no existe
// router.get('/:id/available-hours', getAvailableHoursForRegistration)

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
// ❌ RUTAS ELIMINADAS: Funciones de time slots dinámicos eliminadas
// router.get('/:id/available-time-slots', getAvailableTimeSlotsForRegistration)
// router.get('/:id/time-slots', getTimeSlotsForRegistration)

/**
 * @swagger
 * /tournaments/{id}/available-group-hours:
 *   get:
 *     summary: Obtiene horarios disponibles para fase de grupos
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
 *         description: Horarios disponibles con información de restricciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tournament:
 *                   type: object
 *                 available_hours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       label:
 *                         type: string
 *                       day:
 *                         type: number
 *                       start:
 *                         type: string
 *                       end:
 *                         type: string
 *                       date:
 *                         type: string
 *                       capacity:
 *                         type: number
 *                       current_restrictions:
 *                         type: number
 *                       is_heavily_restricted:
 *                         type: boolean
 *                 restrictions:
 *                   type: object
 *                   properties:
 *                     min_selection:
 *                       type: number
 *                     max_selection:
 *                       type: number
 *                     recommended:
 *                       type: number
 *                     message:
 *                       type: string
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id/available-group-hours', getAvailableGroupHours)

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

// ❌ RUTA ELIMINADA: validateScheduleEndpoint no existe
// router.get('/:id/validate-schedule', validateScheduleEndpoint)

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
// ❌ RUTA ELIMINADA: validateGroupScheduleConflicts no existe
// router.post('/:id/validate-group-conflicts', verifyToken, verifyAdmin, validateGroupScheduleConflicts)


/**
 * @swagger
 * /tournaments/{id}/schedule-matches:
 *   post:
 *     summary: Asigna automáticamente hora + cancha a partidos con día asignado
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
 *         description: Auto-scheduling completado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 scheduled:
 *                   type: number
 *                 failed:
 *                   type: number
 *                 total:
 *                   type: number
 *                 success_rate:
 *                   type: string
 *                 scheduled_matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       match_id:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                       court_id:
 *                         type: string
 *                       court_name:
 *                         type: string
 *                 failed_matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       match_id:
 *                         type: string
 *                       group:
 *                         type: number
 *                       match_number:
 *                         type: number
 *                       reason:
 *                         type: string
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error en auto-scheduling
 */
router.post('/:id/schedule-matches', verifyToken, verifyAdmin, scheduleMatchesController)

/**
 * @swagger
 * /tournaments/{id}/groups/{groupId}/assign-day:
 *   patch:
 *     summary: Asigna manualmente el día del torneo a un grupo mixto
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
 *       - in: path
 *         name: groupId
 *         required: true
 *         description: ID del grupo
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournament_day
 *             properties:
 *               tournament_day:
 *                 type: number
 *                 enum: [1, 2]
 *                 description: Día del torneo (1 o 2)
 *     responses:
 *       200:
 *         description: Día asignado exitosamente
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
 *                 group:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     group_number:
 *                       type: number
 *                     teams_count:
 *                       type: number
 *                     previous_day:
 *                       type: string
 *                     new_day:
 *                       type: string
 *                     is_homogeneous:
 *                       type: boolean
 *                 matches:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     updated:
 *                       type: number
 *                     previously_scheduled:
 *                       type: number
 *                     ready_for_auto_scheduling:
 *                       type: number
 *                 restrictions:
 *                   type: object
 *                   properties:
 *                     total_teams:
 *                       type: number
 *                     teams_with_restrictions:
 *                       type: number
 *                     total_restrictions:
 *                       type: number
 *                     restricted_times:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warning:
 *                       type: string
 *                 next_steps:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                     endpoint:
 *                       type: string
 *                     description:
 *                       type: string
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Torneo o grupo no encontrado
 *       500:
 *         description: Error asignando día
 */
// router.patch('/:id/groups/:groupId/assign-day', verifyToken, verifyAdmin, assignDayToGroupController) // DEPRECATED - not needed

/**
 * @swagger
 * /tournaments/{id}/scheduling-status:
 *   get:
 *     summary: Obtiene el estado completo del scheduling del torneo
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
 *         description: Estado del scheduling obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament:
 *                   type: object
 *                 groups_summary:
 *                   type: object
 *                 matches_summary:
 *                   type: object
 *                 slots_capacity:
 *                   type: object
 *                 groups:
 *                   type: array
 *                 next_action:
 *                   type: object
 *                 warnings:
 *                   type: array
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error obteniendo estado
 */
router.get('/:id/scheduling-status', verifyToken, verifyAdmin, getSchedulingStatusController)

/**
 * @swagger
 * /tournaments/{id}/slot-availability:
 *   get:
 *     summary: Obtiene la disponibilidad de slots del torneo considerando todas las categorías del evento
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
 *         description: Disponibilidad de slots obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament_id:
 *                   type: string
 *                 tournament_name:
 *                   type: string
 *                 event_id:
 *                   type: string
 *                 courts_available:
 *                   type: number
 *                 total_capacity_per_slot:
 *                   type: number
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     day1:
 *                       type: object
 *                     day2:
 *                       type: object
 *                 days:
 *                   type: object
 *                   properties:
 *                     1:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           slot_id:
 *                             type: string
 *                           start_time:
 *                             type: string
 *                           end_time:
 *                             type: string
 *                           capacity:
 *                             type: number
 *                           occupied:
 *                             type: number
 *                           available:
 *                             type: number
 *                           is_full:
 *                             type: boolean
 *                           is_available:
 *                             type: boolean
 *                           courts:
 *                             type: array
 *                     2:
 *                       type: array
 *       404:
 *         description: Torneo no encontrado
 *       500:
 *         description: Error obteniendo disponibilidad
 */
router.get('/:id/slot-availability', verifyToken, verifyAdmin, getSlotAvailabilityController)

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