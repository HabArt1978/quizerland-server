import args from 'args'
import mongoose from 'mongoose'
import { faker } from '@faker-js/faker/locale/ru'
import QuizModel, { Quiz } from '../../modules/quizzes/models/quiz.model'
import { Question } from '../../modules/quizzes/models/question.model'
import log from '../../utilities/logger'
import MongoDB from '../mongodb'

const quizzesSeeder = async (
    quizzesCount: number,
    questionsCount: number,
): Promise<void> => {
    await new MongoDB().connect()

    const randomQuizzes: Quiz[] = []
    const randomQuestions: Question[] = []

    for (let i = 0; i < questionsCount; i++) {
        const questions: Question = {
            text: faker.lorem.paragraph(1),
            rightAnswerIndex: faker.number.int({ min: 0, max: 2 }),
            answers: [
                faker.lorem.words({ min: 1, max: 3 }),
                faker.lorem.words({ min: 1, max: 3 }),
                faker.lorem.words({ min: 1, max: 3 }),
            ],
        }
        randomQuestions.push(questions)
    }

    for (let i = 0; i < quizzesCount; i++) {
        const quiz: Quiz = {
            userId: faker.database.mongodbObjectId(),
            title: faker.lorem.sentence({ min: 3, max: 7 }),
            description: faker.lorem.sentences({ min: 2, max: 5 }),
            questions: randomQuestions,
            createdAt: faker.date.recent().toISOString(),
            updatedAt: faker.date.recent().toISOString(),
        }
        randomQuizzes.push(quiz)
    }

    const seedDB = async (): Promise<void> => {
        await QuizModel.insertMany(randomQuizzes)
    }

    await seedDB()
    log.info('( SEEDER ): Данные успешно загружены')
    mongoose.connection.close()
}

args.option('quizzes', 'Сколько тестов необходимо создать', 1000).option(
    'questions',
    'Сколько вопросов для каждого теста необходимо создать',
    5,
)

const { quizzes, questions } = args.parse(process.argv)

quizzesSeeder(quizzes ?? 1000, questions ?? 5)
