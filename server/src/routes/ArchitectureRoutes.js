/**
 * Routes for architecture CRUD operations and public architecture browsing.
 */
import express from 'express'
import {
    forkArchitecture,
    deleteArchitecutre,
    createArchitecture,
    editArchitecture,
    getArchitectureById,
    getArchitectures,
    getPublicArchitectures
    
} from '../controllers/ArchitecturesController.js'
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

//get routes
router.get('/' , authenticate , getArchitectures)
router.get('/public', optionalAuth, getPublicArchitectures)
router.get('/:id', optionalAuth , getArchitectureById)

//post routes
router.post('/', authenticate , createArchitecture)
router.post('/:id/fork', authenticate , forkArchitecture)

//put route
router.put('/:id', authenticate, editArchitecture)

//delete route
router.delete('/:id' , authenticate , deleteArchitecutre)



export default router