import { ObjectId } from 'mongoose'
import { Quiz } from '../../models/quiz.model'
import { Progress } from '../../models/progress.model'
import { Question } from '../../models/question.model'

export default class QuizResponseDTO {
    quizItem: {
        id?: ObjectId
        userId: string
        title: string
        description: string
        questions: Question[]
        createdAt: string
    }
    progress: {
        id?: ObjectId
        currentQuestionIndex: number
        rightAttempts: number
        isFinished: boolean
    }

    static fromModel(
        quizModel: Quiz,
        progressModel: Progress,
    ): QuizResponseDTO {
        const dto = new this()
        dto.quizItem = {
            id: quizModel._id,
            userId: quizModel.userId,
            title: quizModel.title,
            description: quizModel.description,
            questions: quizModel.questions,
            createdAt: quizModel.createdAt,
        }
        dto.progress = {
            id: progressModel._id,
            currentQuestionIndex: progressModel.currentQuestionIndex,
            rightAttempts: progressModel.rightAttempts,
            isFinished: progressModel.isFinished,
        }

        return dto
    }
}
