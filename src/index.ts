import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import log from './utilities/logger'
import router from './router'
import MongoDB from './db/mongodb'

const app = express()
const PORT = process.env.APP_PORT ?? 8000

app.use(express.json())
app.use(cookieParser())
app.use(
    cors({
        credentials: true,
        origin: process.env.CLIENT_URL,
    }),
)
app.use(router)

const start = async (): Promise<void> => {
    try {
        await new MongoDB().connect()

        app.listen(PORT, () => {
            log.info(`Сервер запущен на http://localhost:${PORT}`)
        })
    } catch (error) {
        log.error(error)
    }
}

start()
