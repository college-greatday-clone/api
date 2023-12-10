// Express
import { Router } from 'express'

// Controller
import { CompanyRegisterControllerV1 } from '@/company-register/controllers/company-register-v1.controller'

// Middleware
import { appAuthMiddleware } from '@/app/middlewares/app-auth.middleware'

// Initialize anything
const router = Router()
const companyRegisterControllerV1 = new CompanyRegisterControllerV1()
const { index, approve, reject } = companyRegisterControllerV1

router.get('/', appAuthMiddleware, index.config)
router.patch('/approve/:companyId', appAuthMiddleware, approve.config)
router.patch('/decline/:companyId', appAuthMiddleware, reject.config)

export { router as companyRegisterV1Routes }
