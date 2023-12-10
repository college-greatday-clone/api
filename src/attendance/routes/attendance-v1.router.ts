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
const { approvalList, attend, approve, reject } = attendanceControllerV1

router.get('/', appAuthMiddleware, approvalList.config)
router.patch(
	'/attend',
	appAuthMiddleware,
	attend.validateInput,
	appValidationMiddleware,
	attend.config
)
router.patch(
	'/approve/:attendanceApprovalId',
	appAuthMiddleware,
	approve.config
)
router.patch('/reject/:attendanceApprovalId', appAuthMiddleware, reject.config)

export { router as attendanceV1Routes }
