import { Router } from 'express'
import { uploadLeaguePhoto, getLeaguePhotos, deleteLeaguePhoto } from '../controllers/gallery.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

// Admin only routes
router.post('/upload', verifyToken, verifyAdmin, uploadLeaguePhoto)
router.delete('/:id', verifyToken, verifyAdmin, deleteLeaguePhoto)

// Public routes
router.get('/league/:league_id', getLeaguePhotos)

export default router 