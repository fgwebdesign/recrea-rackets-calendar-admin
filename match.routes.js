import { Router } from 'express'
import { 
  getMatch, 
  updateMatchResult
} from '../controllers/match.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

// Obtener un partido específico con información completa
router.get('/:id', getMatch)

// Actualizar resultado de partido (Sistema Pádel Uruguayo)
router.put('/:tournamentId/:matchId', verifyToken, verifyAdmin, updateMatchResult)

export default router