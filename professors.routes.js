import { Router } from 'express'
import { 
  getProfessors, 
  getAllProfessors,
  createProfessor, 
  getProfessor, 
  updateProfessor, 
  deleteProfessor 
} from '../controllers/professors.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'
import { verifyAdmin } from '../middlewares/admin.middleware.js'

const router = Router()

// GET /api/professors - Obtener todos los profesores activos (público)
router.get('/', getProfessors)

// GET /api/professors/all - Obtener todos los profesores incluyendo inactivos (admin)
router.get('/all', verifyToken, verifyAdmin, getAllProfessors)

// POST /api/professors - Crear nuevo profesor (admin)
router.post('/', verifyToken, verifyAdmin, createProfessor)

// GET /api/professors/:id - Obtener profesor por ID (público)
router.get('/:id', getProfessor)

// PUT /api/professors/:id - Actualizar profesor (admin)
router.put('/:id', verifyToken, verifyAdmin, updateProfessor)

// DELETE /api/professors/:id - Eliminar profesor (admin)
router.delete('/:id', verifyToken, verifyAdmin, deleteProfessor)

export default router
