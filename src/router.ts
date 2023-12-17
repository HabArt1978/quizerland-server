import express from 'express'
import authRoutes from './modules/auth/auth.routes'
import quizzesRoutes from './modules/quizzes/quizzes.routes'

const router = express.Router()

router.use('/api/auth', authRoutes)
router.use('/api/quizzes', quizzesRoutes)

export default router
