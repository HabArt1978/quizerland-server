import { NextFunction, Request, Response } from 'express'
import UserModel, { User } from '../modules/users/models/user.model'
import TokenModel from '../modules/auth/models/token.model'

export default async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    // Достаём токен из cookie
    const token = req.cookies['auth.token'] as string | undefined
    if (!token) {
        res.status(401).json({ message: 'Пользователь не авторизован' }).send()
        return
    }
    // Проверяем, есть ли токен ( из cookie ) в db
    const verifiedToken = await TokenModel.findOne({ token })
    // Если токен есть, находим пользователя с id === userId из токена
    const currentUser = await UserModel.findById(verifiedToken?.userId)
    if (!currentUser) {
        res.status(403)
            .json({ message: 'Пользователь не зарегистрирован' })
            .send()
        return
    }

    User.setCurrentUser(currentUser)

    next()
}
