// Express
import { Router } from 'express'

// Controller
import { EmployeeControllerV1 } from '@/employee/controllers/employee-v1.controller'

// Middleware
import { appAuthMiddleware } from '@/app/middlewares/app-auth.middleware'
import { appValidationMiddleware } from '@/app/middlewares/app-validation.middleware'

// Initialize anything
const router = Router()
const employeeControllerV1 = new EmployeeControllerV1()
const { index, store, update, employeePicList } = employeeControllerV1

router.get('/', appAuthMiddleware, index.config)
router.post(
	'/',
	appAuthMiddleware,
	store.validateInput,
	appValidationMiddleware,
	store.config
)
router.get('/company-user/pic', appAuthMiddleware, employeePicList)
router.patch(
	'/company-user/:id',
	appAuthMiddleware,
	update.validateInput,
	appValidationMiddleware,
	update.config
)

export { router as employeeV1Routes }
