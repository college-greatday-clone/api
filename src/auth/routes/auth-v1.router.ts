// Express
import { Router } from 'express'

// Controller
import { AuthControllerV1 } from '@/auth/controllers/auth-v1.controller'

// Middleware
import { appAuthMiddleware } from '@/app/middlewares/app-auth.middleware'
import { appValidationMiddleware } from '@/app/middlewares/app-validation.middleware'

// Initialize anything
const router = Router()
const authControllerV1 = new AuthControllerV1()
const { register, login, refreshToken, me } = authControllerV1

router.post(
	'/register',
	register.validateInput,
	appValidationMiddleware,
	register.config
)
router.post(
	'/login',
	login.validateInput,
	appValidationMiddleware,
	login.config
)
router.post(
	'/refresh-token',
	refreshToken.validateInput,
	appValidationMiddleware,
	refreshToken.config
)
router.get('/me', appAuthMiddleware, me)

export { router as authV1Routes }
