// Express
import { NextFunction, Request, Response } from 'express'

// JWT
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

// Errors
import { ErrorBase } from '@/app/errors'

// Prisma
import { Prisma } from '@prisma/client'

// Logger
import { appLogger } from '@/app/logger/app-logger'

const appErrorMiddleware = (
	err: Error,
	req: Request,
	res: Response,
	// eslint-disable-next-line
	next: NextFunction
) => {
	appLogger.error(
		`===app-error.middleware.ts===: ${
			JSON.stringify(err?.message) || JSON.stringify(err)
		}`
	)

	// Common Error
	if (err instanceof ErrorBase) {
		return res.status(err.statusCode).json({ errors: err.serializeErrors() })
	}

	// JWT Error Expired
	if (err instanceof TokenExpiredError) {
		return res.status(401).json({ errors: [{ message: err.message }] })
	}

	// JWT Error
	if (err instanceof JsonWebTokenError) {
		return res.status(400).json({ errors: [{ message: err.message }] })
	}

	// ==== Prisma Error
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		return res.status(500).json({
			errors: [
				{ message: `Prisma.PrismaClientKnownRequestError: ${err.message}` }
			]
		})
	}
	if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		return res.status(500).json({
			errors: [
				{
					message: `Prisma.PrismaClientUnknownRequestError: ${err.message}`
				}
			]
		})
	}
	if (err instanceof Prisma.PrismaClientRustPanicError) {
		return res.status(500).json({
			errors: [{ message: `Prisma.PrismaClientRustPanicError: ${err.message}` }]
		})
	}
	if (err instanceof Prisma.PrismaClientInitializationError) {
		return res.status(500).json({
			errors: [
				{
					message: `Prisma.PrismaClientInitializationError: ${err.message}`
				}
			]
		})
	}
	if (err instanceof Prisma.PrismaClientValidationError) {
		return res.status(500).json({
			errors: [
				{ message: `Prisma.PrismaClientValidationError: ${err.message}` }
			]
		})
	}
	// ==== End Prisma Error

	res
		.status(500)
		.json({ errors: [{ message: 'Something went wrong in server' }] })
}

export { appErrorMiddleware }
