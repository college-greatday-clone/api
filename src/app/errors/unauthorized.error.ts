// Error
import { ErrorBase, ISerializeErrorResponse } from './base.error'

class ErrorUnauthorized extends ErrorBase {
	statusCode = 401

	constructor(message?: string) {
		super(message)

		Object.setPrototypeOf(this, ErrorUnauthorized.prototype)
	}

	serializeErrors(): ISerializeErrorResponse[] {
		return [{ message: this.message || 'Unauthorized' }]
	}
}

export { ErrorUnauthorized }
