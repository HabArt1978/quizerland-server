import { Request, Response } from 'express'
import { Types } from 'mongoose'

import { TQuizSchema, quizSchema } from './schemas/quiz.schema'
import UserModel, { User } from '../users/models/user.model'
import QuizModel, { Quiz } from './models/quiz.model'
import QuizListItemResponseDTO from './dto/responses/quizListItem.response.dto'
import ProgressModel from './models/progress.model'
import QuizResponseDTO from './dto/responses/quiz.response.dto'
import ProgressRequestDTO from './dto/requests/progress.request.dto'
import ResponseError from '../../shared/errors/ResponseError'

import { DocumentType } from '@typegoose/typegoose'

class QuizzesController {
    // ========================
    // ===== create quiz ======
    // ========================
    async create(
        req: Request<{}, {}, TQuizSchema>,
        res: Response,
    ): Promise<Response> {
        const candidateQuiz = req.body

        const user = User.currentUser()

        try {
            // валидация  ( ZOD )
            const verifiedBodyRequest = quizSchema.parse(candidateQuiz)

            // Добавляем новый тест в db, привязывая id-пользователя к тесту
            const quiz = {
                ...verifiedBodyRequest,
                userId: user._id,
            }

            const createdQuiz = await QuizModel.create(quiz)

            return res.status(201).json({ id: createdQuiz._id })
        } catch (err: any) {
            // все ошибки описанные в схеме ZOD
            if (err?.name === 'ZodError') {
                return new ResponseError(err.message, 422).toResponse(res)
            }
            // непредвиденные ошибки
            return new ResponseError().toResponse(res)
        }
    }

    // ========================
    // === get all quizzes ====
    // ========================

    async quizzes(req: Request, res: Response): Promise<Response> {
        //! Добавляем пагинацию
        // Если в параметре не задана задана страница, всегда отображаем 1-ю
        const page = req.query.page || 0
        // Устанавливаем количество тестов отображаемых на одной странице
        const quizzesPerPage = 50
        const quizzesTotalCount = await QuizModel.count()

        const quizzes = await QuizModel.find()
            .sort({ createdAt: -1 })
            .skip(+page * quizzesPerPage)
            .limit(quizzesPerPage)

        const quizzesResponse = quizzes.map((quiz: Quiz) =>
            QuizListItemResponseDTO.fromModel(quiz),
        )

        return res
            .status(200)
            .json({ quizzes: quizzesResponse, quizzesTotalCount })
    }

    // ========================
    // === get quiz by id =====
    // ========================

    async getQuizById(
        req: Request<{ id: string }>,
        res: Response,
    ): Promise<Response> {
        const quizId = req.params.id
        const user = User.currentUser()

        try {
            const quizItem = await QuizModel.findById(quizId)
            if (quizItem === null) {
                throw new ResponseError(`Тест с id: ${quizId} не найден`, 404)
            }

            const detectedProgress = await ProgressModel.findOne({
                quizId: quizItem._id,
                userId: user._id,
            })

            const progress =
                detectedProgress === null
                    ? await ProgressModel.create({
                          userId: user._id,
                          quizId: quizItem._id,
                          currentQuestionIndex: 0,
                          rightAttempts: 0,
                          isFinished: false,
                      })
                    : detectedProgress

            const quizResponse = QuizResponseDTO.fromModel(quizItem, progress)

            return res.status(200).json(quizResponse)
        } catch (err: any) {
            if (err.name === 'CastError') {
                return new ResponseError('Тест не найден', 404).toResponse(res)
            }
            if (err instanceof ResponseError) {
                return err.toResponse(res)
            }
            return new ResponseError().toResponse(res)
        }
    }

    // =========================
    // update quizProgress by id
    // =========================

    async updateQuizProgress(
        req: Request<{ quizId: string }, {}, ProgressRequestDTO>,
        res: Response,
    ): Promise<Response> {
        const { isRightAttempt } = req.body
        const user = UserModel.currentUser()
        const quizId = req.params.quizId

        try {
            const quiz = await QuizModel.findById(req.params.quizId)
            if (quiz === null) {
                throw new ResponseError('Тест не найден', 404)
            }

            const detectedProgress = await ProgressModel.findOne({
                quizId: quiz.id,
                userId: user.id,
            })

            const progress =
                detectedProgress === null
                    ? await ProgressModel.create({
                          userId: user._id,
                          quizId: quizId,
                          currentQuestionIndex: 0,
                          rightAttempts: 0,
                          isFinished: false,
                      })
                    : detectedProgress

            const nextQuestionIndex = progress.currentQuestionIndex + 1
            const isQuizFinished = nextQuestionIndex === quiz.questions.length

            progress.rightAttempts += isRightAttempt ? 1 : 0
            if (isQuizFinished) {
                progress.isFinished = true
            } else {
                progress.currentQuestionIndex = nextQuestionIndex
            }
            await progress.save()

            return res.status(201).send(progress)
        } catch (err: any) {
            if (err instanceof ResponseError) {
                return err.toResponse(res)
            }
            return new ResponseError().toResponse(res)
        }
    }

    // ========================
    // = delete quiz progress =
    // ========================

    async deleteQuizProgress(
        req: Request<{ quizId: string }>,
        res: Response,
    ): Promise<Response> {
        const user = UserModel.currentUser()

        try {
            const quiz = await QuizModel.findById(req.params.quizId)
            if (quiz === null) {
                throw new ResponseError('Тест не найден')
            }

            const quizProgress = await ProgressModel.findOne({
                quizId: quiz.id,
                userId: user.id,
            })
            if (quizProgress === null) {
                throw new ResponseError('Прогресс не найден')
            }

            await quizProgress.deleteOne({
                quizId: quiz.id,
                userId: user.id,
            })

            return res.sendStatus(204)
        } catch (err: any) {
            if (err instanceof ResponseError) {
                return err.toResponse(res)
            }
            return new ResponseError().toResponse(res)
        }
    }

    // ========================
    // get next incomplete quiz
    // ========================

    async getNextIncompleteQuiz(
        req: Request<{}, {}, {}, { excludeIds: string[] }>,
        res: Response,
    ): Promise<Response> {
        const user = UserModel.currentUser()

        const excludedIds =
            req.query.excludeIds?.map(id => new Types.ObjectId(id)) ?? []

        try {
            const nextQuizAggregate = QuizModel.aggregate([
                {
                    $match: {
                        _id: {
                            $nin: excludedIds,
                        },
                    },
                },
                {
                    $lookup: {
                        from: ProgressModel.collection.name,
                        let: { aggregatedQuizId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    userId: user.id,
                                    $expr: {
                                        $eq: ['$quizId', '$$aggregatedQuizId'],
                                    },
                                },
                            },
                            { $project: { _id: 0, quizId: 1, isFinished: 1 } },
                            { $limit: 1 },
                        ],
                        as: 'availableQuizProgresses',
                    },
                },
                {
                    $match: {
                        $or: [
                            { 'availableQuizProgresses.0.isFinished': false },
                            { 'availableQuizProgresses.0': { $exists: false } },
                        ],
                    },
                },
                { $limit: 1 },
                { $project: { _id: 1 } },
            ])

            const nextQuizResult = await nextQuizAggregate.exec()
            if (nextQuizResult.length !== 0) {
                const data = nextQuizResult[0] as { _id: string }
                return res.json(data)
            }

            return res.status(404).json({ message: 'Все тесты пройдены' })
        } catch (err: any) {
            return new ResponseError().toResponse(res)
        }
    }
}

export default new QuizzesController()
