import { Schema } from 'mongoose'
import { Quiz } from '../../models/quiz.model'

export default class QuizListItemResponseDTO {
    id?: Schema.Types.ObjectId
    title: string
    description: string
    userId: string
    questionsCount: number

    static fromModel(quizModel: Quiz): QuizListItemResponseDTO {
        const dto = new this()
        dto.id = quizModel._id
        dto.title = quizModel.title
        dto.description = quizModel.description
        dto.userId = quizModel.userId
        dto.questionsCount = quizModel.questions.length
        return dto
    }
}
