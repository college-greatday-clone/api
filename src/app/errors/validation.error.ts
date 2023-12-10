// Error
import { ErrorBase, ISerializeErrorResponse } from './base.error'

// Express Validator
import { ValidationError as ExpressErrorValidation } from 'express-validator'

class ErrorValidation extends ErrorBase {
	statusCode = 422

	constructor(private errors: ExpressErrorValidation[]) {
		super()

		Object.setPrototypeOf(this, ErrorValidation.prototype)
	}

	serializeErrors(): ISerializeErrorResponse[] {
		return this.errors.map(({ msg, ...rest }) => ({
			message: msg,
			...rest
		}))
	}
}

export { ErrorValidation }
