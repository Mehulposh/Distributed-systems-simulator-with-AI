/**
 * Admin routes for statistics, user management, moderation, and preset control.
 */
import express from 'express'
import { authenticate, adminOnly } from '../middleware/authMiddleware.js'
import {
    getArchitecture,
    getPresets,
    getStats,
    getUsers,
    updateRole,
    updateVisibility,
    deleteArchitecture,
    deletePresets,
    deleteUser,
    Promote
} from '../controllers/adminController.js'

const router = express.Router()

router.use(authenticate, adminOnly)

//getRoutes
router.get('/stats', getStats)
router.get('/users', getUsers)
router.get('/architectures', getArchitecture)
router.get('/presets', getPresets)


//patch routes
router.patch('/user/:id/role', updateRole)
router.patch('/architectures/:id/visibility', updateVisibility)


//delete routes
router.delete('/users/:id', deleteUser)
router.delete('/architectures/:id', deleteArchitecture)
router.delete('presets/:id', deletePresets)


// One-time bootstrap: promotes the first registered user to admin
// Remove this route or guard it with an env secret in production
router.post('/make-admin', Promote)

export default router