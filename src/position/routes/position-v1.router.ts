// Express
import { Router } from 'express'

// Controller
import { PositionControllerV1 } from '@/position/controllers/position-v1.controller'

// Middleware
import { appAuthMiddleware } from '@/app/middlewares/app-auth.middleware'

// Initialize anything
const router = Router()
const positionControllerV1 = new PositionControllerV1()
const { index } = positionControllerV1

router.get('/', appAuthMiddleware, index.config)

export { router as positionV1Routes }
