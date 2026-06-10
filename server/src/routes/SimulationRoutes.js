import express from 'express'
import {
    getLogByID,
    getLogsHistory,
    saveLog
} from '../controllers/SimulationController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)
router.post('/log', saveLog)
router.get('/logs' , getLogsHistory)
router.get('/logs/:id', getLogByID)


export default router