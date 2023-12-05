// App
import { app } from './app'

// Prisma
import { PrismaClient } from '@prisma/client'

// Logger
import { appLogger } from './app/logger/app-logger'

// PORT
const PORT = process.env.PORT

// Init prisma
const prisma = new PrismaClient()

const start = async () => {
	try {
		if (!process.env.JWT_KEY) throw new Error('JWT_KEY is not defined!')
		if (!process.env.JWT_REFRESH_KEY)
			throw new Error('JWT_REFRESH_KEY is not defined!')
		if (!process.env.SMTP_TO_EMAIL)
			throw new Error('SMTP_TO_EMAIL is not defined!')
		if (!process.env.SMTP_TO_PASSWORD)
			throw new Error('SMTP_TO_PASSWORD is not defined!')
		if (!process.env.DATABASE_URL)
			throw new Error('DATABASE_URL is not defined!')

		// Check prisma connection
		await prisma.$connect()
		appLogger.info('===app.ts===: Prisma ORM connected!')

		// Run the app
		app.listen(PORT, () => {
			appLogger.info(`===app.ts===: Easy Copies API started at port ${PORT}`)
		})
	} catch (err) {
		appLogger.error(`===app.ts===: ${err}`)
		await prisma.$disconnect()
	}
}

start()
