import express from 'express'
import AuthController from './auth.controller'
import auth from '../../middleware/auth'

const authRoutes = express.Router()

authRoutes.post('/register', AuthController.register)
authRoutes.post('/', AuthController.login)
authRoutes.use(auth).delete('/', AuthController.logout)
authRoutes.use(auth).get('/', AuthController.user)

export default authRoutes
