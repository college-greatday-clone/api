// Express
import { Express, Request, Response } from 'express'

// Routes
import { authV1Routes } from '@/auth/routes/auth-v1.router'
import { companyRegisterV1Routes } from '@/company-register/routes/company-register-v1.router'
import { employeeV1Routes } from '@/employee/routes/employee-v1.router'
import { attendanceV1Routes } from '@/attendance/routes/attendance-v1.router'
import { positionV1Routes } from '@/position/routes/position-v1.router'

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
	app.use('/api/v1/company-register', companyRegisterV1Routes)
	app.use('/api/v1/employees', employeeV1Routes)
	app.use('/api/v1/attendances', attendanceV1Routes)
	app.use('/api/v1/positions', positionV1Routes)

	// Catch any error
	app.all('*', () => {
		throw new ErrorNotFound()
	})
}
