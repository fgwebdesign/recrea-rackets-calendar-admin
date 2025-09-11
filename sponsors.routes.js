import { Router } from 'express'
import { 
  getAllSponsors, 
  createSponsor, 
  updateSponsor,
  deleteSponsor,
  getTournamentSponsors,
  assignSponsorToTournament,
  removeSponsorFromTournament
} from '../controllers/sponsor.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

// Rutas básicas de sponsors
router.get('/', getAllSponsors)
router.post('/', verifyToken, verifyAdmin, createSponsor)
router.put('/:id', verifyToken, verifyAdmin, updateSponsor)
router.delete('/:id', verifyToken, verifyAdmin, deleteSponsor)

// Rutas para gestión de sponsors de torneos
router.get('/tournaments/:tournamentId', verifyToken, getTournamentSponsors)
router.post('/tournaments/:tournamentId/assign', verifyToken, verifyAdmin, assignSponsorToTournament)
router.delete('/tournaments/:tournamentId/:sponsorId', verifyToken, verifyAdmin, removeSponsorFromTournament)

export default router 