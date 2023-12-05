// Declare ENV
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

// Express
import express from 'express'
import 'express-async-errors'

// Route List
import { routesInit } from './app/routes/app.router'

// Middlewares
import { appErrorMiddleware } from './app/middlewares/app-error.middleware'
import { appLoggerMiddleware } from './app/middlewares/app-logger.middleware'
import { appLoggerStream } from './app/logger/app-logger'

// Morgan Body
import morganBody from 'morgan-body'

// Cors
import cors from 'cors'

// App Init
const app = express()

// Init Cors
app.use(cors())

// Accept JSON request from user
app.use(express.json({ limit: '100mb' }))

// Init Logger
app.use(appLoggerMiddleware)
morganBody(app, {
	stream: appLoggerStream
})

// Init Routes
routesInit(app)

// Catch any error inside the app
app.use(appErrorMiddleware)

export { app }
