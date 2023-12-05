// Error
import { ErrorBase, ISerializeErrorResponse } from './base.error'

class ErrorForbidden extends ErrorBase {
	statusCode = 403

	constructor(message?: string) {
		super(message)

		Object.setPrototypeOf(this, ErrorForbidden.prototype)
	}

	serializeErrors(): ISerializeErrorResponse[] {
		return [{ message: this.message || 'Forbidden' }]
	}
}

export { ErrorForbidden }
