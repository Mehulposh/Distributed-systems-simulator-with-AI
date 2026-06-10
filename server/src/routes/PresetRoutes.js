import express from 'express'
import { getPresets, getPresetsById } from '../controllers/PresetsController.js'

const router = express.Router()

router.get('/' , getPresets)
router.get('/:id' , getPresetsById)

export default router