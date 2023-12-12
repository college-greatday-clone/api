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
const { list, approvalList, selfAttendance, attend, approve, reject } =
	attendanceControllerV1

router.get('/', appAuthMiddleware, list.config)
router.get('/approval', appAuthMiddleware, approvalList.config)
router.get('/self', appAuthMiddleware, selfAttendance.config)
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
	approve.validateInput,
	appValidationMiddleware,
	approve.config
)
router.patch(
	'/reject/:attendanceApprovalId',
	appAuthMiddleware,
	reject.validateInput,
	appValidationMiddleware,
	reject.config
)

export { router as attendanceV1Routes }
