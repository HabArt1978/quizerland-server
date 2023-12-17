import express from 'express'
import QuizzesController from './quizzes.controller'
import auth from '../../middleware/auth'

const quizzesRoutes = express.Router()

quizzesRoutes.use(auth).post('/', QuizzesController.create)

quizzesRoutes.use(auth).get('/', QuizzesController.quizzes)

quizzesRoutes
    .use(auth)
    .get('/next-incomplete', QuizzesController.getNextIncompleteQuiz)

quizzesRoutes.use(auth).get('/:id', QuizzesController.getQuizById)

quizzesRoutes
    .use(auth)
    .put('/:quizId/progress', QuizzesController.updateQuizProgress)

quizzesRoutes
    .use(auth)
    .delete('/:quizId/progress', QuizzesController.deleteQuizProgress)

export default quizzesRoutes
