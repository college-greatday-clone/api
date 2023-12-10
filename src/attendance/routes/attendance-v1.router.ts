// Express
import { Router } from 'express'

// Controller
import { AttendanceControllerV1 } from '@/attendance/controllers/attendance-v1.controller'

// Middleware
import { appAuthMiddleware } from '@/app/middlewares/app-auth.middleware'
import { appValidationMiddleware } from '@/app/middlewares/app-validation.middleware'

// Initialize anything
const router = Router()
const attendanceControllerV1 = new AttendanceControllerV1()
const { attend } = attendanceControllerV1

router.patch(
	'/attend',
	appAuthMiddleware,
	attend.validateInput,
	appValidationMiddleware,
	attend.config
)

export { router as attendanceV1Routes }
