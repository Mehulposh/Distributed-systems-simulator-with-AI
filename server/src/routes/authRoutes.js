import express from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import {
    Register,
    Login,
    GetMe
    
} from '../controllers/authControllers.js'

const router = express.Router()

router.post('/register', Register)
router.post('/login', Login)
router.get('/me' , authenticate, GetMe)

export default router