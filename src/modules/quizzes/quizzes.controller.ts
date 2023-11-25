import { Request, Response } from 'express'
import { TQuizSchema, quizSchema } from './schemas/quiz.schema'
import UserModel from '../../users/models/user.model'
import TokenModel from '../auth/models/token.model'
import QuizModel, { Quiz } from './models/quiz.model'
import QuizListItemResponseDTO from './responses/quizListItemResponseDTO'
import log from '../../utilities/logger'

class QuizzesController {
  // ========================
  // ===== create quiz ======
  // ========================
  async create(
    req: Request<{}, {}, TQuizSchema>,
    res: Response,
  ): Promise<Response> {
    const candidateQuiz = req.body
    console.log(candidateQuiz)

    try {
      // валидация  ( ZOD )
      const verifiedBodyRequest = quizSchema.parse(candidateQuiz)

      // Достаём токен из cookie
      const token = req.cookies['auth.token'] as string | undefined
      if (!token) {
        return res.status(401).json({ message: 'Пользователь не авторизован' })
      }

      // Проверяем, есть ли токен ( из cookie ) в db
      const verifiedToken = await TokenModel.findOne({ token })
      // Если токен есть, находим пользователя с id === userId из токена
      const user = await UserModel.findById(verifiedToken?.userId)
      if (user === null) {
        return res
          .status(403)
          .json({ message: 'Пользователь не зарегистрирован' })
      }

      // Добавляем новый тест в db, привязывая id-пользователя к тесту
      const quiz = {
        ...verifiedBodyRequest,
        userId: user._id,
      }

      const createdQuiz = await QuizModel.create(quiz)

      return res.status(201).json(createdQuiz)
    } catch (err: any) {
      // все ошибки описанные в схеме ZOD
      if (err?.name === 'ZodError') {
        return res.status(422).json(err)
      }
      // непредвиденные ошибки
      return res.status(500).json(err)
    }
  }

  // ========================
  // === get all quizzes ====
  // ========================

  async quizzes(req: Request, res: Response): Promise<Response> {
    // Достаём токен из cookie
    const token = req.cookies['auth.token'] as string | undefined
    if (!token) {
      return res.status(401).json({ message: 'Пользователь не авторизован' })
    }

    // Проверяем, есть ли токен ( из cookie ) в db
    const verifiedToken = await TokenModel.findOne({ token })
    // Если токен есть, находим пользователя с id === userId из токена
    const user = await UserModel.findById(verifiedToken?.userId)
    if (user === null) {
      return res
        .status(403)
        .json({ message: 'Пользователь не зарегистрирован' })
    }

    //! Добавляем пагинацию

    // Если в параметре не задана задана страница, всегда отображаем 1-ю
    const page = req.query || 0
    // Устанавливаем количество тестов отображаемых на одной странице
    const quizzesPerPage = 50
    const quizzesTotalCount = await QuizModel.count()
    const quizzesPageCount = Math.ceil(quizzesTotalCount / quizzesPerPage)

    const quizzes = await QuizModel.find()
      .sort({ createdAt: -1 })
      .skip(+page * quizzesPerPage)
      .limit(quizzesPerPage)

    const quizzesResponse = quizzes.map((quiz: Quiz) =>
      QuizListItemResponseDTO.fromModel(quiz),
    )

    if (quizzesResponse.length === 0) {
      return res
        .status(403)
        .json({ message: 'В базе данных пока нет тестов, создайте первый)' })
    }

    return res.status(200).json({ quizzes: quizzesResponse, quizzesTotalCount })
  }
}

export default new QuizzesController()
