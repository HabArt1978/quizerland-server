import mongoose, { Mongoose } from 'mongoose'
import log from '../utilities/logger'

export default class MongoDB {
    private MAX_CONNECTION_ATTEMPTS = 5

    private _connection?: Mongoose

    public get connection(): Mongoose | undefined {
        return this._connection
    }

    public async connect(): Promise<Mongoose> {
        const { DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } =
            process.env as Record<string, string>

        const dbUri = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`

        let attempts = 0
        const attemptConnect = async (): Promise<Mongoose> => {
            try {
                return await mongoose.connect(dbUri)
            } catch (err: any) {
                if (++attempts >= this.MAX_CONNECTION_ATTEMPTS) {
                    throw err
                }
                return await new Promise((resolve, reject) =>
                    setTimeout(() => {
                        attemptConnect().then(resolve)
                    }, 5000),
                )
            }
        }

        log.info('База данных подключена')
        this._connection = await attemptConnect()

        return this._connection
    }
}
