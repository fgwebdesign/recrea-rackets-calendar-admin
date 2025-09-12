import { Router } from 'express'
import { 
  getMatches, 
  getMatch, 
  createMatch, 
  updateMatch, 
  updateMatchResult,
  deleteMatch 
} from '../controllers/match.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

// Listar todos los partidos (opcional query ?tournament_id=...)
router.get('/', getMatches)

// Obtener un partido específico
router.get('/:id', getMatch)

// Crear partido
router.post('/', verifyToken, verifyAdmin, createMatch)

// Actualizar partido
router.put('/:id', verifyToken, verifyAdmin, updateMatch)

// Actualizar resultado de partido (Sistema Pádel Uruguayo)
router.put('/tournaments/:tournamentId/matches/:matchId/result', verifyToken, verifyAdmin, updateMatchResult)

// Eliminar partido
router.delete('/:id', verifyToken, verifyAdmin, deleteMatch)

export default router