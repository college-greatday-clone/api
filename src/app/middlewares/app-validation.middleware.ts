// Express
import { Request, Response, NextFunction } from 'express'

// Express Validator
import { validationResult } from 'express-validator'

// Utils
import { ErrorValidation } from '@/app/errors'

const appValidationMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) throw new ErrorValidation(errors.array())

	next()
}

export { appValidationMiddleware }
