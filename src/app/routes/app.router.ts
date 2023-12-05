// Express
import { Express, Request, Response } from 'express'

// Routes
import { authV1Routes } from '@/auth/routes/auth-v1.router'

// Responses
import { ErrorNotFound } from '@/app/errors'

/**
 * @description Generate routes for the application
 *
 * @param {Express} app
 *
 * @return {void} void
 */
export const routesInit = (app: Express): void => {
	app.get('/', (req: Request, res: Response) => {
		res.status(200).json({ message: 'Welcome to Great Day Clone!' })
	})

	app.use('/api/v1/auth', authV1Routes)

	// Catch any error
	app.all('*', () => {
		throw new ErrorNotFound()
	})
}
